# LZMA codec

Defines a `bytes -> bytes` codec that compresses chunks using the lzma algorithm.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.lzma`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/compression/lzma.html for details about the configuration parameters.

- `format` (optional)
- `check` (optional)
- `preset` (optional)
- `filters` (optional)

## Example

For example, the array metadata below specifies that the array contains lzma compressed chunks:

```json
{
    "codecs": [{ "name": "bytes" }, {
        "name": "numcodecs.lzma",
        "configuration": {
            "preset": 5
        }
    }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/compression/lzma.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
