# N19f45

An unsigned 64-bit "normed" fixed-point number with 45 fractional bits.

**Status:** proposal

## Data type name

`N19f45`

## Configuration

This data type represents an unsigned "normed" fixed-point number based on an underlying 64-bit integer.
- **base_type**: `uint64`
- **f**: 45 (number of fractional bits)
- **scaling**: by `2^f - 1`
- **range**: `0.0` to `524288.000000015`

The stored `UInt64` value `i` is interpreted as `i / (2^45 - 1)`. This is equivalent to `Normed{UInt64, 45}` in `FixedPointNumbers.jl`.

## Fill value representation

The `fill_value` for this data type should be represented as a floating-point number in the JSON metadata.

## Codec compatibility

This data type is stored as an `uint64`. It is expected to be compatible with any codec that can handle the `uint64` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
