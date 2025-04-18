# Vlen-bytes codec

Defines an `array -> bytes` codec that serializes variable-length byte string arrays.

## Codec name

The value of the `name` member in the codec object MUST be `vlen-bytes`.

## Configuration parameters

None.

## Example

For example, the array metadata below specifies that the array contains variable-length byte strings:

```json
{
    "data_type": "bytes",
    "codecs": [{
        "name": "vlen-bytes"
    }],
}
```

## Format and algorithm

This is a `array -> bytes` codec.

This codec is only compatible with the [`"bytes"`](../../data-types/bytes/README.md) data type.

In the encoded format, each chunk is prefixed with a 32-bit little-endian unsigned integer (u32le) that specifies the number of elements in the chunk.
This prefix is followed by a sequence of encoded elements in lexicographical order.
Each element in the sequence is encoded by a u32le representing the number of bytes followed by the bytes themselves.

See https://numcodecs.readthedocs.io/en/stable/other/vlen.html#vlenbytes for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
