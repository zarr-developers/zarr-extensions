# float6_e2m3fn data type

Defines a 6-bit floating point representation with:

- 1 sign bit
- 2 exponent bits, with bias of 1
- 3 mantissa bits
- Extended range: no infinity, no NaN.
- Subnormal numbers when biased exponent is 0.

## Data type name

The data type is specified as `"float6_e2m3fn"`.

## Configuration

None.

## Fill value representation

The fill value is specified in the same way as the core IEEE 754 floating point
numbers:
https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html#fill-value

- The constants `"Infinity"`, `"-Infinity"`, and `"NaN"` are not supported since
  there is no corresponding representation.

## Codec compatibility

### bytes

Encoded as a 1-byte value `0bXXSEEMMM`. The `"endian"` parameter has no effect.
The upper `XX` bits are ignored.

### packbits

Encoded as a 6-bit value `0bSEEMMM`.

## See also

- Specified as the E2M3 format by [OpenCompute
  MX](https://www.opencompute.org/documents/ocp-microscaling-formats-mx-v1-0-spec-final-pdf).
- Python implementation available at https://pypi.org/project/ml-dtypes/
- Implemented in [LLVM/MLIR](https://llvm.org/doxygen/APFloat_8h_source.html) as
  `Float6E2M3FN`.

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
