# LZ4 codec

Defines a `bytes -> bytes` codec that compresses chunks using the lz4 algorithm.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.lz4`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/compression/lz4.html for details about the configuration parameters.

- `acceleration`

## Example

For example, the array metadata below specifies that the array contains lz4 compressed chunks:

```json
{
    "codecs": [{ "name": "bytes" }, {
        "name": "numcodecs.lz4",
        "configuration": {
            "acceleration": 1
        }
    }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/compression/lz4.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
