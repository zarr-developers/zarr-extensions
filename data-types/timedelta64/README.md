# timedelta64 data type

Defines a Zarr data type to model the `timedelta64` data type defined by Numpy. 

## Background

`timedelta64` is based on a data type defined in [Numpy](https://numpy.org/). Thus this document begins by describing how `timedelta64` works in Numpy. Numpy's implementation is necessary context for making sense of the Zarr implementation.
The following references to Numpy are current with version 2.2 of that library.

Numpy defines a data type called `"timedelta64"` to represent signed temporal durations. These durations arise when taking a difference between moments in time. Numpy models moments in time with a related data type called `"datetime64"`. Both data types are described in the [Numpy documentation](https://numpy.org/doc/stable/reference/arrays.datetime.html), which should be considered authoritative.

`timedelta64` data types are parametrized by a physical unit of duration, like seconds or minutes, and a positive integral step size. For example, given a `timedelta64` data type defined with a unit of seconds and a duration 10, the scalar value `1` in that data type represents a duration of 10 seconds.   

Numpy represents `timedelta64` scalars with 64 bit signed integers. Negative values are permitted. The smallest 64 bit signed integer, i.e. `-2^63`, is reserved to represent a non-duration value called "Not a Time", or `NaT`. The `NaT` value serves a role similar to the "Not a Number" value used floating point data types. 

### Numpy data type parameters

#### Step size
The Numpy `timedelta64` data type takes a step size parameter. It must be an integer in the range `[1, 2147483647]`, i.e. `[1, 2^31 - 1]`.

While it is possible to construct a Numpy `timedelta64` data type with a step size of `0`, Numpy will internally normalize this to `1`.

#### Unit
The Numpy `timedelta64` data type takes a unit parameter, which must be one of the following temporal units:

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

> Note: "us" and "μs" are both valid representations for microseconds.

> Note: Numpy permits the creation of `timedelta64` data types with an unspecified unit. In this case, the unit is set to the special value `"generic"`.

#### Endianness
The Numpy `timedelta64` data type takes an byte order parameter, which must be either little-endian or big-endian. 

## Data type representation

### Name

The name of this data type is the string `"timedelta64"`.

### Configuration

The configuration for this data type is a JSON object with the following fields:

| field name | type | required | notes |
|------------|----------|---|---|
| `"unit"` | one of: `"Y"`, `"M"` , `"W"`, `"D"` , `"h"` , `"m"` , `"s"` , `"ms"` , `"us"` , `"μs"` , `"ns"` , `"ps"` , `"fs"` , `"as"`, `"generic"` | yes | None |
| `"scale_factor"` | `integer` | yes | The number must represent an integer from the inclusive range `[1, 2147483647]` |

> Note: the Numpy `timedelta64` data type is parametrized by an endianness (little or big), but the Zarr `timedelta64` data type is not. In Zarr, the endianness of `timedelta64` arrays is determined by the configuration of the `codecs` metadata and is thus not part of the data type configuration.

> Note: as per Numpy, `"us"` and `"μs"` are equivalent and interchangeable representations of microseconds.

No additional fields are permitted.

### Examples
The metadata representation of a `timedelta64` with a unit of microseconds and a scale factor of 10, equivalent to the Numpy data type `timedelta64[10us]`:

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

> Note: the `NaT` value can also be encoded as the JSON number `-9223372036854775808`, i.e. `-2 ^ 63`. 

## Codec compatibility

This data type is compatible with any codec that supports arrays of signed 64 bit integers.
