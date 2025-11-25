# Q7f0

A signed 8-bit fixed-point number with 0 fractional bits.

**Status:** proposal

## Data type name

`Q7f0`

## Configuration

This data type represents a signed fixed-point number based on an underlying 8-bit integer.
- **base_type**: `int8`
- **f**: 0 (number of fractional bits)
- **scaling**: by `2^f`
- **range**: `-128.0` to `127.0`

The stored `Int8` value `i` is interpreted as `i / 2^0`, which is identical to `i`. This is equivalent to `Fixed{Int8, 0}` in `FixedPointNumbers.jl` and is functionally identical to the `int8` data type.

## Fill value representation

The `fill_value` for this data type SHOULD be represented as a JSON number with the value to be represented.
To represent the underlying integer bits exactly, the `fill_value` MAY be provided as a hexadecimal string representing the underlying integer (e.g., "0x00" for a fill value of 0).
There are no `NaN` or `Infinity` values for fixed-point types.
## Codec compatibility

This data type is stored as an `int8`. It is expected to be compatible with any codec that can handle the `int8` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
