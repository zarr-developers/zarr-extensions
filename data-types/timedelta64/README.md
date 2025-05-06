# timedelta64 data type

This document defines a Zarr data type to model the `timedelta64` data type from NumPy. The `timedelta64` data type represents signed temporal durations.

## Background

`timedelta64` is based on a data type with the same name defined in [NumPy](https://NumPy.org/). To provide necessary context, this document first describes how `timedelta64` works in NumPy before detailing its specification in Zarr.

The following references to NumPy are based on version 2.2 of that library.

NumPy defines a data type called `"timedelta64"` to represent signed temporal durations. These durations arise when taking a difference between moments in time. NumPy models moments in time with a related data type called `"datetime64"`. Both data types are described in the [NumPy documentation](https://NumPy.org/doc/stable/reference/arrays.datetime.html), which should be considered authoritative.

`timedelta64` data types are parametrized by a physical unit of duration, like seconds or minutes, and a positive integral step size. For example, given a `timedelta64` data type defined with a unit of seconds and a duration 10, the scalar value `1` in that data type represents a duration of 10 seconds.   

NumPy represents `timedelta64` scalars with 64 bit signed integers. Negative values are permitted. The smallest 64-bit signed integer, i.e., `-2^63`, represents a non-duration value called "Not a Time", or `NaT`. The `NaT` value serves a role similar to the "Not a Number" value used floating point data types. 

### NumPy data type parameters

#### Step size
The NumPy `timedelta64` data type takes a step size parameter. It must be an integer in the range `[1, 2147483647]`, i.e. `[1, 2^31 - 1]`.

While it is possible to construct a NumPy `timedelta64` data type with a step size of `0`, NumPy will automatically normalize this to `1`.

#### Unit
The NumPy `timedelta64` data type takes a unit parameter, which must be one of the following temporal units:

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

> Note: NumPy permits the creation of `timedelta64` data types with an unspecified unit. In this case, the unit is set to the special value `"generic"`.

#### Endianness
The NumPy `timedelta64` data type takes a byte order parameter, which must be either little-endian or big-endian. 

## Data type representation

### Name

The name of this data type is the string `"timedelta64"`.

### Configuration

This data type requires a configuration. The configuration for this data type is a JSON object with the following fields:

| field name | type | required | notes |
|------------|----------|---|---|
| `"unit"` | one of: `"Y"`, `"M"` , `"W"`, `"D"` , `"h"` , `"m"` , `"s"` , `"ms"` , `"us"` , `"μs"` , `"ns"` , `"ps"` , `"fs"` , `"as"`, `"generic"` | yes | None |
| `"scale_factor"` | `integer` | yes | The number must represent an integer from the inclusive range `[1, 2147483647]` |

> Note: the NumPy `timedelta64` data type is parametrized by an endianness (little or big), but the Zarr `timedelta64` data type is not. In Zarr, the endianness of `timedelta64` arrays is determined by the configuration of the `codecs` metadata and is thus not part of the data type configuration.

> Note: as per NumPy, `"us"` and `"μs"` are equivalent and interchangeable representations of microseconds.

No additional fields are permitted in the configuration.

### Examples
The following is an example of the metadata for a `timedelta64` data type with a unit of microseconds and a scale factor of 10. This configuration defines a data type equivalent to the NumPy data type `timedelta64[10us]`:

```json
{
    "name": "timedelta64",
    "configuration": {
        "unit": "us",
        "scale_factor": 10
    }
}
```

## Fill value representation

`timedelta64` fill values are represented as one of:
- a JSON number with no fraction or exponent part that is within the range `[-2^63, 2^63 - 1]`. 
- the string `"NaT"`, which denotes the value `NaT`. 

> Note: the `NaT` value may optionally be encoded as the JSON number `-9223372036854775808`, i.e., `-2^63`. 

## Codec compatibility

This data type is compatible with any codec that supports arrays of signed 64-bit integers.
