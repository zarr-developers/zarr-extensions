# BZ2 codec

Defines a `bytes -> bytes` codec that compresses chunks using the bzip2 algorithm.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.bz2`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/compression/bz2.html for details about the configuration parameters.

- `level`

## Example

For example, the array metadata below specifies that the array contains bzip2 compressed chunks:

```json
{
    "codecs": [{ "name": "bytes" }, {
        "name": "numcodecs.bz2",
        "configuration": {
            "level": 1
        }
    }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/compression/bz2.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
