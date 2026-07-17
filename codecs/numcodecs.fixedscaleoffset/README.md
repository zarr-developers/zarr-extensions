# FixedScaleOffset codec

Defines a `array -> array` codec that performs a numeric transformation.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.fixedscaleoffset`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/filter/fixedscaleoffset.html for details about the configuration parameters.

- `offset`
- `scale`
- `dtype`
- `astype` (optional)

## Example

For example, the array metadata below specifies that the array contains scale-offset transformed chunks:

```json
{
    "codecs": [{
        "name": "numcodecs.fixedscaleoffset",
        "configuration": {
            "offset": 5,
            "scale": 10,
            "dtype": "int32"
        }
    }, { "name": "bytes", "configuration": { "endian": "little" } }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/filter/fixedscaleoffset.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
