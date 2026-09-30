# Zstd codec

Defines a `bytes -> bytes` codec that compresses chunks using the zstd algorithm.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.zstd`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/compression/zstd.html for details about the configuration parameters.

- `level`
- `checksum` (optional)

## Example

For example, the array metadata below specifies that the array contains zstd compressed chunks:

```json
{
    "codecs": [{ "name": "bytes" }, {
        "name": "numcodecs.zstd",
        "configuration": {
            "level": 5,
            "checksum": true
        }
    }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/compression/zstd.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
