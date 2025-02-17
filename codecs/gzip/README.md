# Gzip codec

Defines a `bytes -> bytes` codec that applies gzip compression.


## Status of this document

This codec was accepted as part of ZEP0001 on May 15th, 2023 via https://github.com/zarr-developers/zarr-specs/issues/227.

## Codec name

The value of the `name` member in the codec object MUST be `gzip`.


## Configuration parameters

### `level`
An integer from 0 to 9 which controls the speed and level of
compression. A level of 1 is the fastest compression method and
produces the least compressions, while 9 is slowest and produces
the most compression. Compression is turned off completely when
level is 0.


## Example 

For example, the array metadata below specifies that the compressor is
the Gzip codec configured with a compression level of 1:

```json
{
    "codecs": [{
        "name": "gzip",
        "configuration": {                                                                                
            "level": 1                                                                                    
        }
    }]
}
```


## Format and algorithm

This is a `bytes -> bytes` codec.

Encoding and decoding is performed using the algorithm defined in
[RFC1951].

Encoded data should conform to the Gzip file format [RFC1952].


## References

[RFC1951] P. Deutsch. DEFLATE Compressed Data Format Specification version
   1.3. Requirement Levels. May 1996. Informational. URL:
   https://tools.ietf.org/html/rfc1951

[RFC1952] P. Deutsch. GZIP file format specification version 4.3.
   Requirement Levels. May 1996. Informational. URL:
   https://tools.ietf.org/html/rfc1952

[RFC1951]: https://tools.ietf.org/html/rfc1951
[RFC1952]: https://tools.ietf.org/html/rfc1952


## Change log

No changes yet.

## Current maintainers

* Zarr core development team
