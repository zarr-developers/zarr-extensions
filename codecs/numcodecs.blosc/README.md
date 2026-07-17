# Blosc codec

Defines a `bytes -> bytes` codec that compresses chunks using the blosc (version 1) algorithm.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.blosc`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/compression/blosc.html for details about the configuration parameters.

- `cname` (optional)
- `clevel` (optional)
- `shuffle` (optional)
- `blocksize`

## Example

For example, the array metadata below specifies that the array contains blosc compressed chunks:

```json
{
    "codecs": [{ "name": "bytes" }, {
        "name": "numcodecs.blosc",
        "configuration": {
            "cname": "zstd",
            "clevel": 5,
            "shuffle": 1,
            "blocksize": 0
        }
    }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/compression/blosc.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
