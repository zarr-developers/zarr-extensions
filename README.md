# zarr-extensions

This repository contains the specification for Zarr extensions for the [Zarr version 3 specification](https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html).

It is the normative source for registering names of Zarr v3 extensions.

## Extensions 

Extensions are organized by their extension point as defined in the [Zarr v3 core specification](https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html#extension-points).

Extensions that are part of the Zarr v3 core specification are marked with an asterisk (*).

### Codecs

* [blosc](./codecs/blosc/README.md)
* [bytes*](./codecs/bytes/README.md)
* [crc32c](./codecs/crc32c/README.md)
* [gzip](./codecs/gzip/README.md)
* [sharding-indexed](./codecs/sharding-indexed/README.md)
* [transpose*](./codecs/transpose/README.md)
* [zstd](./codecs/zstd/README.md)


### Data types

* bool*
* int8*
* int16*
* int32*
* int64*
* uint8*
* uint16*
* uint32*
* uint64*
* float16*
* float32*
* float64*
* complex64*
* complex128*

### Chunk key encoding

* [default*](./chunk-key-encodings/default/README.md)
* [v2*](./chunk-key-encodings/v2/README.md)

### Chunk grid

* [regular*](./chunk-grids/regular/README.md)

### Storage transformers

(none)


## Registering an extension

To register an extension, open a new PR with a new extension directory under the relevant extension point:

 * [Codecs](./codecs/README.md)
 * [Data Types](./dtype/README.md)
 * [Chunk Key Encoding](./chunk-key-encodings/README.md)
 * [Chunk Grid](./chunk-grids/README.md)
 * [Storage Transformers](./storage-transformers/README.md)

Each extension MUST have a `README.md` file that describes the extension and its metadata specification.
Extensions SHOULD have a `schema.json` file that contains the JSON schema for the metadata, if the README.md does not provide a link to an external schema.
Please note that all extensions documents will be licensed under the [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).
Only open a PR if you are willing to license your extension under this license.

The PR will be reviewed by the [Zarr steering council](https://github.com/orgs/zarr-developers/teams/steering-council).
We aim to be very open about registering extensions.
The review will be done largely based on avoiding confusing extension names and preventing malicious activity as well as maintaining the formal requirements of the extensions.
Extension maintainers are responsible for their extensions.
Updates to the extensions will also be reviewed by the steering council.

## License

All extensions are licensed under the [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).
