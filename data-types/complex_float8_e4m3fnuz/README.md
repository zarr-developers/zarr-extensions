# complex_float8_e4m3fnuz data type

Defines a complex number data type where the real and imaginary components are
represented by the `float8_e4m3fnuz` data type.

## Data type name

The data type is specified as `"complex_float8_e4m3fnuz"`.

## Configuration

None.

## Fill value representation

The fill value is specified in the same way as the core complex number data data types:
https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html#fill-value

## Codec compatibility

### bytes

Encoded as 2 consecutive (real component followed by imaginary component) 1-byte
values, each encoded as specified by the `float8_e4m3fnuz` data type. The `"endian"`
parameter has no effect.

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
