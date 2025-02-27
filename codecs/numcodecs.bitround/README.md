# BitRound codec

Defines a `array -> array` codec to bit-round floating-point numbers.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.bitround`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/filter/bitround.html for details about the configuration parameters.

- `keepbits`

## Example

For example, the array metadata below specifies that the array contains bitrounded chunks:

```json
{
    "codecs": [{
        "name": "numcodecs.bitround",
        "configuration": {
            "keepbits": 5
        }
    }, { "name": "bytes", "configuration": { "endian": "little" } }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/filter/bitround.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
