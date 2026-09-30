# Delta codec

Defines a `array -> array` codec that performs delta encoding.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.delta`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/filter/delta.html for details about the configuration parameters.

- `dtype`
- `astype` (optional)

## Example

For example, the array metadata below specifies that the array contains delta-encoded chunks:

```json
{
    "codecs": [{
        "name": "numcodecs.delta",
        "configuration": {
            "dtype": "uint8"
        }
    }, { "name": "bytes" }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/filter/delta.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
