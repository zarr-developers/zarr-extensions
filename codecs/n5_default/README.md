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
2. Validate that the block mode is "default" (`0x0000`) and that the number of dimensions specified in the header matches that of the Zarr array
3. Apply the codec chain to the remaining bytes of the block, using the shape from the block header in the expected decoded representation
4. Pad or truncate the resulting N-dimensional array to match the expected shape of the requested Zarr chunk as calculated by the chunk grid

## Compatibility notes

### Storage

Arrays can be made compatible with both N5 and Zarr by having an N5-style `attributes.json` and Zarr-style `zarr.json` under the same directory/prefix.

For reading external N5 data, it is RECOMMENDED that developers provide a Zarr [store](https://zarr-specs.readthedocs.io/en/latest/v3/core/index.html#id25)
(an "N5 Default Store") which wraps over another Zarr store and follows this procedure:

- If a key matching `{store_prefix}zarr.json` is requested:
  - Fetch the value at `{store_prefix}attributes.json`
  - Parse the N5 attributes and convert into an equivalent Zarr v3 metadata document if possible (raise an error if not)
  - Return the serialized Zarr v3 metadata
- For any other key, return the value from the underlying store

Do the reverse on a write request.

Non-root N5 groups do not require an `attributes.json`.
The specification states that any directory on the file system is an N5 group.
For storage backends like S3 which do not store a literal object to represent a prefix, this concept is less clear.
It is RECOMMENDED that developers provide another Zarr [store](https://zarr-specs.readthedocs.io/en/latest/v3/core/index.html#id25)
(an "Implicit Group Store") to wrap over the above N5 Default Store and follows this procedure:

- If a key matching `{store_prefix}zarr.json` is requested:
  - If no object is found, return a default Zarr group metadata document `{"zarr_format": 3, "node_type": "group"}`

### Fill value

N5 arrays do not define an explicit fill value.
Conventionally they use `0` for numeric data.

### Chunk grid

Because N5 blocks encode their own shape, boundary chunks MAY be padded (like Zarr + regular chunk grid) or truncated.
Different N5 implementations either pad (zarr-python v2, tensorstore) or truncate (java) by default.
N5 codec implementations SHOULD be able to handle both cases, or indeed a mixture within a single array.

In this case, the Zarr metadata inferred from N5 metadata MAY use a [`"regular"` chunk grid](https://zarr-specs.readthedocs.io/en/latest/v3/core/index.html#regular-grids).
However, where N5 data uses truncated boundary blocks, this may require implementations to allocate additional memory, pad the block and then trim it down again: therefore it MAY be more efficient to use a chunk grid like [`"zarrs.regular_bounded"`](https://chunkgrid.zarrs.dev/regular_bounded) or [`"rectilinear"`](github.com/zarr-developers/zarr-extensions/pull/25).

### Chunk key encoding

Zarr arrays reading N5 data MUST use a `/`-separated [v2 chunk key encoding](https://zarr-specs.readthedocs.io/en/latest/v3/chunk-key-encodings/v2/).

### Compressors / bytes-to-bytes codecs

Note that N5 block compressors and Zarr bytes-to-bytes codecs of the same name MAY be incompatible,
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

## Limitations

This codec can only decode N5 data which

- uses the Default block mode (`0x0000`)

This codec can only encode Zarr arrays which

- have a number of dimensions representable by a `uint16`
- have a shape representable by an array of `uint32`
- uses no compressor, or a compressor whose configuration can equally be expressed by N5 compression objects
- uses a data type available to N5: `u?int(8|16|32|64)`, `float(32|64)`

## Background

N5 is format similar to Zarr (chunked arrays in hierarchical groups with JSON metadata).
It is most commonly used in volumetric bioimaging, particularly within the Java (imglib2/ Fiji) ecosystem.
[`zarr-python` v2](https://zarr.readthedocs.io/en/v2.18.5/) had some degree of N5 support.

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

For default-mode chunks of dimensionality `N`, the header is therefore expected to be `2 + 2 + 4*N` bytes long.

## Example

A full example of an (empty) zstandard-compressed array compatible with both Zarr and default-mode N5 can be found in [`examples/zstd_array`](./examples/zstd_array/).

This uses the following Zarr configuration:

```jsonc
{
  // ...
  "chunk_grid": {
    "name": "regular",
    "configuration": {
      // ...
    }
  },
  "chunk_key_encoding": {
    "name": "v2",
    "configuration": {
      "separator": "/"
    }
  },
  "fill_value": 0,
  "codecs": [
    {
      "name": "n5_default",
      "configuration": {
        "codecs": [
          {
            // required
            "name": "transpose",
            "configuration": {
              "order": [
                // for a 2D array
                1,
                0
              ]
            }
          },
          {
            // required
            "name": "bytes",
            "configuration": {
              "endian": "big"
            }
          },
          {
            // this codec can be omitted or replaced depending on the N5's `compression` setting
            "name": "zstd",
            "configuration": {
              "level": 0,
              "checksum": false
            }
          }
        ]
      }
    }
  ]
}
```

## Implementations

- <https://github.com/clbarnes/zarrs_n5> (rust/ [zarrs](https://github.com/zarrs/zarrs))
- <https://github.com/clbarnes/zarr-python-n5> (python/ [zarr-python](https://github.com/zarr-developers/zarr-python))
