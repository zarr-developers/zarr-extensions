# numpy.datetime64 data type

This document defines `numpy.datetime64`, a data type 
that represents moments in time relative to the Unix epoch.
The `numpy.datetime64` data type closely models the `datetime64` data type from NumPy. 


## Background

`numpy.datetime64` is based on the `datetime64` data defined in [NumPy](https://NumPy.org/). 
To provide necessary context, this document first describes how `datetime64` works in NumPy before 
detailing how the corresponding Zarr data type is defined.

The following references to NumPy are based on version 2.2 of that library.

NumPy defines a data type called `"datetime64"` to represent moments in time relative to the Unix 
epoch. This data type is described in the [NumPy documentation](https://NumPy.org/doc/stable/reference/arrays.datetime.html), which should be considered authoritative.

`datetime64` data types are parametrized by a physical unit of duration, like seconds or minutes, 
and a positive integral scale factor. For example, given a `datetime64` data type defined with a 
unit of seconds and a duration 10, the scalar value `1` in that data type represents a 10 seconds 
after the Unix epoch, i.e. 00:00:10 UTC on 1 January 1970.   

NumPy represents `datetime64` scalars with 64-bit signed integers. The smallest 64-bit signed 
integer, i.e., `-2^63`, represents a non-temporal value called "Not a Time", or `NaT`. The `NaT` 
value serves a role similar to the "Not a Number" value used in floating point data types. 

### NumPy data type parameters

#### Scale factor
The NumPy `datetime64` data type takes a scale factor. It must be an integer in the range 
`[1, 2147483647]`, i.e., `[1, 2^31 - 1]`.

While it is possible to construct a NumPy `datetime64` data type with a scale factor of `0`, 
NumPy will automatically normalize this value to `1`.

#### Unit
The NumPy `datetime64` data type takes a unit parameter, which must be one of the following temporal 
units:

| Identifier | Meaning     |
|------------|----------|
| Y        | year   |
| M        | month   |
| W       | week     |
| D        | day      |
| h       | hour     |
| m      | minute    |
| s       | second     |
| ms       | millisecond     |
| us       | microsecond     |
| μs       | microsecond     |
| ns       | nanosecond      |
| ps       | picosecond      |
| fs       | femtosecond     |
| as       | attosecond     |

> Note: "us" and "μs" are treated as equivalent by NumPy.

> Note: NumPy permits the creation of `datetime64` data types with an unspecified unit. In this 
case, the unit is set to the special value `"generic"`.

#### Endianness
The NumPy `datetime64` data type takes a byte order parameter, which must be either 
little-endian or big-endian. 

## Data type representation

### Name

The name of this data type is the string `"numpy.datetime64"`.

### Configuration

This data type requires a configuration. The configuration for this data type is a JSON object with 
the following fields:

| field name | type | required | notes |
|------------|----------|---|---|
| `"unit"` | one of: `"Y"`, `"M"` , `"W"`, `"D"` , `"h"` , `"m"` , `"s"` , `"ms"` , `"us"` , `"μs"` , `"ns"` , `"ps"` , `"fs"` , `"as"`, `"generic"` | yes | None |
| `"scale_factor"` | `integer` | yes | The number must represent an integer from the inclusive range `[1, 2147483647]` |

> Note: the NumPy `datetime64` data type is parametrized by an endianness (little or big), but the 
Zarr `numpy.datetime64` data type is not. In Zarr, the endianness of `numpy.datetime64` arrays is determined by 
the configuration of the codecs defined in metadata and is thus not part of the data type configuration.

> Note: as per NumPy, `"us"` and `"μs"` are equivalent and interchangeable representations of 
microseconds.

No additional fields are permitted in the configuration.

### Examples
The following is an example of the metadata for a `numpy.datetime64` data type with a unit of microseconds 
and a scale factor of 10. This configuration defines a data type equivalent to the NumPy data type 
`datetime64[10us]`:

```json
{
    "name": "numpy.datetime64",
    "configuration": {
        "unit": "us",
        "scale_factor": 10
    }
}
```

## Fill value representation

For the `"fill_value"` field of array metadata, `numpy.datetime64` scalars must be represented in one of 
two forms:
- As a JSON number with no fraction or exponent part that is within the range `[-2^63, 2^63 - 1]`. 
- As the string `"NaT"`, which denotes the value `NaT`. 

> Note: the `NaT` value may be encoded as the JSON number `-9223372036854775808`, i.e., 
`-2^63`. That is, `"fill_value": "NaT"` and `"fill_value": -9223372036854775808` should be treated 
as equivalent representations of the same scalar value (`NaT`).  

## Codec compatibility

This data type is compatible with any codec that supports arrays of signed 64-bit integers.
