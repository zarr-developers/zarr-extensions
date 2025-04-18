# Vlen-utf8 codec

Defines an `array -> bytes` codec that serializes variable-length UTF-8 string arrays.

## Codec name

The value of the `name` member in the codec object MUST be `vlen-utf8`.

## Configuration parameters

None.

## Example

For example, the array metadata below specifies that the array contains variable-length UTF-8 strings:

```json
{
    "data_type": "string",
    "codecs": [{
        "name": "vlen-utf8"
    }],
}
```

## Format and algorithm

This is a `array -> bytes` codec.

This codec is only compatible with the [`"string"`](../../data-types/string/README.md) data type.

In the encoded format, each chunk is prefixed with a 32-bit little-endian unsigned integer (u32le) that specifies the number of elements in the chunk.
This prefix is followed by a sequence of encoded elements in lexicographical order.
Each element in the sequence is encoded by a u32le representing the number of bytes followed by the bytes themselves.
The bytes for each element are obtained by encoding the element as UTF8 bytes.

See https://numcodecs.readthedocs.io/en/stable/other/vlen.html#vlenutf8 for details about the encoding.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
