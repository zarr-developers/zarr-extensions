# N7f1

An unsigned 8-bit "normed" fixed-point number with 1 fractional bit.

**Status:** proposal

## Data type name

`N7f1`

## Configuration

This data type represents an unsigned "normed" fixed-point number based on an underlying 8-bit integer.
- **base_type**: `uint8`
- **f**: 1 (number of fractional bits)
- **scaling**: by `2^f - 1`
- **range**: `0.0` to `255.0`

The stored `UInt8` value `i` is interpreted as `i / (2^1 - 1)`, which is identical to `i`. This is equivalent to `Normed{UInt8, 1}` in `FixedPointNumbers.jl` and is functionally identical to the `uint8` data type.

## Fill value representation

The `fill_value` for this data type should be represented as an integer or floating-point number in the JSON metadata. For example: `"fill_value": 12`.

## Codec compatibility

This data type is stored as a `uint8`. It is expected to be compatible with any codec that can handle the `uint8` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
