# N59f5

An unsigned 64-bit "normed" fixed-point number with 5 fractional bits.

**Status:** proposal

## Data type name

`N59f5`

## Configuration

This data type represents an unsigned "normed" fixed-point number based on an underlying 64-bit integer.
- **base_type**: `uint64`
- **f**: 5 (number of fractional bits)
- **scaling**: by `2^f - 1`
- **range**: `0.0` to `5.950562604422436e17`

The stored `UInt64` value `i` is interpreted as `i / (2^5 - 1)`. This is equivalent to `Normed{UInt64, 5}` in `FixedPointNumbers.jl`.

## Fill value representation

The `fill_value` for this data type should be represented as a floating-point number in the JSON metadata.

## Codec compatibility

This data type is stored as an `uint64`. It is expected to be compatible with any codec that can handle the `uint64` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
