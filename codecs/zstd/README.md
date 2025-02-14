# Zstd codec

Defines a `bytes -> bytes` codec that applies zstd compression.

## Codec name

The value of the `name` member in the codec object MUST be `zstd`.

## Configuration parameters

### `level`
An integer from -131072 to 22 which controls the speed and level
of compression (has no impact on decoding).  A value of 0 indicates to use
the default compression level.  Otherwise, a higher level is expected to
achieve a higher compression ratio at the cost of lower speed.

### `checksum` (Optional)
A boolean that indicates whether to store a checksum when writing that will
be verified when reading. Should be omitted if false.

## Example

For example, the array metadata below specifies that the compressor is the Zstd
codec configured with a compression level of 1 and with the checksum stored:

```json
{
    "codecs": [{
        "name": "zstd",
        "configuration": {
            "level": 1,
            "checksum": true
        }
    }],
}
```

## Format and algorithm

This is a `bytes -> bytes` codec.

Encoded data should conform to the Zstandard file format [RFC8878].

## References

[RFC8878] Y. Collet. Zstandard Compression and the
   'application/zstd' Media Type. Februrary 2021. Informational. URL:
   https://tools.ietf.org/html/rfc8878

[RFC8878]: https://tools.ietf.org/html/rfc8878

## Change log

No changes yet.

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
