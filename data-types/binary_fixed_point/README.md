# Binary Fixed-Point Data Type

A parameterized data type for binary fixed-point numbers.

**Status:** proposal

## Data type name

`binary_fixed_point`

## Configuration

This data type represents a binary fixed-point number based on an underlying integer type.
It is defined by a base integer type, the number of fractional bits, and the number of integer bits.

- **`base_data_type`**: The underlying integer data type. Must be one of `uint8`, `uint16`, `uint32`, `uint64`, `int8`, `int16`, `int32`, `int64`.
- **`fractional_bits`**: The number of bits representing the fractional part.
- **`integer_bits`**: The number of bits representing the integer part.

It is sufficient to provide either `fractional_bits` or `integer_bits` in the configuration, as the other can be derived from the bit width of the `base_data_type`. If both are provided, they must be consistent with the bit width of the `base_data_type`.

## Interpretation

The value is interpreted as:
$$ v = i \times 2^{-f} $$
where $i$ is the integer value stored in the `base_data_type` and $f$ is `fractional_bits`.

- If `base_data_type` is signed, $i$ is a signed integer.
- If `base_data_type` is unsigned, $i$ is an unsigned integer.

## Q Notation

Fixed-point numbers are commonly described using "Q notation", often written as `Qn.m`. To avoid ambiguity, we define the relationship between the `Qn.m` notation and this data type's parameters as follows:

- **`n`** (the first number) corresponds to **`integer_bits`**.
- **`m`** (the second number) corresponds to **`fractional_bits`**.

### Relationship to Base Data Type

The choice of `base_data_type` (bit width $W$) limits the possible values for `integer_bits` and `fractional_bits`.

- **Signed Types (`int*`)**:
  The underlying type must accommodate the sign bit, integer bits, and fractional bits.
  $$ W = 1 + \text{integer\_bits} (n) + \text{fractional\_bits} (m) $$
  *Example:* `Q1.14` (1 integer, 14 fractional) requires $1 + 1 + 14 = 16$ bits, fitting into `int16`.

- **Unsigned Types (`uint*`)**:
  The underlying type must accommodate the integer bits and fractional bits. Unsigned fixed-point is sometimes denoted as `UQn.m`.
  $$ W = \text{integer\_bits} (n) + \text{fractional\_bits} (m) $$
  *Example:* `UQ8.8` (8 integer, 8 fractional) requires $8 + 8 = 16$ bits, fitting into `uint16`.

## Fill value representation

The `fill_value` SHOULD be represented as a JSON number with the value to be represented.
To represent the underlying integer bits exactly, the `fill_value` MAY be provided as a hexadecimal string representing the underlying integer (e.g., `"0x0000"`).

## Examples

| Configuration | Q Notation | Description | Range (approx) |
|---|---|---|---|
| `{"base_data_type": "int16", "fractional_bits": 15, "integer_bits": 0}` | Q0.15 | Signed 16-bit, 15 fractional bits | -1.0 to 0.99997 |
| `{"base_data_type": "uint16", "fractional_bits": 8, "integer_bits": 8}` | UQ8.8 | Unsigned 16-bit, 8 fractional bits | 0.0 to 255.996 |
| `{"base_data_type": "int32", "fractional_bits": 16, "integer_bits": 15}` | Q15.16 | Signed 32-bit, 16 fractional bits | -32768.0 to 32767.99998 |

## See also

- [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl) (Note: roughly corresponds to `Fixed{T, f}`)
- [Rust `fixed` crate](https://crates.io/crates/fixed)

## Current maintainers

- Mark Kittisopikul (@mkitti), Howard Hughes Medical Institute