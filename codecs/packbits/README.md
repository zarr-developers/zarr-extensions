# packbits codec

Defines an `array -> bytes` codec that packs together values that are
represented by a fixed number of bits that is not necessarily a multiple of 8.

## Codec name

The value of the `name` member in the codec object MUST be `packbits`.

## Configuration parameters

### `padding_encoding` (Optional)

Specifies how the number of padding bits is encoded, such that the number of
decoded elements may be determined from the encoded representation alone.

Must be one of:
- `"first_byte"`, indicating that the first byte specifies the number of padding
  bits that were added;
- `"last_byte"`, indicating that the final byte specifies the number of padding
  bits that were added;
- `"none"` (default), indicating that the number of padding bits is not encoded.
  In this case, the number of decoded elements cannot be determined from the
  encoded representation alone.

While zarr itself does not need to be able to recover the number of decoded
elements from the encoded representation alone, because this information can be
propagated from the metadata through any prior codecs in the chain, it may still
be useful as an additional sanity check or for non-zarr uses of the codec.

A value of `"first_byte"` provides compatibility with the [numcodecs packbits
codec](https://github.com/zarr-developers/numcodecs/blob/3c933cf19d4d84f2efc5f3a36926d8c569514a90/numcodecs/packbits.py#L7)
defined for zarr v2 (which only supports `bool`).

### `first_bit` (Optional)

Specifies the index (starting from the least-significant bit) of the first bit
to be encoded.  If omitted, or specified as `null`, defaults to `0`.

### `last_bit` (Optional)

Specifies the index (starting from the least-significant bit) of the (inclusive)
last bit to be encoded. If omitted, or specified as `null`, defaults to `N - 1`,
where `N` is the total number of bits per component of the data type (specified
below).

It is invalid for `last_bit` to be less than `first_bit`.

Note: for complex number data types, `first_bit` and `last_bit` apply to the
real and imaginary coefficients separately.

## Format and algorithm

This is an `array -> bytes` codec.

### Encoding/decoding of individual array elements

Each element of the array is encoded as a fixed number of bits, `k`, where `k`
is determined from the data type, `first_bit`, and `last_bit`. Specifically

```
b := last_bit - first_bit + 1,
k := num_components * b,
```

where `num_components` is determined by the data type (2 for complex number data
types, 1 for all other data types).

Note: If `first_bit` and `last_bit` are both unspecified, `b == N`.

Logically, to encode an element of the array, each component is first encoded as
an `N`-bit value (retaining all bits). From this `N`-bit value, the `b` bits
from `first_bit` to `last_bit` are then extracted.

To decode an element of the array, the `b` encoded bits are first shifted to
`first_bit`.  Depending on the data type, the value is then:

- sign-extended (for signed integer data types), or
- zero-extended (all other data types)

up to `N` bits.

### Encoding and decoding multiple

- Array elements are encoded in lexicographical order, to produce a bit
  sequence; element `i` corresponds to bits `[i * k, (i+1) * k)` within the
  sequence.
- The bit sequence is padded with 0 bits to ensure its length is a multiple of
  8 bits.
- Encoded byte `i` corresponds to bits `[i * 8, (i+1) * 8)` within the sequence.
- If `padding_encoding` is `"first_byte"`, a single byte specifying
  the number of padding bits that were added is prepended to the encoded byte
  sequence.
- If `padding_encoding` is `"last_byte"`, a single byte specifying the number of
  padding bits that were added is appended to the encoded byte sequence.

## Supported data types

- bool (encoded as 1 bit)
- int2, uint2 (encoded as 2 bits)
- int4, uint4, float4_e2m1fn (encoded as 4 bits)
- float6_e2m3fn, float6_e3m2fn (encoded as 6 bits)
- complex_float4_e2m1fn (encoded as 2 4-bit components)
- complex_float6_e2m3fn, complex_float6_e3m2fn (encoded as 2 6-bit components)
- int8, uint8, int16, uint16, int32, uint32, int64, uint64, float32, float64,
  bfloat16, complex_float32, complex_float64, complex_bfloat16 (encoded using
  their little-endian representation as with the "bytes" codec)

  Note: For these types, if `first_bit` and `last_bit` are not used to limit the
  number of bits that are encoded, this codec does not provide any benefit over
  the `"bytes"` codec but is supported nonetheless for uniformity.

## Change log

No changes yet.

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
