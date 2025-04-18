# bfloat16 data type

Defines the `bfloat16` floating-point data type
(https://en.wikipedia.org/wiki/Bfloat16_floating-point_format).

A `bfloat16` number is a IEEE 754 binary32 floating-point number truncated at
16-bits.

- 1 sign bit
- 8 exponent bits, with bias of 127
- 7 mantissa bits
- IEEE 754-compliant, with NaN and +/-inf.
- Subnormal numbers when biased exponent is 0.

## Data type name

The data type is specified as `"bfloat16"`.

## Configuration

None.

## Fill value representation

The fill value is specified in the same way as the core IEEE 754 floating point
numbers:
https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html#fill-value

The constant `"NaN"` corresponds to a representation of `"0x7fc0"`.

## Codec compatibility

### bytes

Encoded as a 2-byte little-endian or big-endian value `0bSEEEEEEEEMMMMMMM`.

## See also

A Python implementation is available at https://pypi.org/project/ml-dtypes/

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
