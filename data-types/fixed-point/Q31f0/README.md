# Q31f0

A signed 32-bit fixed-point number with 0 fractional bits.

**Status:** proposal

## Data type name

`Q31f0`

## Configuration

This data type represents a signed fixed-point number based on an underlying 32-bit integer.
- **base_type**: `int32`
- **f**: 0 (number of fractional bits)
- **scaling**: by `2^f`
- **range**: `-2.147483648e9` to `2.147483647e9`

The stored `Int32` value `i` is interpreted as `i / 2^0`. This is equivalent to `Fixed{Int32, 0}` in `FixedPointNumbers.jl`.

## Fill value representation

The `fill_value` for this data type should be represented as a floating-point number in the JSON metadata.

## Codec compatibility

This data type is stored as an `int32`. It is expected to be compatible with any codec that can handle the `int32` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
