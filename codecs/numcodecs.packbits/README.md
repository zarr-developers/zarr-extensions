# PackBits codec

Defines a `array -> array` to pack elements of a boolean array into bits in a uint8 array.

## Codec name

The value of the `name` member in the codec object MUST be `numcodecs.packbits`.

## Configuration parameters

See https://numcodecs.readthedocs.io/en/stable/filter/packbits.html for details about the configuration parameters.



## Example

For example, the array metadata below specifies that the array contains bit-packed chunks:

```json
{
    "codecs": [{
        "name": "numcodecs.packbits",
        "configuration": {
            "keepbits": 5
        }
    }, { "name": "bytes" }],
}
```


## Format and algorithm

See https://numcodecs.readthedocs.io/en/stable/filter/packbits.html for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
