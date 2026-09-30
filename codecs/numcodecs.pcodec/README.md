# PCodec codec

Defines a `array -> bytes` codec that compresses chunks using the pcodec algorithm.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.pcodec`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/compression/pcodec.html for details about the configuration parameters.

- `level`
- `mode_spec`
- `delta_spec`
- `paging_spec`
- `delta_encoding_order`
- `equal_pages_up_to`

## Example

For example, the array metadata below specifies that the array contains pcodec compressed chunks:

```json
{
    "codecs": [{
        "name": "numcodecs.pcodec",
        "configuration": {
            "level": 5,
            "mode_spec": "auto",
            "delta_spec": "auto",
            "paging_spec": "equal_pages_up_to",
            "delta_encoding_order": null,
            "equal_pages_up_to": 262144
        }
    }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/compression/pcodec.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
