# json data type

Defines a data type for arbitrary JSON values.

## Permitted fill values

The value of the `fill_value` metadata may be any JSON value.

## Example

For example, the array metadata below specifies that the array contains JSON values:

```json
{
    "data_type": "json",
    "fill_value": {"some": "value"},
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

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
