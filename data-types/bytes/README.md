# Bytes data type

Defines a data type for variable-length byte strings.

## Permitted fill values

The value of the `fill_value` metadata key must be an array of byte values.

## Example

For example, the array metadata below specifies that the array contains variable-length byte strings:

```json
{
    "data_type": "bytes",
    "fill_value": [1, 2, 3],
    "codecs": [{
        "name": "vlen-bytes"
    }],
}
```

## Notes

Currently, this data type is only compatible with the [`"vlen-bytes"`](../../codecs/vlen-bytes/README.md) codec.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
