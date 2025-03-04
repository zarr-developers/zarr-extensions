# float8_e4m3 data type

Defines an 8-bit floating point representation with:

- 1 sign bit
- 4 exponent bits, with bias of 7
- 3 mantissa bits
- IEEE 754-compliant, with NaN and +/-inf.
- Subnormal numbers when biased exponent is 0.

## Data type name

The data type is specified as `"float8_e4m3"`.

## Configuration

None.

## Fill value representation

The fill value is specified in the same way as the core IEEE 754 floating point
numbers:
https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html#fill-value

The constant `"NaN"` corresponds to a representation of `"0x7c"`.

## Codec compatibility

### bytes

Encoded as a 1-byte value `0bSEEEEMMM`.  The `"endian"` parameter has no effect.

## See also

- Bit layout described by https://arxiv.org/abs/2209.05433
- Specified as the E4M3 format by [OpenCompute
  MX](https://www.opencompute.org/documents/ocp-microscaling-formats-mx-v1-0-spec-final-pdf).
- Python implementation available at https://pypi.org/project/ml-dtypes/
- Implemented in [LLVM/MLIR](https://llvm.org/doxygen/APFloat_8h_source.html) as
  `FloatE4M3`.

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
