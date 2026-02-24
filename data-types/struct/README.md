# Struct data type

This document defines `struct`, a data type for arrays whose elements are
fixed-size records composed of named, typed fields — commonly referred to as
"structured arrays" or "record arrays".

The `struct` data type closely models NumPy's
[structured arrays](https://numpy.org/doc/stable/user/basics.rec.html), where
each element consists of multiple named fields, each with its own data type.

## Background

Structured arrays allow a single array to represent tabular or record-like data
without using separate arrays per column. For example, a geospatial dataset
might store `(latitude: float64, longitude: float64, elevation: float32)` as a
single structured array rather than three separate arrays.

Each element of a structured array is a scalar of a fixed size in bytes. The
size is the sum of the sizes of all fields.

## Data type representation

### Name

The name of this data type is the string `"struct"`.

> **Backwards compatibility:** The name `"structured"` MUST be treated as a
> read-only alias for `"struct"`. Implementations MUST be able to read arrays
> whose metadata uses `"structured"` as the data type name, but MUST NOT write
> new arrays using `"structured"`.

### Configuration

This data type requires a configuration object. The configuration object MUST
contain a `"fields"` key whose value is a JSON array of fields.

Each field MUST be a 2-element JSON array `[field_name, field_dtype]`, where:

- `field_name` MUST be a non-empty string that identifies the field. Field names
  MUST be unique within the same `struct` data type; nested `struct`
  types have independent namespaces.
- `field_dtype` MUST be a valid Zarr v3 data type representation whose size in
  bytes is fixed and known at the time the array is opened:
  - For [core data types](https://zarr-specs.readthedocs.io/en/latest/v3/data-types/index.html#core-data-types),
    this MUST be a string (e.g. `"float32"`, `"int32"`, `"uint8"`).
  - For extension data types that require configuration (e.g. `numpy.datetime64`),
    this MUST be an object with a `"name"` key and a `"configuration"` key.
  - Variable-length data types (e.g. `"string"`) MUST NOT be used as field
    types, as they do not have a fixed encoded size.

The `"fields"` array MUST contain at least one field.

The `struct` data type MAY be used recursively: a field's data type MAY
itself be `"struct"`, enabling nested record types.

### Examples

The following is an example of array metadata for an array of 2D point
records, each with an `x` and a `y` coordinate stored as 32-bit floats:

```json
{
  "zarr_format": 3,
  "node_type": "array",
  "shape": [100],
  "data_type": {
    "name": "struct",
    "configuration": {
      "fields": [
        ["x", "float32"],
        ["y", "float32"]
      ]
    }
  },
  "chunk_grid": {
    "name": "regular",
    "configuration": {"chunk_shape": [100]}
  },
  "chunk_key_encoding": {"name": "default"},
  "fill_value": {"x": 0.0, "y": 0.0},
  "codecs": [{"name": "bytes", "configuration": {"endian": "little"}}]
}
```

The remaining examples show only the `configuration` object for brevity.

The following shows a field using a parametrized data type. The `timestamp`
field uses [`numpy.datetime64`](../numpy.datetime64/README.md), which requires
a `configuration` object specifying `unit` and `scale_factor`:

```json
{
  "fields": [
    [
      "timestamp",
      {
        "name": "numpy.datetime64",
        "configuration": {
          "unit": "s",
          "scale_factor": 1
        }
      }
    ],
    ["value", "float32"]
  ]
}
```

The following shows a nested `struct` field. The outer record has a `point`
field that is itself a `struct` type with `x` and `y` sub-fields, plus a
scalar `value` field:

```json
{
  "fields": [
    [
      "point",
      {
        "name": "struct",
        "configuration": {
          "fields": [
            ["x", "float32"],
            ["y", "float32"]
          ]
        }
      }
    ],
    ["value", "float64"]
  ]
}
```

## Bytes codec encoding

When the `bytes` codec is used, each `struct` scalar is encoded as the packed
concatenation of the encoded bytes of each field's value, in field declaration
order. No padding bytes are inserted between fields,
regardless of alignment considerations.

For nested `struct` types, encoding proceeds depth-first: each field is
encoded completely before the next sibling field. A nested `struct` field
is encoded as the packed concatenation of its own sub-fields, recursively.

The total encoded size of a `struct` scalar in bytes is the sum of the
encoded sizes of all fields.

As a concrete example, consider the following `struct` type:

```json
{
  "fields": [
    ["id",    "int32"],
    ["flags", "uint8"],
    ["value", "float64"]
  ]
}
```

The encoded byte layout is:

```
 byte:  0   1   2   3   4   5   6   7   8   9  10  11  12
      ├───────────────┼───┼───────────────────────────────┤
field:│      id       │ f │            value              │
      │   (int32)     │   │          (float64)            │
      └───────────────┴───┴───────────────────────────────┘
```

The total encoded size is 4 + 1 + 8 = 13 bytes, with field byte offsets of
0, 4, and 5 respectively.

For nested `struct` types, the same principle applies recursively. Consider:

```json
{
  "fields": [
    ["point", {
      "name": "struct",
      "configuration": {
        "fields": [["x", "float32"], ["y", "float32"]]
      }
    }],
    ["value", "float64"]
  ]
}
```

The nested `point` field is encoded completely (all sub-fields) before `value`:

```
 byte:  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
      ├───────────────┼───────────────┼───────────────────────────────┤
field:│    point.x    │    point.y    │            value              │
      │   (float32)   │   (float32)   │          (float64)            │
      └───────────────┴───────────────┴───────────────────────────────┘
```

The total encoded size is (4 + 4) + 8 = 16 bytes, with `point` at offset 0
(containing `x` at 0, `y` at 4) and `value` at offset 8.

### Endianness

When a `struct` type contains multi-byte numeric fields, the `bytes` codec
MUST be configured with an explicit `endian` setting
(e.g. `{"name": "bytes", "configuration": {"endian": "little"}}`). All
multi-byte fields MUST use the byte order specified by the `endian` parameter.

`Struct` types composed entirely of single-byte fields (e.g. `uint8`,
`int8`) have no byte-order ambiguity and MAY omit the `endian` configuration.

> **Legacy compatibility:** Arrays where the `bytes` codec has no `endian`
> configuration (i.e. `{"name": "bytes"}` with no `configuration` key) SHOULD
> be treated as little-endian by implementations. Implementations SHOULD warn
> when `endian` is absent for `struct` types with multi-byte numeric fields.

## Fill value representation

The `fill_value` for arrays with the `struct` data type MUST be a JSON
object mapping each field name to its fill value. Every field defined in the
`struct` type MUST have a corresponding entry in the fill value object.
Each field's value MUST be a valid fill value for that field's data type.

> **Note:** Explicit fill values are required for all fields because implicit
> defaults (such as "zero") are ambiguous for extension data types. For
> example, a NumPy `datetime64` initialized with zero represents the Unix
> epoch, whereas a C++ datetime implementation might default to a null or
> invalid state. Requiring explicit fill values ensures consistent behavior
> across implementations and future extensions.

```json
"fill_value": {"x": 1.23, "y": 4.56}
```

For nested `struct` fields, the value must itself be an object mapping the
nested field names to their fill values:

```json
"fill_value": {"point": {"x": 1.0, "y": 2.0}, "value": 3.14}
```

> **Legacy compatibility:** Existing arrays may encode the fill value as a
> [base64](https://en.wikipedia.org/wiki/Base64)-encoded string of the raw
> packed bytes (e.g. `"AAAAAAAAAAA="` for 8 zero bytes). The byte order of
> these packed bytes follows the `endian` parameter of the `bytes` codec, or
> little-endian if `endian` is absent. Implementations SHOULD support reading
> this form for backward compatibility, but MUST NOT write it for new arrays.

## Codec compatibility

The `struct` data type works with any array-to-bytes codec that encodes each
array element as a contiguous, fixed-size binary blob equal to the total encoded
size of the struct. The `bytes` codec is the standard choice for this role.
Other array-to-bytes codecs (for example, a future per-field encoding codec)
MAY be used provided they satisfy this constraint. Byte-manipulation codecs
(e.g. `gzip`, `zstd`, `blosc`) MAY be applied on top for compression.

Variable-length codecs (e.g. `vlen-utf8`) are not compatible with the
`struct` data type.

## Notes

> **Note:** Fields are packed contiguously with no inter-field padding. This
> matches the default NumPy structured dtype layout. NumPy's "aligned"
> structured dtype layout (created with `align=True`), which inserts padding
> for memory alignment, is NOT supported by this specification.

> **Note:** Field names MUST be unique within a `struct` data type.
> Implementations MUST reject `struct` types with duplicate field names.

> **Note:** The order of fields in the `"fields"` array is significant and
> MUST be preserved. Fields are encoded in declaration order.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
