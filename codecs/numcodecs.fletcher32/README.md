# Fletcher32 codec

Defines a `bytes -> bytes` codec that adds a Fletcher32 checksum to the data.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.fletcher32`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/checksum32.html#fletcher32 for details about the configuration parameters.



## Example

For example, the array metadata below specifies that the array contains chunks with added checksum:

```json
{
    "codecs": [{ 
        "name": "bytes", 
        "configuration": { "endian": "little" } 
      }, {
        "name": "numcodecs.fletcher32"
    }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/checksum32.html#fletcher32 for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
