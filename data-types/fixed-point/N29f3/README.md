# N29f3

An unsigned 32-bit "normed" fixed-point number with 3 fractional bits.

**Status:** proposal

## Data type name

`N29f3`

## Configuration

This data type represents an unsigned "normed" fixed-point number based on an underlying 32-bit integer.
- **base_type**: `uint32`
- **f**: 3 (number of fractional bits)
- **scaling**: by `2^f - 1`
- **range**: `0.0` to `6.135667564e8`

The stored `UInt32` value `i` is interpreted as `i / (2^3 - 1)`. This is equivalent to `Normed{UInt32, 3}` in `FixedPointNumbers.jl`.

## Fill value representation

The `fill_value` for this data type should be represented as a floating-point number in the JSON metadata.

## Codec compatibility

This data type is stored as an `uint32`. It is expected to be compatible with any codec that can handle the `uint32` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
