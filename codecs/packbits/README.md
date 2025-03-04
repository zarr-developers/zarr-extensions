# packbits codec

Defines an `array -> bytes` codec that packs together values that are
represented by a fixed number of bits that is not a multiple of 8.

## Codec name

The value of the `name` member in the codec object MUST be `packbits`.

## Configuration parameters

### `padding_encoding` (Optional)

Specifies how the number of padding bits is encoded, such that the number of
decoded elements may be determined from the encoded representation alone.

Must be one of:
- `"start_byte"`, indicating that the first byte specifies the number of padding
  bits that were added;
- `"end_byte"`, indicating that the final byte specifies the number of padding
  bits that were added;
- `"none"` (default), indicating that the number of padding bits is not encoded.
  In this case, the number of decoded elements cannot be determined from the
  encoded representation alone.

While zarr itself does not need to be able to recover the number of decoded
elements from the encoded representation alone, because this information can be
propagated from the metadata through any prior codecs in the chain, it may still
be useful as an additional sanity check or for non-zarr uses of the codec.

A value of `"start_byte"` provides compatibility with the [numcodecs packbits
codec](https://github.com/zarr-developers/numcodecs/blob/3c933cf19d4d84f2efc5f3a36926d8c569514a90/numcodecs/packbits.py#L7)
defined for zarr v2 (which only supports `bool`).

## Format and algorithm

This is an `array -> bytes` codec.

- Each element of the array is encoded as a fixed number of bits, `k`.
- Array elements are encoded in lexicographical order, to produce a bit
  sequence; element `i` corresponds to bits `[i * k, (i+1) * k)` within the
  sequence.
- The bit sequence is padded with 0 bits to ensure its length is a multiple of
  8 bits.
- Encoded byte `i` corresponds to bits `[i * 8, (i+1) * 8)` within the sequence.
- If `padding_encoding` is `"start_byte"`, a single byte specifying
  the number of padding bits that were added is prepended to the encoded byte
  sequence.
- If `padding_encoding` is `"end_byte"`, a single byte specifying the number of
  padding bits that were added is appended to the encoded byte sequence.

## Supported data types

- bool (encoded as 1 bit)
- int2, uint2 (encoded as 2 bits)
- int4, uint4, float4_e2m1fn (encoded as 4 bits)
- float6_e2m3fn, float6_e3m2fn (encoded as 6 bits)
- complex_float4_e2m1fn (encoded as 8 bits)
- complex_float6_e2m3fn, complex_float6_e3m2fn (encoded as 12 bits)

## Change log

No changes yet.

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
