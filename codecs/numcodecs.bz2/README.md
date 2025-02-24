# BZ2 codec

Defines a `bytes -> bytes` codec that compresses chunks using the bz2 algorithm.

## Codec name

The value of the `name` member in the codec object MUST be `vlen-bytes`.

## Configuration parameters

None.

## Example

For example, the array metadata below specifies that the array contains variable-length byte strings:

```json
{
    "codecs": [{
        "name": "bz2"
    }],
}
```

## Format and algorithm

This is a `array -> bytes` codec.

This codec is only compatible with the [`"bytes"`](../../data-types/bytes/README.md) data type.

See https://numcodecs.readthedocs.io/en/stable/other/vlen.html#vlenbytes for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
