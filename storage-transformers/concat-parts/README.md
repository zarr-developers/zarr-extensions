# Concatenate Parts Storage Transformer

- **Name**: `concat-parts`
- **Version**: 0.1
- **Informal description**: A storage transformer that concatenates several parts to form a chunk.

## Description

This storage transformer enables the composition of a chunk from several parts, which can be thought of as prefixes, the main part, and suffixes. This transformer handles both reading and writing.

On read, the transformer reads the content of each part in the specified order and concatenates them. The key for each part is formed by appending the `key_suffix` to the base key of the chunk. A `key_suffix` of `""` corresponds to the base key.

On write, the transformer performs the inverse operation. It takes a single block of data, splits it into multiple segments based on the configured `size` of the parts, and writes each segment to its corresponding file.

## Configuration

The `concat-parts` storage transformer is configured with a list of parts.

| Name | Type | Description |
|---|---|---|
| `parts` | array of objects | An array of part objects to concatenate, in order. |

Each part object has the following properties:

| Name | Type | Description |
|---|---|---|
| `key_suffix` | string | **Required.** The suffix to append to the chunk key to form the part key. Use `""` for the main part. |
| `size` | integer | *Optional.* The size of the part in bytes. This is required for all but at most one part when writing. |

## Example with `crc32c` Checksum and Zstandard Compression

This example demonstrates how to use the `concat-parts` transformer with `zstd` compression and `crc32c` checksum. The chunk is composed of the compressed data and a checksum, stored in separate files.

```json
{
    "zarr_format": 3,
    "node_type": "array",
    "shape": [1000, 1000],
    "data_type": "uint8",
    "chunk_grid": {
        "name": "regular",
        "configuration": {
            "chunk_shape": [500, 500]
        }
    },
    "chunk_key_encoding": {
        "name": "default",
        "configuration": {
            "separator": "/"
        }
    },
    "codecs": [
        { "name": "zstd" },
        { "name": "crc32c" }
    ],
    "storage_transformers": [
        {
            "name": "concat-parts",
            "configuration": {
                "parts": [
                    { "key_suffix": "" },
                    { "key_suffix": ".crc32c", "size": 4 }
                ]
            }
        }
    ]
}
```

**Write path**: The `zstd` and `crc32c` codecs produce `compressed_data + checksum`. The `concat-parts` transformer splits this into the `compressed_data` (written to `c/0/0`) and the 4-byte `checksum` (written to `c/0/0.crc32c`).

**Read path**: The `concat-parts` transformer reads `c/0/0` and `c/0/0.crc32c`, concatenates them, and passes the result to the `crc32c` codec for verification.

## Example with `sharding_indexed` and a Header

This transformer can be used with the `sharding_indexed` codec to compose a shard from a prefix (header), a data file, and a suffix (index).

In this scenario:
- The shard is composed of a 64-byte header, the main data, and a 1604-byte index. The header serves as padding, which can be useful for data alignment or to reserve space. A `pad` codec (as proposed in another Zarr extension) could be used to add or remove such padding from a data stream, but in this example, the `concat-parts` transformer is used to assemble the shard from pre-existing parts.
- The `concat-parts` transformer defines this structure. The `parts` array specifies the order of concatenation. An empty `key_suffix` (`""`) denotes the main data part. The offsets in the `.index` file are relative to the start of the assembled shard data (i.e., `header + main_data`), so they must account for the 64-byte header padding.

The following `zarr.json` shows the configuration:

```json
{
    "zarr_format": 3,
    "node_type": "array",
    "shape": [10000, 10000],
    "data_type": "uint8",
    "chunk_grid": {
        "name": "regular",
        "configuration": {
            "chunk_shape": [5000, 5000]
        }
    },
    "chunk_key_encoding": { "name": "default" },
    "storage_transformers": [
        {
            "name": "concat-parts",
            "configuration": {
                "parts": [
                    { "key_suffix": ".header", "size": 64 },
                    { "key_suffix": "" },
                    { "key_suffix": ".index", "size": 1604 }
                ]
            }
        }
    ],
    "codecs": [
        {
            "name": "sharding_indexed",
            "configuration": {
                "chunk_shape": [500, 500],
                "index_location": "end",
                "index_codecs": [
                    { "name": "bytes", "configuration": { "endian": "little" } },
                    { "name": "crc32c" }
                ],
                "codecs": [
                    { "name": "packbits" }
                ]
            }
        }
    ]
}
```

**Read path**: When reading a shard (e.g., `c/0/0`), the `concat-parts` transformer reads `c/0/0.header`, `c/0/0`, and `c/0/0.index` and returns their concatenation to the `sharding_indexed` codec.

**Write path**: When writing a shard, the `sharding_indexed` codec produces a single block of bytes. The `concat-parts` transformer receives this block, and splits it into three files: `c/0/0.header` (first 64 bytes), `c/0/0.index` (last 1604 bytes), and `c/0/0` (the rest).
