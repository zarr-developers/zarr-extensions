# Fixed-Point Number Data Types

This directory contains proposals for fixed-point number data types for Zarr. These proposals are based on the implementation and naming conventions from [FixedPointNumbers.jl](https://github.com/JuliaMath/FixedPointNumbers.jl).

## Naming Convention

The fixed-point types are named using a convention similar to the `Qm.n` format described in the Texas Instruments document [TMS320C28x IQmath Library (SPRU565B)](https://www.ti.com/lit/ug/spru565b/spru565b.pdf), Appendix A.

To create valid identifiers for programming languages, the `.` is replaced by an `f`. The notations used are:

- **`Qmfn`**: For signed fixed-point numbers.
  - `Q` stands for "quantized" and indicates a signed number.
  - `m` is the number of integer bits (not including the sign bit).
  - `n` is the number of fractional bits.
  - The total number of bits in the underlying signed integer is `m + n + 1`.

- **`Nmfn`**: For unsigned "normed" fixed-point numbers.
  - `N` stands for "normed".
  - `m` is the number of integer bits.
  - `n` is the number of fractional bits.
  - The total number of bits in the underlying unsigned integer is `m + n`.

## Rust Fixed-Point Crate Mapping

Rust has several crates for fixed-point numbers. The types defined here can be mapped to some of these crates as follows:

### `fixed` Crate Mapping

The types in this proposal map to the [`fixed`](https://crates.io/crates/fixed) crate using aliases like `I{M}F{N}` or `U{M}F{N}` as follows:

- `Qmfn` corresponds to the `fixed` crate alias `I{m+1}F{n}`.
- `Nmfn` corresponds to the `fixed` crate alias `U{m}F{n}`.

For example, `Q6f1` (a signed 8-bit integer with 6 integer bits and 1 fractional bit) maps to Rust's `I7F1`. `N7f1` (an unsigned 8-bit integer with 7 integer bits and 1 fractional bit) maps to Rust's `U7F1`.

### `q-num` Crate

The [`q-num`](https://docs.rs/q-num/latest/q_num/) crate uses a more direct `Qm.n` notation for its types, similar to the convention referenced from Texas Instruments. This crate might offer a closer conceptual match to the Zarr fixed-point extension notation.

## Available Data Types

The following fixed-point data types are defined, categorized by the bit-width of their underlying integer representation.

### 8-bit Integers
- **Signed (`Int8`):** [Q7f0](./Q7f0/), [Q6f1](./Q6f1/), [Q5f2](./Q5f2/), [Q4f3](./Q4f3/), [Q3f4](./Q3f4/), [Q2f5](./Q2f5/), [Q1f6](./Q1f6/), [Q0f7](./Q0f7/)
- **Unsigned (`UInt8`):** [N7f1](./N7f1/), [N6f2](./N6f2/), [N5f3](./N5f3/), [N4f4](./N4f4/), [N3f5](./N3f5/), [N2f6](./N2f6/), [N1f7](./N1f7/), [N0f8](./N0f8/)

### 16-bit Integers
- **Signed (`Int16`):** [Q15f0](./Q15f0/), [Q14f1](./Q14f1/), [Q13f2](./Q13f2/), [Q12f3](./Q12f3/), [Q11f4](./Q11f4/), [Q10f5](./Q10f5/), [Q9f6](./Q9f6/), [Q8f7](./Q8f7/), [Q7f8](./Q7f8/), [Q6f9](./Q6f9/), [Q5f10](./Q5f10/), [Q4f11](./Q4f11/), [Q3f12](./Q3f12/), [Q2f13](./Q2f13/), [Q1f14](./Q1f14/), [Q0f15](./Q0f15/)
- **Unsigned (`UInt16`):** [N15f1](./N15f1/), [N14f2](./N14f2/), [N13f3](./N13f3/), [N12f4](./N12f4/), [N11f5](./N11f5/), [N10f6](./N10f6/), [N9f7](./N9f7/), [N8f8](./N8f8/), [N7f9](./N7f9/), [N6f10](./N6f10/), [N5f11](./N5f11/), [N4f12](./N4f12/), [N3f13](./N3f13/), [N2f14](./N2f14/), [N1f15](./N1f15/), [N0f16](./N0f16/)

### 32-bit Integers
- **Signed (`Int32`):** A total of 32 types from [Q31f0](./Q31f0/) to [Q0f31](./Q0f31/).
- **Unsigned (`UInt32`):** A total of 32 types from [N31f1](./N31f1/) to [N0f32](./N0f32/).

### 64-bit Integers
- **Signed (`Int64`):** A total of 64 types from [Q63f0](./Q63f0/) to [Q0f63](./Q0f63/).
- **Unsigned (`UInt64`):** A total of 64 types from [N63f1](./N63f1/) to [N0f64](./N0f64/).

### 128-bit Integers (Future Extension)
While not explicitly enumerated here, 128-bit fixed-point types, such as `Q127f0` (signed with 0 fractional bits) or `N127f1` (unsigned with 1 fractional bit), could also be defined following the same conventions. These would be based on `Int128` and `UInt128` underlying integer types, respectively.
