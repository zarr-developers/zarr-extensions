# N37f27

An unsigned 64-bit "normed" fixed-point number with 27 fractional bits.

**Status:** proposal

## Data type name

`N37f27`

## Configuration

This data type represents an unsigned "normed" fixed-point number based on an underlying 64-bit integer.
- **base_type**: `uint64`
- **f**: 27 (number of fractional bits)
- **scaling**: by `2^f - 1`
- **range**: `0.0` to `1.37438954496e11`

The stored `UInt64` value `i` is interpreted as `i / (2^27 - 1)`. This is equivalent to `Normed{UInt64, 27}` in `FixedPointNumbers.jl`.

## Fill value representation

The `fill_value` for this data type SHOULD be represented as a JSON number with the value to be represented.
To represent the underlying integer bits exactly, the `fill_value` MAY be provided as a hexadecimal string representing the underlying integer (e.g., "0x0000000000000000" for a fill value of 0).
There are no `NaN` or `Infinity` values for fixed-point types.
## Codec compatibility

This data type is stored as an `uint64`. It is expected to be compatible with any codec that can handle the `uint64` data type.

## See also

- [`fixed_point/` directory](../) for other fixed-point types.
- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute
