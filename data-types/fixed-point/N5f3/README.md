# N5f3

An unsigned 8-bit "normed" fixed-point number with 3 fractional bits.

**Status:** proposal

## Data type name

`N5f3`

## Configuration

This data type represents an unsigned "normed" fixed-point number based on an underlying 8-bit integer.
- **base_type**: `uint8`
- **f**: 3 (number of fractional bits)
- **scaling**: by `2^f - 1`
- **range**: `0.0` to `36.4`

The stored `UInt8` value `i` is interpreted as `i / (2^3 - 1)`. This is equivalent to `Normed{UInt8, 3}` in `FixedPointNumbers.jl`.

## Fill value representation

The `fill_value` for this data type SHOULD be represented as a JSON number with the value to be represented.
To represent the underlying integer bits exactly, the `fill_value` MAY be provided as a hexadecimal string representing the underlying integer (e.g., "0x00" for a fill value of 0).
There are no `NaN` or `Infinity` values for fixed-point types.
## Codec compatibility

This data type is stored as a `uint8`. It is expected to be compatible with any codec that can handle the `uint8` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
