# CRC32C codec

Defines a `bytes -> bytes` codec that adds a CRC32C checksum to the data.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.crc32c`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/checksum32.html#crc32c for details about the configuration parameters.

- `location`

## Example

For example, the array metadata below specifies that the array contains chunks with appended checksum:

```json
{
    "codecs": [{ 
        "name": "bytes", 
        "configuration": { "endian": "little" } 
      }, {
        "name": "numcodecs.crc32c",
        "configuration": {
          "location": "end"
        }
    }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/checksum32.html#crc32c for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
