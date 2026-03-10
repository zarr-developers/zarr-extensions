# N5 Default codec

Defines an `array -> bytes` codec which makes zarr readers/writers compatible with [N5 blocks](https://github.com/saalfeldlab/n5) in "default" mode.

## Codec name

The value of the `name` member in the codec object MUST be `n5_default`.

## Configuration parameters

The `configuration` object MUST have a `codecs` key,
whose value MUST be an array of Zarr v3 codec objects,
which MUST obey the same rules as a regular Zarr codec chain.

The first codec MUST be a [transpose codec](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/transpose/) which performs a full transposition;
i.e. for an `N`-dimensional array, the codec's `configuration.order` MUST be `[N-1, N-2, N-3, ..., 0]`.

The second codec MUST be a [bytes codec](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/bytes/index.html).
The codec's `configuration.endian` MAY be omitted for single-byte data types such as `int8` and `uint8`.
Otherwise, it MUST have the value `"big"`.

Zero or one additional codecs MAY be added, which MUST be bytes-to-bytes.

## Procedure

### Decoding

1. Parse the [N5 header](#header-format)
2. Validate that the block mode is "default" (`0x0000`) and that the dimensionality is consistent with expectation
3. Apply the codec chain to the remaining bytes of the block, using the shape from the block header as the decoded representation
4. Pad or truncate the resulting N-dimensional array to match the original decoded representation

## Compatibility notes

Arrays compatible between Zarr and N5 MUST additionally have the `/`-separated [v2 chunk key encoding](https://zarr-specs.readthedocs.io/en/latest/v3/chunk-key-encodings/v2/).

Note that N5 block compressors and Zarr bytes-to-bytes codecs of the same name MAY have different behaviour,
for example the `lz4` codec: <https://github.com/zarr-developers/numcodecs/issues/175>.

| N5 compressor | Equivalent Zarr codec | Notes |
| ------------- | --------------------- | ----- |
| raw | Not needed | Equivalent to no bytes-to-bytes codec |
| bzip2 | | |
| gzip | [gzip](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/gzip/index.html) | |
| lz4 | | See [zarr-developers/numcodecs#175](https://github.com/zarr-developers/numcodecs/issues/175) |
| xz | | |
| [blosc](https://github.com/saalfeldlab/n5-blosc) | [blosc](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/blosc/) | |
| [zstd](https://github.com/JaneliaSciComp/n5-zstandard/) | [zstd](https://github.com/zarr-developers/zarr-extensions/tree/main/codecs/zstd) | |
| [jpeg](github.com/saalfeldlab/n5-jpeg/) | | See [zarr-developers/zarr-extensions#15](https://github.com/zarr-developers/zarr-extensions/issues/15) |

### Storage

Arrays can be made compatible with both N5 and Zarr by having an N5-style `attributes.json` and Zarr-style `zarr.json` under the same directory/prefix.
Care should be taken to keep the metadata in sync between the two.

For reading external N5 data, it is RECOMMENDED that developers provide a Zarr [store](https://zarr-specs.readthedocs.io/en/latest/v3/core/index.html#id25) which wraps over another Zarr store and follows this procedure:

- If a key matching `{store_prefix}zarr.json` is requested:
  - Fetch the value at `{store_prefix}attributes.json`
  - Parse the N5 attributes and convert into an equivalent Zarr v3 metadata document if possible (raise an error if not)
  - Return the serialized Zarr v3 metadata
- For any other key, return the value from the underlying store

Do the reverse on a write request.

N5 arrays' fill value is implicitly 0.

### Chunk grid

Because N5 blocks encode their own shape, boundary chunks MAY be padded (like Zarr + regular chunk grid) or truncated.
Different N5 implementations either pad (zarr-python v2, tensorstore) or truncate (java) by default.
N5 codec implementations SHOULD be able to handle both cases, or indeed a mixture within a single array.

In this case, the Zarr metadata inferred from N5 metadata MAY use a [regular chunk grid](https://zarr-specs.readthedocs.io/en/latest/v3/core/index.html#regular-grids).
However, where N5 data uses truncated boundary blocks, this may require implementations to allocate additional memory, pad the block and then trim it down again: therefore it MAY be more efficient to use a chunk grid like [zarrs.regular_bounded](https://chunkgrid.zarrs.dev/regular_bounded) or [rectilinear](github.com/zarr-developers/zarr-extensions/pull/25).

## Background

N5 is format similar to Zarr (chunked arrays in hierarchical groups with JSON metadata).
It is most commonly used in volumetric bioimaging, particularly within the Java (imglib2/ Fiji) ecosystem.
Zarr v2 had some degree of N5 support.

Some key differences include

| Context | Zarr v3 | N5 |
| ------- | ------- | -- |
| metadata location | zarr.json | attributes.json |
| metadata required | always | may be omitted in non-root groups without attributes |
| chunk headers | no | yes, describing chunk shape (individual chunks may be padded or truncated) |
| memory layout within chunk | C order by default, with optional transpose codec | F order |
| codecs | arbitrary combinations of array, bytes, and array-byte codecs | single compression codec only |
| block types | homogeneous, defined by array metadata | 'default', 'varlength' or 'object' mode, defined by chunk header |
| endianness | big or small, defined by [`bytes` codec](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/bytes/index.html) | big-endian |

## Header format

The below is copied verbatim from the [N5 spec version 4.0.0](https://github.com/saalfeldlab/n5/tree/fb50c2c3f1b411abd201a6c701cfd9c61486cd85).

> - Chunks are stored in the following binary format:
>   - mode (uint16 big endian, default = 0x0000, varlength = 0x0001, object = 0x0002)
>   - number of dimensions (uint16 big endian)
>   - dimension 1[,...,n] (uint32 big endian)
>   - [ mode == varlength ? number of elements (uint32 big endian) ]
>   - compressed data (big endian)
