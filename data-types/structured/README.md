# Structured data type

This document defines `structured`, a data type for arrays whose elements are
fixed-size records composed of named, typed fields — commonly referred to as
"structured arrays" or "record arrays".

The `structured` data type closely models NumPy's
[structured arrays](https://numpy.org/doc/stable/user/basics.rec.html), where
each element consists of multiple named fields, each with its own data type.

## Background

Structured arrays allow a single array to represent tabular or record-like data
without using separate arrays per column. For example, a geospatial dataset
might store `(latitude: float64, longitude: float64, elevation: float32)` as a
single structured array rather than three separate arrays.

Each element of a structured array is a scalar of a fixed size in bytes. The
size is the sum of the sizes of all fields. Fields are stored contiguously in
memory in the order they are declared, with no padding bytes between fields.

## Data type representation

### Name

The name of this data type is the string `"structured"`.

### Configuration

This data type requires a configuration object. The configuration object must
have exactly one key, `"fields"`, whose value is a JSON array of fields.

Each field is a 2-element JSON array `[field_name, field_dtype]`, where:

- `field_name` is a non-empty string that identifies the field.
- `field_dtype` is a valid Zarr v3 data type representation:
  - For [core data types](https://zarr-specs.readthedocs.io/en/latest/v3/data-types/index.html#core-data-types),
    this MUST be a string (e.g. `"float32"`, `"int32"`, `"uint8"`).
  - For extension data types that require configuration (e.g. `numpy.datetime64`),
    this MUST be an object with a `"name"` key and a `"configuration"` key.

The `"fields"` array must contain at least one field. Field names must be
unique within a given structured data type.

The `structured` data type may be used recursively: a field's data type may
itself be `"structured"`, enabling nested record types.

### Examples

The following is an example of array metadata for an array of 2D point
records, each with an `x` and a `y` coordinate stored as 32-bit floats:

```json
{
  "zarr_format": 3,
  "node_type": "array",
  "shape": [100],
  "data_type": {
    "name": "structured",
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
  "fill_value": "AAAAAAAAAAA=",
  "codecs": [{"name": "bytes"}]
}
```

The following is an example with heterogeneous field types: a 32-bit integer
identifier, a single byte of bit flags, and a 64-bit floating-point value:

```json
{
  "name": "structured",
  "configuration": {
    "fields": [
      ["id",    "int32"],
      ["flags", "uint8"],
      ["value", "float64"]
    ]
  }
}
```

The following is an example where one field uses a parametrized data type.
The `timestamp` field uses [`numpy.datetime64`](../numpy.datetime64/README.md),
which requires a `configuration` object specifying `unit` and `scale_factor`:

```json
{
  "name": "structured",
  "configuration": {
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
}
```

The following is an example with a nested structured field. The outer record
has a `point` field that is itself a structured type with `x` and `y`
sub-fields, plus a scalar `value` field:

```json
{
  "name": "structured",
  "configuration": {
    "fields": [
      [
        "point",
        {
          "name": "structured",
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
}
```

## Binary layout

The binary encoding of a single structured scalar is the packed concatenation
of the binary encodings of each field's value, in field declaration order. No
padding bytes are inserted between fields, regardless of alignment
considerations.

The total size of a structured scalar in bytes is the sum of the sizes of all
fields.

As a concrete example, the structured type `[("id", int32), ("flags", uint8),
("value", float64)]` has an element size of 4 + 1 + 8 = 13 bytes, with field
offsets of 0, 4, and 5 respectively.

## Fill value representation

The `fill_value` for arrays with the `structured` data type must be a string
produced by applying [base64 encoding](https://en.wikipedia.org/wiki/Base64) to
the raw binary representation of the fill scalar. The binary representation
follows the packed field layout described above.

The base64-encoded string must decode to exactly `item_size` bytes, where
`item_size` is the total byte size of one element of the structured type.

For example, the zero-valued scalar of the type `[("x", float32), ("y",
float32)]` is encoded as `"AAAAAAAAAAA="` (8 zero bytes base64-encoded).

## Codec compatibility

This data type is compatible with any codec that supports a fixed number of
bytes per array element. The `bytes` codec MUST be used as the array-to-bytes
codec. Other codecs (e.g. `gzip`, `zstd`, `blosc`) MAY be applied on top of
the `bytes` codec for compression.

### Endianness handling

The `bytes` codec MUST be configured without an `endian` setting when used
with `structured` arrays (i.e. `{"name": "bytes"}` with no `configuration`
key). Implementations MUST NOT specify an `endian` configuration for the
`bytes` codec when encoding or decoding structured data.

Each field's byte order is determined by the field's own data type and the
implementation's native byte order. For maximum interoperability, all fields
within a structured array SHOULD use the same byte order, and implementations
SHOULD default to little-endian byte order for multi-byte numeric fields.

> **Interoperability note:** The Zarr v3 core specification does not include
> endianness in the data type identifier (e.g. `"float32"` rather than
> `"<f4"` or `">f4"`). Implementations that need to guarantee cross-platform
> compatibility should either:
> - Use only single-byte field types (e.g. `uint8`, `int8`), or
> - Explicitly document the byte order convention used, or
> - Apply byte-swapping during encode/decode to ensure a canonical byte order.

Variable-length codecs (e.g. `vlen-utf8`) are not compatible with the
`structured` data type.

## Notes

> **Note:** Fields are packed contiguously with no inter-field padding. This
> matches the default NumPy structured dtype layout. NumPy's "aligned"
> structured dtype layout (created with `align=True`), which inserts padding
> for memory alignment, is NOT supported by this specification.

> **Note:** Field names MUST be unique within a structured data type.
> Implementations MUST reject structured types with duplicate field names.

> **Note:** The order of fields in the `"fields"` array is significant and
> MUST be preserved. Fields are stored in memory in declaration order.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
