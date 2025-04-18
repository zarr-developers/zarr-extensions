# Adler32 codec

Defines a `bytes -> bytes` codec that adds a Adler32 checksum to the data.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.adler32`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/checksum32.html#adler32 for details about the configuration parameters.

- `location`

## Example

For example, the array metadata below specifies that the array contains chunks with appended checksum:

```json
{
    "codecs": [{ 
        "name": "bytes", 
        "configuration": { "endian": "little" } 
      }, {
        "name": "numcodecs.adler32",
        "configuration": {
          "location": "end"
        }
    }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/checksum32.html#adler32 for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
