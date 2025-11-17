# AsType codec

Defines a `array -> array` codec that converts data between different types.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.astype`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/filter/astype.html for details about the configuration parameters.

- `encode_dtype`
- `decode_dtype` (optional)

## Example

For example, the array metadata below specifies that the array contains converted chunks:

```json
{
    "codecs": [{
        "name": "numcodecs.astype",
        "configuration": {
          "encode_dtype": "float32"
        }
    }, { "name": "bytes", "configuration": { "endian": "little" } }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/filter/astype.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
