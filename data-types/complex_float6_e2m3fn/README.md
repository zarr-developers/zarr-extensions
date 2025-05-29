# complex_float6_e2m3fn data type

Defines a complex number data type where the real and imaginary components are
represented by the `float6_e2m3fn` data type.

## Data type name

The data type is specified as `"complex_float6_e2m3fn"`.

## Configuration

None.

## Fill value representation

The fill value is specified in the same way as the core complex number data data types:
https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html#fill-value

## Codec compatibility

### bytes

Encoded as 2 consecutive (real component followed by imaginary component) 1-byte
values, each encoded as specified by the `float6_e2m3fn` data type. The `"endian"`
parameter has no effect.

### packbits

Encoded as 2 consecutive (real component followed by imaginary component) 6-bit
values, each encoded as specified by the `float6_e2m3fn` data type.

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
