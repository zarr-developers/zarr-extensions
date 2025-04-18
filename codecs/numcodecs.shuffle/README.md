# Shuffle codec

Defines a `array -> array` codec that provides a shuffle filter.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.shuffle`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/filter/shuffle.html for details about the configuration parameters.

- `elementsize`

## Example

For example, the array metadata below specifies that the array contains shuffled chunks:

```json
{
    "codecs": [{
        "name": "numcodecs.shuffle",
        "configuration": {
          "elementsize": 4
        }
    }, { "name": "bytes", "configuration": { "endian": "little" } }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/filter/shuffle.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
