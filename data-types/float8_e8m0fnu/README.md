# float8_e8m0fnu data type

Defines an 8-bit floating point representation with:

- No sign bit (unsigned).
- 8 exponent bits, with bias of 127.
- No mantissa bits
- No zero, no infinity, NaN represented by `0b1111'1111`.
- No subnormal numbers.

The suffix fnu is consistent with LLVM/MLIR naming and is derived from the
differences to IEEE floating point conventions. `F` is for "finite" (no
infinities), `N` for with special NaN encoding, `U` for unsigned without zero.

## Data type name

The data type is specified as `"float8_e8m0fnu"`.

## Configuration

None.

## Fill value representation

The fill value is specified in the same way as the core IEEE 754 floating point
numbers:
https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html#fill-value

- The constant `"NaN"` corresponds to a representation of `"0xFF"`.
- The constants `"Infinity"` and `"-Infinity"` are not supported since there is
  no representation of infinity.

## Codec compatibility

### bytes

Encoded as a 1-byte value `0bEEEEEEEE`.  The `"endian"` parameter has no effect.

## See also

- Defined as the *scale* format E8M0 by [OpenCompute
  MX](https://www.opencompute.org/documents/ocp-microscaling-formats-mx-v1-0-spec-final-pdf).
- Python implementation available at https://pypi.org/project/ml-dtypes/
- Implemented in [LLVM/MLIR](https://llvm.org/doxygen/APFloat_8h_source.html) as `Float8E8M0FN`.

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
