# Q23f40

A signed 64-bit fixed-point number with 40 fractional bits.

**Status:** proposal

## Data type name

`Q23f40`

## Configuration

This data type represents a signed fixed-point number based on an underlying 64-bit integer.
- **base_type**: `int64`
- **f**: 40 (number of fractional bits)
- **scaling**: by `2^f`
- **range**: `-8.388608e6` to `8.388608e6`

The stored `Int64` value `i` is interpreted as `i / 2^40`. This is equivalent to `Fixed{Int64, 40}` in `FixedPointNumbers.jl`.

## Fill value representation

The `fill_value` for this data type SHOULD be represented as a JSON number with the value to be represented.
To represent the underlying integer bits exactly, the `fill_value` MAY be provided as a hexadecimal string representing the underlying integer (e.g., "0x0000000000000000" for a fill value of 0).
There are no `NaN` or `Infinity` values for fixed-point types.
## Codec compatibility

This data type is stored as an `int64`. It is expected to be compatible with any codec that can handle the `int64` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
