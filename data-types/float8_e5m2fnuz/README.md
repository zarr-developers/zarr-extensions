# float8_e5m2fnuz data type

Defines an 8-bit floating point representation with:

- 1 sign bit
- 5 exponent bits, with bias of 16
- 2 mantissa bits
- Extended range: no infinity, NaN represented by `0b1000'0000`.
- Subnormal numbers when biased exponent is 0.

The suffix fnuz is consistent with LLVM/MLIR naming and is derived from the
differences to IEEE floating point conventions. `F` is for "finite" (no
infinities), `N` for with special NaN encoding, `UZ` for unsigned zero.

## Data type name

The data type is specified as `"float8_e5m2fnuz"`.

## Configuration

None.

## Fill value representation

The fill value is specified in the same way as the core IEEE 754 floating point
numbers:
https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html#fill-value

- The constant `"NaN"` corresponds to a representation of `"0x80"`.
- The constants `"Infinity"` and `"-Infinity"` are not supported since there is
  no representation of infinity.

## Codec compatibility

### bytes

Encoded as a 1-byte value `0bSEEEEEMM`.  The `"endian"` parameter has no effect.

## See also

- Bit layout described by https://arxiv.org/abs/2206.02915
- Python implementation available at https://pypi.org/project/ml-dtypes/
- Implemented in [LLVM/MLIR](https://llvm.org/doxygen/APFloat_8h_source.html) as `Float8E5M2FNUZ`.

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
