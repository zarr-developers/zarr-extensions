# ZFPY codec

Defines a `array -> bytes` codec that compresses chunks using the zfpy algorithm.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.zfpy`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/compression/zfpy.html for details about the configuration parameters.

- `mode`
- `tolerance` (optional)
- `rate` (optional)
- `precision` (optional)

## Example

For example, the array metadata below specifies that the array contains zfpy compressed chunks:

```json
{
    "codecs": [{
        "name": "numcodecs.zfpy",
        "configuration": {
            "mode": 4
        }
    }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/compression/zfpy.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
