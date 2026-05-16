# `fixed_size_list` data type — design

## Summary

Register a new Zarr v3 data type extension named `fixed_size_list`. Each scalar
of this data type is a fixed-length, positional sequence of values of a single
inner ("base") data type. The design mirrors Apache Arrow's
[`FixedSizeList`](https://arrow.apache.org/docs/format/Columnar.html#fixed-size-list-layout)
layout.

## Motivation

Many Zarr use cases want each array element to be an N-tuple of a homogeneous
type — RGB(A) pixels, fixed-length feature embeddings, small mathematical
vectors, quaternions, and so on. Today these are typically modeled either by
adding a trailing array dimension (which conflates per-scalar structure with
array shape, chunking, and indexing) or by using `struct` with N identically
typed named fields (which adds per-element JSON keys and is awkward when the
fields have no meaningful names).

`fixed_size_list` is the homogeneous, positional counterpart to
[`struct`](../../../data-types/struct/README.md): it expresses "each scalar is
a fixed-length tuple of the same inner data type" directly, with positional
encoding and no per-position naming overhead.

## Non-goals

- Variable-length lists. A variable-length list type is a separate extension.
- Lists of variable-length inner data types (e.g. `string`). The encoded size
  of a `fixed_size_list` scalar must be fixed and known when the array is
  opened.
- A NumPy-shaped subarray dtype (`("float32", (3,))`) compatibility layer.
  Implementations MAY map to/from such dtypes, but the spec is defined
  independently in terms of Arrow semantics.

## Data type representation

The data type is represented in array metadata as the value of the `data_type`
metadata key. The value MUST be a JSON object with the following fields:

| field | type | required |
| - | - | - |
| `name` | Literal `"fixed_size_list"` | yes |
| `configuration` | [Configuration](#configuration) | yes |

### Configuration

The `configuration` field is a JSON object with the following fields:

| field | type | required | notes |
| - | - | - | - |
| `base_data_type` | Zarr v3 data type representation — a string for core data types, or an object with `name` and `configuration` for parametrized extension data types | yes | MUST be a data type whose encoded size in bytes is fixed and known at the time the array is opened. Variable-length data types (e.g. `string`) MUST NOT be used. |
| `list_size` | integer ≥ 1 | yes | The number of `base_data_type` scalars contained in each `fixed_size_list` scalar. The field name matches Apache Arrow's `FixedSizeList::list_size`. |

`base_data_type` MAY itself be `fixed_size_list` or `struct`, enabling
recursive nesting (e.g. a list of structs, or a list of lists).

The total encoded size in bytes of a `fixed_size_list` scalar is
`sizeof(base_data_type) * list_size`.

### Example

```json
{
  "data_type": {
    "name": "fixed_size_list",
    "configuration": {
      "base_data_type": "float32",
      "list_size": 3
    }
  },
  "fill_value": [0.0, 0.0, 0.0],
  "codecs": [{
    "name": "bytes",
    "configuration": {"endian": "little"}
  }]
}
```

A parametrized inner type uses the object form for `base_data_type`:

```json
{
  "name": "fixed_size_list",
  "configuration": {
    "base_data_type": {
      "name": "numpy.datetime64",
      "configuration": {"unit": "s", "scale_factor": 1}
    },
    "list_size": 4
  }
}
```

A nested example — a list of 2D points, each point itself a `struct`:

```json
{
  "name": "fixed_size_list",
  "configuration": {
    "base_data_type": {
      "name": "struct",
      "configuration": {
        "fields": [
          {"name": "x", "data_type": "float32"},
          {"name": "y", "data_type": "float32"}
        ]
      }
    },
    "list_size": 16
  }
}
```

## Bytes codec encoding

When the `bytes` codec is used, each `fixed_size_list` scalar is encoded as
the packed concatenation of `list_size` encoded `base_data_type` values in
position order, with no padding between elements.

The total encoded size of a `fixed_size_list` scalar is
`sizeof(base_data_type) * list_size` bytes.

### Endianness

A `fixed_size_list` adds no endianness rules of its own. Byte-order behavior
is inherited from the `base_data_type`:

- If `base_data_type` is a multi-byte numeric type (e.g. `float32`, `int32`),
  the `bytes` codec MUST be configured with an explicit `endian` setting, and
  every encoded element uses that byte order.
- If `base_data_type` is single-byte (e.g. `uint8`, `int8`, `bool`), the
  `endian` configuration MAY be omitted.

### Layout example

For `base_data_type: "float32"` and `list_size: 3`, the encoded byte layout
of one scalar is 12 bytes — three contiguous IEEE 754 single-precision values
in the codec's chosen byte order:

```
 byte:  0   1   2   3   4   5   6   7   8   9  10  11
      ├───────────────┼───────────────┼───────────────┤
      │    elem[0]    │    elem[1]    │    elem[2]    │
      │   (float32)   │   (float32)   │   (float32)   │
      └───────────────┴───────────────┴───────────────┘
```

## JSON scalar encoding

A scalar of this data type is encoded in JSON as a JSON array of exactly
`list_size` entries. Each entry MUST be a valid JSON encoding of a scalar of
`base_data_type`.

A JSON value is a valid encoding of a `fixed_size_list` scalar only if it is
a JSON array, its length is exactly `list_size`, and every entry is a valid
JSON encoding of the base data type. JSON arrays with a different length, or
with any invalid entry, MUST be rejected.

For example, with `base_data_type: "float32"` and `list_size: 3`:

```json
[1.0, 2.5, -3.0]
```

## Fill value representation

The value of the `fill_value` metadata key MUST be a valid
[JSON scalar encoding](#json-scalar-encoding) of a scalar of this data type:
a JSON array of exactly `list_size` entries, each a valid fill value for
`base_data_type`.

```json
"fill_value": [0.0, 0.0, 0.0]
```

There is no scalar-broadcast shorthand. Per-position fill values must be
written out explicitly. This matches `struct`'s requirement that every field
have an explicit fill value, and avoids ambiguity for extension base types
whose "zero" or "default" value is not well defined.

## Codec compatibility

This data type is compatible with any array-to-bytes codec that encodes each
array element as a contiguous, fixed-size binary blob of
`sizeof(base_data_type) * list_size` bytes. The
[`bytes`](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/bytes/index.html)
codec is the standard choice. Byte-manipulation codecs (for example, `gzip`,
`zstd`, `blosc`) MAY be applied on top for compression.

Variable-length codecs (for example,
[`vlen-utf8`](../../../codecs/vlen-utf8/README.md) and
[`vlen-bytes`](../../../codecs/vlen-bytes/README.md)) are NOT compatible with
this data type, as they do not encode elements at a fixed size.

## Relationship to other constructs

- **`struct`** — `fixed_size_list` is the homogeneous, positional counterpart
  of `struct`. A `fixed_size_list` with `list_size = N` is conceptually a
  `struct` of `N` identically typed unnamed fields, encoded the same way at
  the byte level but represented more compactly in metadata and JSON.
- **An extra array dimension** — adding a trailing axis to the outer Zarr
  array also yields a per-element tuple, but conflates per-scalar structure
  with array shape: that trailing axis participates in chunking, indexing,
  and shape metadata. `fixed_size_list` keeps the tuple structure inside the
  scalar, so the outer array's shape and chunk grid describe only the
  user-facing element count.
- **Apache Arrow `FixedSizeList`** — the data model and `list_size` field
  name are drawn from Arrow. This data type is intended as the Zarr v3
  representation of Arrow `FixedSizeList` arrays whose child type is a
  fixed-size Zarr v3 data type.

## Deliverables

- `data-types/fixed_size_list/README.md` — the specification document
  following the structure and tone of existing data type READMEs
  (`struct`, `fixed_length_utf32`).
- `data-types/fixed_size_list/schema.json` — JSON Schema for validation,
  following the `struct/schema.json` pattern (with an inner-dtype `$defs`
  block to allow either a string or an object form for `base_data_type`).

## Open questions

None at design time.
