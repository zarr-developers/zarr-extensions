# String data type

Defines a data type for variable-length UTF8 strings.

## Example

For example, the array metadata below specifies that the array contains variable-length byte strings:

```json
{
    "data_type": "string",
    "codecs": [{
        "name": "vlen-utf8"
    }],
}
```

## Notes

Currently, this data type is only compatible with the [`"vlen-utf8"`](../../codecs/vlen-utf8/README.md) codec.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
