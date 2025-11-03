# bitround codec

Defines an `array -> array` codec to bit-round floating-point numbers and integers.

## Codec name

The value of the `name` member in the codec object MUST be `bitround` or a recognised alias.

### Aliases
#### `numcodecs.bitround` (Deprecated)

Implementations may accept `numcodecs.bitround` as an alias for this codec.
However, it is considered deprecated and `numcodecs.bitround` SHOULD NOT be used to store new data.

## Configuration parameters

### `keepbits` (Required)

An integer specifying the number of bits to keep after rounding. Must be at least 1.

For floating-point data types, this specifies the number of bits of the mantissa to retain.

For integer data types, this specifies the number of bits to retain from the most significant set bit.

## Example

For example, the array metadata below specifies that the array contains bitrounded chunks:

```json
{
    "codecs": [{
        "name": "bitround",
        "configuration": {
            "keepbits": 10
        }
    }, { "name": "bytes", "configuration": { "endian": "little" } }]
}
```

## Format and algorithm

This is an `array -> array` codec that reduces the precision of numeric data to improve compressibility.

### Floating-point data types

For floating-point values, the codec rounds the mantissa to the specified number of bits (`keepbits`). This operation:
- Preserves the sign and exponent
- Rounds the mantissa, keeping only `keepbits` bits

### Integer data types

For integer values, the codec rounds from the most significant set bit. This operation:
- Identifies the most significant bit that is set
- Keeps `keepbits` bits starting from that position
- Rounds the remaining lower-order bits to zero

### Effect on compression

By reducing precision, the `bitround` codec creates repeated patterns in the binary representation of the data, which may improve the compression ratio when used with subsequent bytes-to-bytes compression codecs (such as `gzip`, `zstd`, or `blosc`).

## Supported data types

### Floating-point types

- `float16`, `float32`, `float64`
- `bfloat16`
- `complex_float16`, `complex_float32`, `complex_float64`
- `complex_bfloat16`
- `complex64`, `complex128`

### Integer types

- `int8`, `int16`, `int32`, `int64`
- `uint8`, `uint16`, `uint32`, `uint64`
- `numpy.timedelta64`, `numpy.datetime64` (encoded equivalently to `int64`)

### Other types

Implementations may support other data types that are interpretable as an integer or floating-point representation, or a composition of such primitives.

## Compatibility

This codec is compatible with `numcodecs.bitround` for floating-point data types.
Integer data types are not supported by the `numcodecs.bitround` codec.

## Sample Data

Sample Zarr arrays encoded with the `bitround` codec can be found in the [sample_data](./sample_data) directory.

## Change log

No changes yet.

## Current maintainers

* Lachlan Deakin ([@LDeakin](https://github.com/LDeakin))
