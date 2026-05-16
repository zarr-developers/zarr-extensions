# `fixed_size_list` data type

Defines a data type for fixed-length, positional sequences of a single inner
("base") data type. Each scalar of a `fixed_size_list` array is a tuple of
exactly `list_size` values, all of the same `base_data_type`.

## Background

`fixed_size_list` models Apache Arrow's
[`FixedSizeList`](https://arrow.apache.org/docs/format/Columnar.html#fixed-size-list-layout)
layout. It is the homogeneous, positional counterpart to the
[`struct`](../struct/README.md) data type: where `struct` describes a
heterogeneous record with named fields, `fixed_size_list` describes a
homogeneous tuple with positional elements.

Typical use cases include RGB(A) pixels, fixed-length feature embeddings,
small mathematical vectors, and quaternions — anywhere each array element
is naturally an N-tuple of values of the same type, and N is known in
advance.

## Data type representation

A `fixed_size_list` data type is represented in array metadata as the
value of the `data_type` metadata key. The value MUST be a JSON object with
the following fields:

| field | type | required |
| - | - | - |
| `name` | Literal `"fixed_size_list"` | yes |
| `configuration` | [Configuration](#configuration) | yes |

### Configuration

The `configuration` field is a JSON object with the following fields:

| field | type | required | notes |
| - | - | - | - |
| `base_data_type` | A Zarr v3 data type representation: a string for core data types, or an object with a `name` key (and an optional `configuration` key) for extension data types | yes | The data type of each element of the list. MUST be a data type whose encoded size in bytes is fixed and known at the time the array is opened. Variable-length data types (e.g. [`string`](../string/README.md)) MUST NOT be used. See [`base_data_type`](#base_data_type). |
| `list_size` | integer ≥ 1 | yes | The number of `base_data_type` scalars contained in each `fixed_size_list` scalar. See [`list_size`](#list_size). |

#### `base_data_type`

Variable-length data types (e.g. [`string`](../string/README.md)) MUST NOT
be used as the `base_data_type`, as they do not have a fixed encoded size.

`base_data_type` MAY itself be `fixed_size_list` or
[`struct`](../struct/README.md), enabling nested composite types (for
example, a fixed-size list of structs, or a fixed-size list of fixed-size
lists).

#### `list_size`

`list_size` is the number of `base_data_type` scalars contained in each
`fixed_size_list` scalar. It MUST be an integer greater than or equal
to `1`. The field name matches Apache Arrow's `FixedSizeList::list_size`.

## JSON scalar encoding

A scalar of this data type is encoded in JSON as a JSON array of exactly
`list_size` entries. Each entry MUST be a valid JSON encoding of a scalar
of `base_data_type`, in position order.

A JSON value is a valid encoding of a `fixed_size_list` scalar only if it
is a JSON array whose length is exactly `list_size` and whose every entry
is a valid JSON encoding of `base_data_type`. JSON arrays with a different
length, or with any invalid entry, MUST be rejected.

For example, with `base_data_type` of `"float32"` and `list_size` of `3`:

```json
[1.0, 2.5, -3.0]
```

## Fill value representation

The value of the `fill_value` metadata key MUST be a valid
[JSON scalar encoding](#json-scalar-encoding) of a scalar of this data
type: a JSON array of exactly `list_size` entries, each a valid fill value
for `base_data_type`.

```json
"fill_value": [0.0, 0.0, 0.0]
```

There is no scalar-broadcast shorthand. Per-position fill values MUST be
written out explicitly. This matches the [`struct`](../struct/README.md)
requirement that every field have an explicit fill value, and avoids
ambiguity for extension base types whose "zero" or "default" value is not
well defined.

## Examples

The example below shows a fragment of array metadata for an array whose
elements are 3-tuples of `float32` (for example, RGB pixels or 3D points):

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

A nested example — a list of 16 2D points, each point represented as a
`struct` with `x` and `y` `float32` fields:

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

## Codec compatibility

This data type is compatible with any array-to-bytes codec that encodes
each array element as a contiguous, fixed-size binary blob of
`sizeof(base_data_type) * list_size` bytes. The
[`bytes`](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/bytes/index.html)
codec is the standard choice for this role. Byte-manipulation codecs (for
example, `gzip`, `zstd`, `blosc`) MAY be applied on top for compression.

Variable-length codecs (for example,
[`vlen-utf8`](../../codecs/vlen-utf8/README.md) and
[`vlen-bytes`](../../codecs/vlen-bytes/README.md)) are NOT compatible with
this data type, as they do not encode elements at a fixed size.

### Bytes codec encoding

When the `bytes` codec is used, each `fixed_size_list` scalar is encoded as
the packed concatenation of `list_size` encoded `base_data_type` values, in
position order, with no padding between elements.

The total encoded size of a `fixed_size_list` scalar is
`sizeof(base_data_type) * list_size` bytes.

As a concrete example, consider a `fixed_size_list` with
`base_data_type` of `"float32"` and `list_size` of `3`. Each scalar is
encoded as 12 bytes — three contiguous IEEE 754 single-precision values in
the codec's chosen byte order:

```
 byte:  0   1   2   3   4   5   6   7   8   9  10  11
      ├───────────────┼───────────────┼───────────────┤
      │    elem[0]    │    elem[1]    │    elem[2]    │
      │   (float32)   │   (float32)   │   (float32)   │
      └───────────────┴───────────────┴───────────────┘
```

#### Endianness

A `fixed_size_list` adds no endianness rules of its own. Byte-order behavior
is inherited from the `base_data_type`:

- If `base_data_type` is a multi-byte numeric type (e.g. `float32`,
  `int32`), the `bytes` codec MUST be configured with an explicit `endian`
  setting (e.g. `{"name": "bytes", "configuration": {"endian": "little"}}`),
  and every encoded element uses that byte order.
- If `base_data_type` is single-byte (e.g. `uint8`, `int8`, `bool`), the
  `endian` configuration MAY be omitted.
- If `base_data_type` is itself a compound data type (e.g.
  [`struct`](../struct/README.md) or `fixed_size_list`), endianness is
  governed by the rules of that inner data type. In practice this means
  the `bytes` codec MUST be configured with an explicit `endian` setting
  whenever the compound type contains any multi-byte numeric leaf, and
  MAY omit it when every leaf is single-byte.

## Notes

> **Note:** A `fixed_size_list` with `list_size` of `N` shares the same
> bytes-codec encoding as a [`struct`](../struct/README.md) of `N`
> identically typed unnamed fields, but is more compact in metadata and
> uses positional JSON arrays rather than named JSON objects.

> **Note:** `fixed_size_list` is distinct from adding a trailing axis to
> the outer Zarr array. A trailing axis participates in the array's shape,
> chunk grid, and indexing; `fixed_size_list` keeps the tuple structure
> inside the scalar, so the outer array's shape describes only the
> user-facing element count.

## References

- [Apache Arrow Columnar Format — Fixed-Size List Layout](https://arrow.apache.org/docs/format/Columnar.html#fixed-size-list-layout)
  — the data model and `list_size` field name are drawn from Arrow.
- [`struct`](../struct/README.md) — the heterogeneous, named-field
  counterpart to this data type.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
