# n5_varlen codec

Defines an `array -> bytes` codec which makes Zarr readers/writers compatible with
[N5 blocks](https://github.com/saalfeldlab/n5) in "varlength" mode (`0x0001`).

This codec is the varlength-mode counterpart to the
[`n5_default`](../n5_default/README.md) codec, which handles N5 default-mode blocks.
It is intended for variable-width array data types — most notably the
[`label_multiset`](../../data-types/label_multiset/README.md) data type — where the
per-chunk byte size is not determined solely by the chunk shape and element size.

## Codec name

The value of the `name` member in the codec object MUST be `n5_varlen`.

## Configuration parameters

The `configuration` object MUST have a `codecs` key whose value is an array of Zarr v3
codec objects. These inner codecs form a sub-pipeline that converts between the array and
the raw payload bytes (after the N5 header, before any compression). The inner pipeline
MUST begin with exactly one array-to-bytes codec followed by zero or more bytes-to-bytes
codecs.

No additional fields are permitted in the configuration.

## Compatibility notes

### Storage

Arrays can be made compatible with both N5 and Zarr by having an N5-style
`attributes.json` and a Zarr-style `zarr.json` under the same directory/prefix, following
the same pattern described in the [`n5_default`](../n5_default/README.md) codec.

### Chunk key encoding

Zarr arrays reading N5 data MUST use a `/`-separated
[v2 chunk key encoding](https://zarr-specs.readthedocs.io/en/latest/v3/chunk-key-encodings/v2/).

### Compressors / bytes-to-bytes codecs

Inner bytes-to-bytes codecs correspond to N5 block compressors. The same mapping table
described in [`n5_default`](../n5_default/README.md) applies.

## Procedure

### Decoding

1. Parse the [N5 block header](#header-format).
2. Validate that the block mode is varlength (`0x0001`) and that the number of dimensions
   in the header matches the number of dimensions of the Zarr array.
3. Read the next `num_bytes` bytes as the compressed payload.
4. Apply the inner codec pipeline (in decode order) to produce the decoded array.

### Encoding

1. Apply the inner codec pipeline (in encode order) to the array, producing a byte sequence.
2. Write the N5 block header with `num_bytes` set to the length of the byte sequence.
3. Write the byte sequence.

## Header format

The N5 block header for varlength-mode blocks (copied from the
[N5 spec](https://github.com/saalfeldlab/n5)):

```
Offset  Size   Endian  Field
------  -----  ------  ------------------------------------------
0       2      BE      mode         uint16  must be 0x0001 (varlength)
2       2      BE      ndim         uint16  number of dimensions
4       4·ndim BE      dims[0..ndim-1]  uint32 each  block shape
4+4·ndim  4    BE      num_bytes    uint32  byte length of payload
```

Total header size: `2 + 2 + 4·ndim + 4` bytes.

The `num_bytes` field records the total number of bytes in the payload that follows the
header (i.e., the encoded output of the inner codec pipeline). For uncompressed data this
equals `file_size - header_size`.

> **Note:** For default-mode N5 blocks, the header omits `num_bytes` and instead contains
> the number of array elements. The varlength header always includes `num_bytes` in place
> of an element count, since the number of bytes cannot be derived from the chunk shape
> for variable-width data types.

## Example

### label_multiset data with no compression

A label multiset array using N5 varlength blocks without compression. The inner codec
[`n5_label_multiset`](../n5_label_multiset/README.md) serializes the array to the N5
legacy payload format; `n5_varlen` wraps the result with the varlength block header.

```json
{
    "zarr_format": 3,
    "node_type": "array",
    "shape": [80, 64, 64],
    "data_type": "label_multiset",
    "chunk_grid": {
        "name": "regular",
        "configuration": {
            "chunk_shape": [32, 32, 32]
        }
    },
    "chunk_key_encoding": {
        "name": "v2",
        "configuration": {"separator": "/"}
    },
    "fill_value": "0xFFFFFFFFFFFFFFFE",
    "codecs": [
        {
            "name": "n5_varlen",
            "configuration": {
                "codecs": [
                    {"name": "n5_label_multiset"}
                ]
            }
        }
    ]
}
```

### label_multiset data with gzip compression

```json
{
    "zarr_format": 3,
    "node_type": "array",
    "shape": [80, 64, 64],
    "data_type": "label_multiset",
    "chunk_grid": {
        "name": "regular",
        "configuration": {
            "chunk_shape": [32, 32, 32]
        }
    },
    "chunk_key_encoding": {
        "name": "v2",
        "configuration": {"separator": "/"}
    },
    "fill_value": "0xFFFFFFFFFFFFFFFE",
    "codecs": [
        {
            "name": "n5_varlen",
            "configuration": {
                "codecs": [
                    {"name": "n5_label_multiset"},
                    {"name": "gzip", "configuration": {"level": 6}}
                ]
            }
        }
    ]
}
```

## Annotated binary layout

For a 32×32×32 `label_multiset` chunk using `n5_label_multiset` with no compression,
the complete on-disk block is:

```
Bytes 0–1:       00 01              mode = 0x0001 (varlength, uint16 BE)
Bytes 2–3:       00 03              ndim = 3 (uint16 BE)
Bytes 4–7:       00 00 00 20        dims[0] = 32 (uint32 BE)
Bytes 8–11:      00 00 00 20        dims[1] = 32 (uint32 BE)
Bytes 12–15:     00 00 00 20        dims[2] = 32 (uint32 BE)
Bytes 16–19:     XX XX XX XX        num_bytes (uint32 BE) — byte count of payload
─── n5_label_multiset payload begins here ───────────────────────────────────────
Bytes 20–23:     00 00 00 00        argMaxSize = 0 (int32 BE)
Bytes 24–131099: …                  listEntryOffsets[32768] (int32 BE each, 4·32768 bytes)
Bytes 131100–…:  …                  listData (all little-endian)
```

## Limitations

This codec can only decode N5 data which uses the varlength block mode (`0x0001`).

This codec can only encode Zarr arrays using variable-width data types whose inner
array-to-bytes codec produces an output whose byte length cannot be inferred from the
chunk shape alone.

## Background

N5 defines three block modes:

| Mode | Value | Description |
|------|-------|-------------|
| default | `0x0000` | Fixed-width elements; shape from header |
| varlength | `0x0001` | Variable-width payload; byte count from header |
| object | `0x0002` | Arbitrary serialized objects |

The `n5_default` codec handles mode `0x0000`. This codec handles mode `0x0001`.

In N5's Java reference implementation, varlength blocks are used for `LabelMultisetType`
arrays written by imglib2-label-multisets. The `num_bytes` field in the header equals
`file_size - header_size` for uncompressed data.

## Change log

No changes yet.

## Current maintainers

* [Mark Kittisopikul](https://github.com/mkitti)
