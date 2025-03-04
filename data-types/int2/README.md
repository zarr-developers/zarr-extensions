# int2 data type

Defines a signed integer in the range `[-2, 1]`.

## Data type name

The data type is specified as `"int2"`.

## Configuration

None.

## Fill value representation

The fill value is specified in the same way as the core integer data types:
https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html#fill-value

## Codec compatibility

### bytes

Encoded as a 1-byte value, `0bIIIIIIXX` where the upper `IIIIII` bits are
ignored. The `"endian"` parameter has no effect. The upper `IIIIII` bits are
arbitrary, but for better compressibility it is recommended to set them to a
consistent value when writing.

### packbits

Encoded as a 2-bit value.

## See also

- Python implementation available at https://pypi.org/project/ml-dtypes/

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
