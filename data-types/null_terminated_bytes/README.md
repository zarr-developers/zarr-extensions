# Null-terminated bytes data type

Defines a data type for fixed-length, null-terminated byte strings. Each element
of an array with this data type is a byte string of a fixed encoded size, where
a trailing run of zero bytes is treated as padding.

## Background

This data type is designed for compatibility with
[NumPy's fixed-width bytes dtype](https://numpy.org/doc/stable/reference/arrays.scalars.html#numpy.bytes_)
(`numpy.bytes_`, spelled `|S<n>`). NumPy stores each element of such an array as
a fixed number of bytes, zero-padding byte strings that are shorter than the
declared width and treating a trailing run of zero bytes as padding
(null-termination). The `null_terminated_bytes` data type is the Zarr V3
representation of exactly this NumPy dtype.

The NumPy fixed-width bytes dtype is also the native fixed-width bytes dtype
used by Zarr V2. Specifying `null_terminated_bytes` therefore gives Zarr V3 a
well-defined, interoperable representation for fixed-width byte-string data
originating from Zarr V2 arrays: a Zarr V2 dtype such as `"|S10"` corresponds to
the Zarr V3 `null_terminated_bytes` data type with a `length_bytes` of `10`.

Because of the null-termination semantics, a trailing run of zero bytes in a
value is not recoverable: a value and the same value with additional trailing
zero bytes are indistinguishable once stored. This data type is therefore best
suited to NumPy and Zarr V2 compatibility. It is distinct from the
variable-length [`bytes`](../bytes/README.md) data type, whose elements have no
fixed encoded size and which preserves trailing zero bytes.

## Data type representation

A `null_terminated_bytes` data type is represented in array metadata as the
value of the `data_type` metadata key. The value MUST be a JSON object with the
following fields:

| field | type | required |
| - | - | - |
| `name` | Literal `"null_terminated_bytes"` | yes |
| `configuration` | [Configuration](#configuration) | yes |

### Configuration

The `configuration` field is a JSON object with the following fields:

| field | type | required | notes |
| - | - | - | - |
| `length_bytes` | positive integer | yes | The fixed encoded size, in bytes, of every scalar of this data type. See [`length_bytes`](#length_bytes). |

#### `length_bytes`

`length_bytes` defines the fixed encoded size, in bytes, of every scalar of this
data type. It is a raw byte count: every scalar occupies exactly `length_bytes`
bytes when encoded. The smallest permitted value of `length_bytes` is `1`.

### Example

The example below shows a fragment of array metadata for an array whose elements
are fixed-length null-terminated byte strings of 10 bytes each (`length_bytes`
of `10`):

```json
{
    "data_type": {
        "name": "null_terminated_bytes",
        "configuration": {
            "length_bytes": 10
        }
    },
    "fill_value": "",
    "codecs": [{
        "name": "bytes"
    }]
}
```

## Bytes codec encoding

When the `bytes` codec is used, each scalar is encoded as exactly `length_bytes`
bytes. The bytes of the value are written in order; if the value contains fewer
than `length_bytes` bytes, the remaining bytes are filled with `0x00` after the
value's content. This zero-padding matches the behavior of NumPy's fixed-width
bytes dtype.

On decoding, a trailing run of `0x00` bytes is stripped (null-termination).
Consequently, a trailing run of zero bytes in the original value is not
recoverable.

As a concrete example, consider a `null_terminated_bytes` data type with a
`length_bytes` of `5` holding the byte string `b"Hi"` (the two bytes `0x48`
`0x69`). The value contributes its two bytes, and the remaining three bytes are
zero-padding:

```
 byte:  0    1    2    3    4
      ├────┼────┼────┼────┼────┤
value:│0x48│0x69│0x00│0x00│0x00│
      │'H' │'i' │      padding │
      └────┴────┴────┴────┴────┘
```

The total encoded size of the scalar is `length_bytes` (here, 5 bytes),
regardless of the length of the value it holds.

## Endianness

A byte string is a sequence of single bytes and has no byte order. No `endian`
configuration of the array-to-bytes codec is relevant to this data type.

## JSON scalar encoding

A scalar of this data type is encoded in JSON as a string produced by applying
[base64 encoding](https://en.wikipedia.org/wiki/Base64) to the bytes of the
scalar, with any trailing `0x00` padding bytes removed before encoding.

A string is a valid encoding of a scalar of this data type only if it is valid
base64 that decodes to at most `length_bytes` bytes. Decoding a string that
yields more than `length_bytes` bytes is invalid and MUST be rejected. A string
that decodes to fewer than `length_bytes` bytes decodes to the scalar whose
remaining bytes are `0x00` padding, consistent with the bytes codec encoding
described above. The empty string `""` is a valid encoding: it is valid base64
that decodes to zero bytes, and it denotes the scalar whose bytes are all `0x00`
padding (equivalently, the empty byte string).

For example, with a `length_bytes` of `10`, the byte string `b"Hi"` is encoded
as the base64 string `"SGk="`, which decodes to the bytes `0x48 0x69` followed
by eight `0x00` padding bytes.

## Fill value representation

The value of the `fill_value` metadata key MUST be a valid
[JSON scalar encoding](#json-scalar-encoding) of a scalar of this data type:
that is, a base64 string that decodes to at most `length_bytes` bytes.

```json
"fill_value": "SGk="
```

## Codec compatibility

This data type is compatible with any array-to-bytes codec that encodes each
array element as a contiguous, fixed-size binary blob of `length_bytes` bytes.
The [`bytes`](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/bytes/index.html)
codec is the standard choice for this role. Byte-manipulation codecs (for
example, `gzip`, `zstd`, `blosc`) MAY be applied on top for compression.

Variable-length codecs (for example, [`vlen-utf8`](../../codecs/vlen-utf8/README.md)
and [`vlen-bytes`](../../codecs/vlen-bytes/README.md)) are NOT compatible with
this data type, as they do not encode elements at a fixed size.

## Notes

> **Note:** Values shorter than `length_bytes` are padded with `0x00` bytes, and
> a trailing run of `0x00` bytes is stripped on decoding. This matches the
> behavior of NumPy's fixed-width bytes dtype and ensures round-trip
> compatibility with NumPy and Zarr V2 byte-string arrays. As a consequence,
> trailing zero bytes of a value are not preserved.

> **Note:** This data type is distinct from the variable-length
> [`bytes`](../bytes/README.md) data type. Use `null_terminated_bytes` when a
> fixed per-element size is required, such as for NumPy or Zarr V2
> compatibility, and the loss of trailing zero bytes is acceptable.

## References

- [`numpy.bytes_`](https://numpy.org/doc/stable/reference/arrays.scalars.html#numpy.bytes_)
  — the NumPy fixed-width bytes scalar type that this data type mirrors.
- [NumPy data type objects](https://numpy.org/doc/stable/reference/arrays.dtypes.html)
  — describes the `|S` dtype string syntax used by Zarr V2.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
