# Quantize codec

Defines a `array -> array` codec that performs a quantize transformation.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.quantize`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/filter/quantize.html for details about the configuration parameters.

- `digits`
- `dtype`
- `astype` (optional)

## Example

For example, the array metadata below specifies that the array contains quantized chunks:

```json
{
    "codecs": [{
        "name": "numcodecs.quantize",
        "configuration": {
            "digits": 5,
            "dtype": "float64"
        }
    }, { "name": "bytes", "configuration": { "endian": "little" } }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/filter/quantize.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
