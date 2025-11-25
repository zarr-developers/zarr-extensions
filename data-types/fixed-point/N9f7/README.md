# N9f7

An unsigned 16-bit "normed" fixed-point number with 7 fractional bits.

**Status:** proposal

## Data type name

`N9f7`

## Configuration

This data type represents an unsigned "normed" fixed-point number based on an underlying 16-bit integer.
- **base_type**: `uint16`
- **f**: 7 (number of fractional bits)
- **scaling**: by `2^f - 1`
- **range**: `0.0` to `516.024`

The stored `UInt16` value `i` is interpreted as `i / (2^7 - 1)`. This is equivalent to `Normed{UInt16, 7}` in `FixedPointNumbers.jl`.

## Fill value representation

The `fill_value` for this data type should be represented as a floating-point number in the JSON metadata.

## Codec compatibility

This data type is stored as an `uint16`. It is expected to be compatible with any codec that can handle the `uint16` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
