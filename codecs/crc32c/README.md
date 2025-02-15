# CRC32C checksum codec

Defines an `bytes -> bytes` codec that appends a CRC32C checksum of the input bytestream.


## Status of this document

This codec was accepted as part of ZEP0002 on November 1st, 2023 via https://github.com/zarr-developers/zarr-specs/issues/254.


## Codec name

The value of the `name` member in the codec object MUST be `crc32c`.


## Configuration parameters

None.


## Format and algorithm

This is a `bytes -> bytes` codec.

The codec computes the CRC32C checksum as defined in [RFC3720] of the input
bytestream. The output bytestream is composed of the unchanged input byte 
stream with the appended checksum. The checksum is represented as a 32-bit
unsigned integer represented in little endian. 


## References

[RFC3720] J. Satran et al. Internet Small Computer Systems 
   Interface (iSCSI). April 2004. Proposed Standard. URL:
   https://tools.ietf.org/html/rfc3720

[RFC2119]: https://tools.ietf.org/html/rfc2119


## Change log

No changes yet.


## Current maintainers

* Norman Rzepka ([@normanrz](https://github.com/normanrz)), Scalable Minds
* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google

## Previous maintainers

* Jonathan Striebel ([@jstriebel](https://github.com/jstriebel)), Scalable Minds
