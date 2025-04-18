# complex_bfloat16 data type

Defines a complex number data type where the real and imaginary components are
represented by the `bfloat16` data type.

## Data type name

The data type is specified as `"complex_bfloat16"`.

## Configuration

None.

## Fill value representation

The fill value is specified in the same way as the core complex number data data types:
https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html#fill-value

## Codec compatibility

### bytes

Encoded as 2 consecutive (real component followed by imaginary component) 2-byte
little-endian or big-endian values.

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
