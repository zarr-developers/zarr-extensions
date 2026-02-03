# Cast_value codec

Defines an `array -> array` codec that converts (casts) the values of the input array to a new data type using value semantics. This codec does not re-interpret binary representations, and it leaves all other array properties intact.

## Codec metadata

This codec is declared in metadata as a JSON object with the following structure:

| Field | Type | Required |
| -     | -    | -        |
| [`name`](#name)  | string | yes |
| [`configuration`](#configuration) | object | yes |

### Name

The value of the `name` field MUST be the string `"cast_value"`.

### Configuration

The value of the `configuration` field is a JSON object with the following structure:

| Field | Type | Required |
| -     | -    | -        |
| [`data_type`](#data_type)  | Zarr V3 data type metadata | yes |
| [`rounding`](#rounding) | string | no |
| [`out_of_range`](#out_of_range) | string | no |

Additional keys are reserved for future versions of this codec. Metadata with additional keys MUST be treated as invalid by readers.

### data_type

The value of the `data_type` field is Zarr V3 data type metadata that defines the data type which the input values will be cast to. This also defines the data type of the input to the decoding routine.

### rounding

The value of the `rounding` field is a string that defines how values are rounded when casting to a data type with lower numerical precision.

The following values are permitted:

| Value | Description |
| - | - |
| `"nearest-even"` | Round to the nearest integer, with ties going to the nearest even integer (IEEE 754 default). |
| `"towards-zero"` | Truncate the fractional part (round towards zero). |
| `"towards-positive"` | Round towards positive infinity (ceiling). |
| `"towards-negative"` | Round towards negative infinity (floor). |
| `"nearest-away"` | Round to the nearest integer, with ties going away from zero. |

If this field is not present and the cast requires rounding, implementations MUST use `"nearest-even"`.

The `rounding` field is ignored when casting between integer types or when the input values are already integers.

### out_of_range

The value of the `out_of_range` field is a string that defines how values outside the representable range of the target `data_type` are handled.

The following values are permitted:

| Value | Description |
| - | - |
| `"error"` | The codec MUST raise an error if any value exceeds the representable range of the target data type. |
| `"clamp"` | Values exceeding the representable range are clamped to the minimum or maximum value of the target data type. Values of ±∞ are treated as outside the representable range of finite numeric types. |
| `"wrap"` | Values exceeding the representable range wrap around using modular arithmetic with modulus equal to the number of distinct values representable by the output data type. |

If this field is not present, implementations MUST use `"error"`. If any input value has `NaN` semantics and the target data type cannot represent `NaN`, implementations MUST raise an error regardless of the value of this field.

## Example

```json
{
    "name": "cast_value",
    "configuration": {
        "data_type": "uint8",
        "rounding": "towards-zero",
        "out_of_range": "clamp"
    }
}
```

## Implementation notes

### numpy.timedelta64

For the purposes of the `out_of_range` configuration field, the `NaT` value defined for the [`numpy.timedelta64`](https://github.com/zarr-developers/zarr-extensions/tree/main/data-types/numpy.timedelta64) data type is treated as `NaN`.

### numpy.datetime64

For the purposes of the `out_of_range` configuration field, the `NaT` value defined for the [`numpy.datetime64`](https://github.com/zarr-developers/zarr-extensions/tree/main/data-types/numpy.datetime64) data type is treated as `NaN`.

## References

https://en.wikipedia.org/wiki/Rounding
https://en.wikipedia.org/wiki/IEEE_754

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
