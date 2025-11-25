# Q14f1

A signed 16-bit fixed-point number with 1 fractional bit.

**Status:** proposal

## Data type name

`Q14f1`

## Configuration

This data type represents a signed fixed-point number based on an underlying 16-bit integer.
- **base_type**: `int16`
- **f**: 1 (number of fractional bits)
- **scaling**: by `2^f`
- **range**: `-16384.0` to `16383.5`

The stored `Int16` value `i` is interpreted as `i / 2^1`. This is equivalent to `Fixed{Int16, 1}` in `FixedPointNumbers.jl`.

## Fill value representation

The `fill_value` for this data type should be represented as a floating-point number in the JSON metadata.

## Codec compatibility

This data type is stored as an `int16`. It is expected to be compatible with any codec that can handle the `int16` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
