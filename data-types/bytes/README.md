# Bytes data type

Defines a data type for variable-length byte strings.

## Fill value encoding

The value of the `fill_value` metadata key must be one of:
- an array of integers from the closed interval `[0, 255]`, where each value encodes a byte from a byte string.
- a string produced by applying [base64 encoding](https://en.wikipedia.org/wiki/Base64) to a byte string.

Implementations SHOULD default to the <insert name of preferred form> form.

## Examples

### Array fill value encoding

The example below shows a fragment of an array metadata document using the `bytes` data type. The 
fill value is the byte string `0x01 0x02 0x03` encoded as an array of integers:

```json
{
    "data_type": "bytes",
    "fill_value": [1, 2, 3],
    "codecs": [{
        "name": "vlen-bytes"
    }],
}
```
### String fill value encoding

The example below shows a fragment of an array metadata document using the `bytes` data type. The 
fill value is the byte string `0x01 0x02 0x03` encoded as a string using base64:

```json
{
    "data_type": "bytes",
    "fill_value": "AQID",
    "codecs": [{
        "name": "vlen-bytes"
    }],
}
```

## Codec compatibility

This data type is compatible with any codec that can encode variable-length sequences of bytes.
For example, the [`"vlen-bytes"`](../../codecs/vlen-bytes/README.md) codec.

## Change log

- Addition of the string-based fill value encoding.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
