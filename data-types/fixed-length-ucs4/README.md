# Fixed-length Unicode string data type

Defines a data type for fixed-length Unicode strings.

## Permitted fill values

The value of the `fill_value` metadata key must be a string.

## Example

For example, the array metadata below specifies that the array contains fixed-length unicode strings:

```json
{
    "data_type": "fixed-length-ucs4",
    "fill_value": "",
    "configuration": {
      "length_bits": 24
    },
}
```

## Notes

TBD

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)