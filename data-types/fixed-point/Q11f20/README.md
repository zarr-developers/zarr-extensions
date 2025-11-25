# Q11f20

A signed 32-bit fixed-point number with 20 fractional bits.

**Status:** proposal

## Data type name

`Q11f20`

## Configuration

This data type represents a signed fixed-point number based on an underlying 32-bit integer.
- **base_type**: `int32`
- **f**: 20 (number of fractional bits)
- **scaling**: by `2^f`
- **range**: `-2048.0` to `2047.999999`

The stored `Int32` value `i` is interpreted as `i / 2^20`. This is equivalent to `Fixed{Int32, 20}` in `FixedPointNumbers.jl`.

## Fill value representation

The `fill_value` for this data type SHOULD be represented as a JSON number with the value to be represented.
To represent the underlying integer bits exactly, the `fill_value` MAY be provided as a hexadecimal string representing the underlying integer (e.g., "0x00000000" for a fill value of 0).
There are no `NaN` or `Infinity` values for fixed-point types.
## Codec compatibility

This data type is stored as an `int32`. It is expected to be compatible with any codec that can handle the `int32` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
