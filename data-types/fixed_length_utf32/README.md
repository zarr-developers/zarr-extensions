# Fixed-length UTF-32 string data type

Defines a data type for fixed-length UTF-32 strings. Each element of an array
with this data type is a Unicode string with a fixed maximum number of code
points, encoded as a fixed-size sequence of UTF-32 code units.

## Background

This data type is designed for compatibility with
[NumPy's fixed-width string dtype](https://numpy.org/doc/stable/reference/arrays.dtypes.html)
(`numpy.str_`, spelled `<U` or `>U`). NumPy stores each element of such an array
as a fixed number of 4-byte UTF-32 code units, zero-padding strings that are
shorter than the declared width. The `fixed_length_utf32` data type is the
Zarr V3 representation of exactly this NumPy dtype.

The NumPy fixed-width string dtype is also the native string dtype used by
Zarr V2. Specifying `fixed_length_utf32` therefore gives Zarr V3 a well-defined,
interoperable representation for string data originating from Zarr V2 arrays: a
Zarr V2 dtype such as `"<U12"` corresponds to the Zarr V3 `fixed_length_utf32`
data type with a `length_bytes` of `48`.

This data type is distinct from the variable-length
[`string`](../string/README.md) data type, whose elements have no fixed encoded
size.

## Data type representation

### Name

The name of this data type is the string `"fixed_length_utf32"`.

### Configuration

This data type requires a configuration object. The configuration object MUST
contain a single key, `"length_bytes"`, whose value is a positive integer that
is a multiple of `4`. It defines the fixed encoded size, in bytes, of every
scalar of this data type.

Because UTF-32 uses 4 bytes per code point, the maximum number of code points
per scalar is `length_bytes / 4`. The smallest permitted value of
`length_bytes` is `4`, corresponding to a capacity of one code point.

### Example

The example below shows a fragment of array metadata for an array whose
elements are fixed-length UTF-32 strings holding up to 12 code points
(`length_bytes` of `48`):

```json
{
    "data_type": {
        "name": "fixed_length_utf32",
        "configuration": {
            "length_bytes": 48
        }
    },
    "fill_value": "",
    "codecs": [{
        "name": "bytes",
        "configuration": {"endian": "little"}
    }]
}
```

## Bytes codec encoding

When the `bytes` codec is used, each scalar is encoded as exactly
`length_bytes / 4` code points. Each code point is encoded as a 4-byte UTF-32
code unit. The code points of the string are written in order; if the string
contains fewer than `length_bytes / 4` code points, the remaining code points
are filled with `U+0000` (the four bytes `0x00 0x00 0x00 0x00`) after the
string content. This zero-padding matches the behavior of NumPy's fixed-width
string dtype.

As a concrete example, consider a `fixed_length_utf32` data type with a
`length_bytes` of `12` (a capacity of three code points) holding the string
`"Hi"`. The string contributes the code points `U+0048` and `U+0069`, and the
third code point is zero-padding:

```
 byte:  0   1   2   3   4   5   6   7   8   9  10  11
      ├───────────────┼───────────────┼───────────────┤
 code:│    U+0048     │    U+0069     │    U+0000     │
 point│     'H'       │     'i'       │   (padding)   │
      └───────────────┴───────────────┴───────────────┘
```

The total encoded size of the scalar is `length_bytes` (here, 12 bytes),
regardless of the length of the string it holds.

### Endianness

Each UTF-32 code unit is a 4-byte value, so its byte order MUST be specified.
The byte order is determined by the `endian` parameter of the array-to-bytes
codec (for example, `{"name": "bytes", "configuration": {"endian": "little"}}`).
The codec MUST be configured with an explicit `endian` setting. The data type
configuration itself does not carry endianness information.

## JSON scalar encoding

A scalar of this data type is encoded in JSON as a JSON string. The string is
the sequence of Unicode code points held by the scalar, in order, with any
trailing `U+0000` padding code points removed.

A JSON string is a valid encoding of a scalar of this data type only if it
contains at most `length_bytes / 4` code points. Decoding a JSON string with
more than `length_bytes / 4` code points is invalid and MUST be rejected. A
JSON string with fewer than `length_bytes / 4` code points decodes to the
scalar whose remaining code points are `U+0000` padding, consistent with the
bytes codec encoding described above.

For example, with a `length_bytes` of `48` (a capacity of 12 code points), the
JSON string `"foo"` encodes the scalar containing the code points `U+0066`,
`U+006F`, `U+006F` followed by nine `U+0000` padding code points.

## Fill value representation

The value of the `fill_value` metadata key MUST be a valid
[JSON scalar encoding](#json-scalar-encoding) of a scalar of this data type:
that is, a JSON string of at most `length_bytes / 4` code points.

```json
"fill_value": "foo"
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

> **Note:** `length_bytes` is always a multiple of 4 because UTF-32 uses 4 bytes
> per code point.

> **Note:** Strings shorter than the scalar capacity are padded with `U+0000`
> code points. This matches the layout of NumPy's fixed-width string dtype and
> ensures round-trip compatibility with NumPy and Zarr V2 string arrays.

> **Note:** This data type is distinct from the variable-length
> [`string`](../string/README.md) data type. Use `fixed_length_utf32` when a
> fixed per-element size is required, such as for NumPy or Zarr V2
> compatibility.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
