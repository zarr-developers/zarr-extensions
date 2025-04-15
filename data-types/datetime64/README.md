# Datetime64 data type

Defines a data type for a datetime object based on a 64-bit integer.

## Permitted fill values

The value of the `fill_value` metadata key must be a signed 64-bit integer.

## Example

For example, the array metadata below specifies that the array uses the datetime64 data type:

```json
{
    "data_type": "datetime64",
    "fill_value": -9223372036854775808,
    "configuration": {
      "unit": "s"
    },
}
```

## Notes

Valid values for the `unit` configuration option include: `["Y", "M", "W", "D", "h", "m", "s", "ms", "us", "μs", "ns", "ps", "fs", "as"]`

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
