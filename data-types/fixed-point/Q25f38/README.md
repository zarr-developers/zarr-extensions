# Q25f38

A signed 64-bit fixed-point number with 38 fractional bits.

**Status:** proposal

## Data type name

`Q25f38`

## Configuration

This data type represents a signed fixed-point number based on an underlying 64-bit integer.
- **base_type**: `int64`
- **f**: 38 (number of fractional bits)
- **scaling**: by `2^f`
- **range**: `-3.3554432e7` to `3.3554432e7`

The stored `Int64` value `i` is interpreted as `i / 2^38`. This is equivalent to `Fixed{Int64, 38}` in `FixedPointNumbers.jl`.

## Fill value representation

The `fill_value` for this data type should be represented as a floating-point number in the JSON metadata.

## Codec compatibility

This data type is stored as an `int64`. It is expected to be compatible with any codec that can handle the `int64` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
