# Zlib codec

Defines a `bytes -> bytes` codec that compresses chunks using the zlib algorithm.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.zlib`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/compression/zlib.html for details about the configuration parameters.

- `level`

## Example

For example, the array metadata below specifies that the array contains zlib compressed chunks:

```json
{
    "codecs": [{ "name": "bytes" }, {
        "name": "numcodecs.zlib",
        "configuration": {
            "level": 5
        }
    }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/compression/zlib.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
