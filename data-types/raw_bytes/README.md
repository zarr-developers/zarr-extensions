# Raw bytes data type

Defines a data type for fixed-length sequences of uninterpreted bytes. Each
element of an array with this data type is an opaque byte sequence of exactly
`length_bytes` bytes.

## Background

This data type is designed for compatibility with
[NumPy's void dtype](https://numpy.org/doc/stable/reference/arrays.scalars.html#numpy.void)
without fields (`numpy.void`, spelled `|V<n>`). NumPy stores each element of
such an array as a fixed number of bytes and attaches no meaning to them. The
`raw_bytes` data type is the Zarr V3 representation of exactly this NumPy dtype.

The NumPy void dtype is also the native fixed-width opaque dtype used by Zarr
V2. A Zarr V2 dtype such as `"|V10"` corresponds to the Zarr V3 `raw_bytes`
data type with a `length_bytes` of `10`.

NumPy void dtypes *with* fields (structured dtypes) are not represented by this
data type; see the [`struct`](../struct/README.md) data type.

The Zarr V3 core specification defines a similar data type, the
[`r*` raw bits data type](https://zarr-specs.readthedocs.io/en/latest/v3/core/index.html#data-types),
which has the same in-memory and encoded layout. See
[Relationship to `r*`](#relationship-to-r).

## Data type representation

A `raw_bytes` data type is represented in array metadata as the value of the
`data_type` metadata key. The value must be a JSON object with the following
fields:

| field | type | required |
| - | - | - |
| `name` | Literal `"raw_bytes"` | yes |
| `configuration` | [Configuration](#configuration) | yes |

### Configuration

The `configuration` field is a JSON object with the following fields:

| field | type | required | notes |
| - | - | - | - |
| `length_bytes` | positive integer | yes | The fixed size, in bytes, of every scalar of this data type. |

The smallest permitted value of `length_bytes` is `1`.

### Example

The example below shows a fragment of array metadata for an array whose
elements are raw byte sequences of 3 bytes each:

```json
{
    "data_type": {
        "name": "raw_bytes",
        "configuration": {
            "length_bytes": 3
        }
    },
    "fill_value": "AQID",
    "codecs": [{
        "name": "bytes"
    }]
}
```

## Bytes codec encoding

When the `bytes` codec is used, each scalar is encoded as its `length_bytes`
bytes, in order, with no padding, terminator or length prefix. Elements are
concatenated in the order defined by the `bytes` codec.

For example, a one-dimensional chunk of three `raw_bytes` elements with a
`length_bytes` of `3` holding `0x61 0x62 0x63`, `0x00 0x00 0x01` and
`0x78 0x79 0x00` is encoded as the 9 bytes:

```
61 62 63 00 00 01 78 79 00
```

A byte sequence has no byte order. The `endian` configuration of the `bytes`
codec has no effect on this data type and may be omitted.

## JSON scalar encoding

A scalar of this data type is encoded in JSON as a string produced by applying
[base64 encoding](https://datatracker.ietf.org/doc/html/rfc4648#section-4)
(RFC 4648, standard alphabet, with `=` padding) to its `length_bytes` bytes.

A JSON string is a valid encoding of a scalar of this data type only if it is
valid base64 that decodes to exactly `length_bytes` bytes. Readers must reject
any other value.

For example, with a `length_bytes` of `3`, the scalar `0x01 0x02 0x03` is
encoded as `"AQID"`.

## Fill value representation

The value of the `fill_value` metadata key must be a valid
[JSON scalar encoding](#json-scalar-encoding) of a scalar of this data type.

```json
"fill_value": "AAAA"
```

## Codec compatibility

This data type is compatible with any array-to-bytes codec that encodes each
array element as a contiguous, fixed-size binary blob of `length_bytes` bytes.
The [`bytes`](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/bytes/index.html)
codec is the standard choice for this role. Bytes-to-bytes codecs (for example,
`gzip`, `zstd`, `blosc`) may be applied after it.

Variable-length codecs such as [`vlen-bytes`](../../codecs/vlen-bytes/README.md)
are not compatible with this data type.

## Relationship to `r*`

The core `r*` data type with `* = 8 × length_bytes` (for example `"r24"` for
`length_bytes` of `3`) describes the same set of values and is encoded
identically by the `bytes` codec. The two differ only in metadata:

| | `raw_bytes` | `r*` |
| - | - | - |
| size parameter | `configuration.length_bytes`, in bytes | encoded in the name, in bits |
| fill value | base64 string | JSON array of integers in `[0, 255]` |

Arrays may be converted between the two by rewriting `data_type` and
`fill_value` only; chunk data does not change. Consolidating the two is tracked
in [zarr-extensions#61](https://github.com/zarr-developers/zarr-extensions/issues/61).

## Implementations

- [zarr-python](https://github.com/zarr-developers/zarr-python) (`zarr.core.dtype.RawBytes`), which
  reads and writes this data type for NumPy `|V<n>` arrays.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
