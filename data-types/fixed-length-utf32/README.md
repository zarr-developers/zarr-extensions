# `fixed_length_utf32` data type

This document defines a data type for fixed-length Unicode strings encoded using [UTF-32](https://www.unicode.org/versions/Unicode5.0.0/appC.pdf#M9.19040.HeadingAppendix.C2.Encoding.Forms.in.ISOIEC.10646). UTF-32, also known as UCS4, is an encoding of Unicode strings that allocates 4 bytes to each Unicode code point.

"Fixed length" as used here means that the `fixed_length_utf32` data type is parametrized by a integral length, which sets a fixed length for every scalar belonging to that data type.

### Name

The name of this data type is the string `"fixed_length_utf32"`

### Configuration

This data type requires a configuration. The configuration for this data type is a JSON object with the following fields:

| field name | type | required | notes |
|------------|----------|---|---|
| `"length_bytes"` | integer | yes | The number MUST represent an integer divisible by 4 in the inclusive range `[0, 2147483644]` |

> Note: the maximum length of 2147483644 was chosen to match the semantics of the [NumPy `"U"` data type](https://numpy.org/devdocs/reference/arrays.scalars.html#numpy.str_), which as of this writing has a maximum length in code points of 536870911, i.e. 2147483644 / 4.

> Note: given a particular `fixed_length_utf32` data type, the length of an array element in Unicode code points is the value of the `length_bytes` field divided by 4.

### Examples

```json
{
  "name": "fixed_length_utf32",
  "configuration" : {
    "length_bytes": 4
  }
}
```

## Fill value representation

The value of the `fill_value` metadata key must be a string. When encoded in UTF-32, the fill value MUST have a length in bytes equal to the value of the `length_bytes` specified in the `configuration` of this data type.

## Codec compatibility

This data type is compatible with any codec that supports arrays with fixed-sized data types.

## Notes

This data type is designed for NumPy compatibility. UTF-32 is not a good fit for many applications that need to model arrays of strings, as real string datasets are often composed of variable-length strings. A variable-length string data type should be preferred in these cases.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)