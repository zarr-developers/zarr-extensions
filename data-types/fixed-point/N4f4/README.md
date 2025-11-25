# N4f4

An unsigned 8-bit "normed" fixed-point number with 4 fractional bits.

**Status:** proposal

## Data type name

`N4f4`

## Configuration

This data type represents an unsigned "normed" fixed-point number based on an underlying 8-bit integer.
- **base_type**: `uint8`
- **f**: 4 (number of fractional bits)
- **scaling**: by `2^f - 1`
- **range**: `0.0` to `17.0`

The stored `UInt8` value `i` is interpreted as `i / (2^4 - 1)`. This is equivalent to `Normed{UInt8, 4}` in `FixedPointNumbers.jl`.

## Fill value representation

The `fill_value` for this data type should be represented as a floating-point number in the JSON metadata. For example: `"fill_value": 8.2`.

## Codec compatibility

This data type is stored as a `uint8`. It is expected to be compatible with any codec that can handle the `uint8` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
