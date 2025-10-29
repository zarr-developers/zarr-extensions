# Offset Codec

**Version:** 0.1.0 (proposal)

**Contact:** Mark Kittisopikul (@mkitti, kittisopikulm@janelia.hhmi.org)

**Type:** `bytes->bytes` codec

## Description

The Offset codec is a `bytes->bytes` codec that handles a fixed-size header preceding the chunk data. When decoding, it skips a specified number of bytes from the start of the chunk. When encoding, it prepends a specified prefix (or zeros) to the chunk data.

This codec is applied as the final step in the encoding chain, prepending a header to the fully encoded and compressed chunk data.

## Configuration Parameters

The codec is configured with the following parameters:

*   `offset`: An integer specifying the number of bytes in the header. This is a required parameter.
*   `prefix`: An optional base64-encoded string of the literal bytes to prepend when encoding. If provided, the length of the decoded bytes MUST be equal to `offset`. If not provided, the prefix defaults to a sequence of `offset` zero bytes (i.e. `\x00` bytes).

## JSON Schema

A `schema.json` file is provided to validate the codec metadata.

```json
{
  "name": "offset",
  "configuration": {
    "offset": {
      "description": "The number of bytes to offset.",
      "type": "integer",
      "minimum": 0
    },
    "prefix": {
      "description": "An optional base64-encoded string of the literal bytes to prepend when encoding. The length of the decoded bytes must equal 'offset'.",
      "type": "string",
      "contentEncoding": "base64"
    }
  },
  "required": ["offset"]
}
```

## Examples

### Example 1: Creating a Valid TIFF File per Chunk

If no compression is used in the Zarr codec pipeline, the chunk size becomes fixed and predictable. This allows the `offset` codec to prepend a static but *fully valid* TIFF header, making each Zarr chunk a readable TIFF file.

This example configures a Zarr array of 256x256 `uint16` chunks. Each chunk will be prepended with a 110-byte header to form a complete, uncompressed, single-strip TIFF.

```json
{
  "codecs": [
    {
      "name": "bytes",
      "configuration": {
        "endian": "little"
      }
    },
    {
      "name": "offset",
      "configuration": {
        "offset": 110,
        "prefix": "SUkqAAgAAAAIAAABAwABAAAAAAEAAAEBAwABAAAAAAEAAAIBAwABAAAAEAAAAAMBAwABAAAAAQAAAAYBAwABAAAAAQAAABEBBAABAAAAbgAAABYBAwABAAAAAAEAABcBBAABAAAAAAACAAAAAAA="
      }
    }
  ]
}
```

#### TIFF Header and IFD Details

The `prefix` contains a 110-byte header and Image File Directory (IFD) for a little-endian TIFF.

**Hexdump Representation:**

```
00000000: 49 49 2a 00 08 00 00 00 08 00 00 01 03 00 01 00  |II*.............|
00000010: 01 01 03 00 01 00 00 00 02 01 03 00 01 00 00 00  |................|
00000020: 10 00 00 00 03 01 03 00 01 00 00 00 01 00 00 00  |................|
00000030: 06 01 03 00 01 00 00 00 01 00 00 00 11 01 04 00  |................|
00000040: 01 00 00 00 6e 00 00 00 16 01 03 00 01 00 00 00  |....n...........|
00000050: 01 00 00 00 17 01 04 00 01 00 00 00 02 00 00 00  |................|
00000060: 00 00 00 00 00 00                                |......|
```

**Header and IFD Fields:**

- **Header (8 bytes):** Standard 8-byte TIFF header indicating little-endian byte order (`II`) and pointing to the IFD at offset 8.
- **IFD (102 bytes):**
  - **Entry Count:** 8 entries.
  - **Tags:**
    - `ImageWidth` (256): 256 pixels.
    - `ImageLength` (257): 256 pixels.
    - `BitsPerSample` (258): 16.
    - `Compression` (259): 1 (None).
    - `PhotometricInterpretation` (262): 1 (BlackIsZero).
    - `StripOffsets` (273): 110 (The image data begins immediately after the prefix).
    - `RowsPerStrip` (278): 256.
    - `StripByteCounts` (279): 131072 (The exact size of the uncompressed 256x256x2-byte chunk).
  - **Next IFD Offset:** 0.

**Encoding process:** The `bytes` codec ensures the `uint16` chunk data is little-endian. The `offset` codec then prepends the 110-byte valid TIFF header. The resulting stored chunk is a standalone, readable TIFF file.

### Example 2: Creating a file with a custom header

To prepend the bytes `MY_CUSTOM_HEADER` (16 bytes) to a compressed chunk, the `offset` codec is placed last with a specified `prefix`.

```json
{
  "codecs": [
    { "name": "gzip" },
    {
      "name": "offset",
      "configuration": {
        "offset": 16,
        "prefix": "TVlfQ1VTVE9NX0hFQURFUg=="
      }
    }
  ]
}
```

**Encoding process:** The data is compressed by `gzip`, and then the `offset` codec prepends the 16-byte custom header.

### Example 3: Reading an N5 dataset with Zarr v3

This example demonstrates how to reuse an existing N5 dataset as a Zarr v3 array.

#### N5 Dataset Structure

Consider an N5 dataset with the following properties:
- **Array dimensions:** 1024x1024
- **Data type:** `uint16` (big-endian)
- **Chunk dimensions:** 64x64
- **Compression:** Zstandard

The N5 `attributes.json` file:

```json
{
  "dimensions": [1024, 1024],
  "blockSize": [64, 64],
  "dataType": "uint16",
  "compression": {
    "type": "zstd",
    "level": 3
  }
}
```

#### N5 Chunk Header

N5 chunks in the default mode have a header that precedes the compressed chunk data. For a 2D array, the header has the following structure:
- **Mode:** 2 bytes (value `0` for default mode)
- **Number of dimensions:** 2 bytes (value `2`)
- **Chunk dimensions:** 2 * 4 = 8 bytes (values `64`, `64`)

The total size of the N5 header for this example is `2 + 2 + 8 = 12` bytes. To read the chunk data with Zarr, we must skip this header.

#### Zarr v3 Configuration

Here is the corresponding `zarr.json` for reading the N5 data.

```json
{
  "zarr_format": 3,
  "node_type": "array",
  "shape": [1024, 1024],
  "data_type": "uint16",
  "chunk_grid": {
    "name": "regular",
    "configuration": {
      "chunk_shape": [64, 64]
    }
  },
  "chunk_key_encoding": {
    "name": "v2",
    "configuration": {
      "separator": "/"
    }
  },
  "codecs": [
    {
      "name": "bytes",
      "configuration": {
        "endian": "big"
      }
    },
    {
      "name": "zstd",
      "configuration": {
        "level": 3
      }
    },
    {
      "name": "offset",
      "configuration": {
        "offset": 12,
        "prefix": "AAAAAgAAAEAAAABA"
      }
    }
  ],
  "fill_value": 0
}
```

#### N5 Header Prefix Details

The `prefix` value `AAAAAgAAAEAAAABA` is the base64 encoding of the 12-byte N5 header template. 

**Python bytes literal:**

```python
b'\x00\x00\x00\x02\x00\x00\x00\x40\x00\x00\x00\x40'
```

**Hexdump representation:**

```
00000000: 00 00 00 02 00 00 00 40  00 00 00 40           |.......@...@|
```

**Header Fields:**

- **Mode** (2 bytes): `00 00` = 0 (Default Mode).
- **Number of Dimensions** (2 bytes): `00 02` = 2.
- **Dimension 1 Size** (4 bytes): `00 00 00 40` = 64.
- **Dimension 2 Size** (4 bytes): `00 00 00 40` = 64.

#### Explanation

This configuration allows a Zarr v3 reader to interpret the N5 dataset seamlessly.

1.  **Metadata Mapping**: The `shape`, `data_type`, and `chunk_grid.configuration.chunk_shape` fields in `zarr.json` directly correspond to the `dimensions`, `dataType`, and `blockSize` from the N5 `attributes.json`.
2.  **Chunk Naming**: The `chunk_key_encoding` is set to `v2` to match N5's chunk naming and storage layout, avoiding the need to rename files.
3.  **Codec Pipeline**: The `codecs` array defines the processing pipeline. For **decoding**, codecs are applied in reverse order (from last to first):
    *   **`offset`**: First, the `offset` codec seeks past the 12-byte N5 header in the stored chunk.
    *   **`zstd`**: Second, the `zstd` codec decompresses the remaining data.
    *   **`bytes`**: Finally, the `bytes` codec ensures the decompressed `uint16` data is interpreted as big-endian.

This combination of metadata and codecs makes the N5 chunks readable as a native Zarr v3 array.

## Implementation Notes

### Handling Dynamic Headers

The `prefix` configuration parameter as defined in the JSON schema is a static value. This is effective when the header content is fixed, such as when no compression is used and the chunk size is therefore known in advance (as shown in Example 1).

However, many file formats require metadata that depends on the encoded data itself, such as the size of the compressed data. This is the case for the `TileByteCounts` tag in a compressed TIFF or the `compressedSize` field in an N5 header. A static `prefix` cannot support this.

A robust implementation of this codec could address this by providing a mechanism to generate prefixes dynamically during the encoding process. For example, a Python implementation could allow a user to provide a callable function instead of a static `prefix` string when writing an array.

```python
# Hypothetical Python implementation
def create_tiff_header(compressed_chunk: bytes) -> bytes:
    # 1. Start with a header template.
    # 2. Get the size of the compressed_chunk.
    # 3. Insert the size into the correct location (e.g., the TileByteCounts tag).
    # 4. Return the complete, dynamically generated header.

zarr.create_array(
    ...,
    codecs=[
        ...,
        offset_codec(offset=110, prefix_func=create_tiff_header)
    ]
)
```

This approach would combine the declarative nature of `zarr.json` (which would still define the `offset`) with the imperative flexibility needed to create complex, valid file format headers on the fly.

## Interoperability and Compatibility

This codec is a proposal and is not yet part of the official Zarr specification.

Implementations that do not support this codec will not be able to read or write data that uses it.

## License

This document is licensed under the [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).

## Appendix

### Script to Generate TIFF Header

The following Python script (`generate_tiff_header.py`) was used to generate the base64-encoded prefix for the valid TIFF header in Example 1.

```python
import struct
import base64

def generate_and_print_tiff_header():
    """
    Constructs the 110-byte TIFF header and IFD for a 256x256 uint16,
    little-endian, single-strip image, and prints the base64 encoding.
    """
    print("Generating the 110-byte TIFF header and IFD for a 256x256 uint16, little-endian, single-strip image.")

    # 8-byte TIFF header
    # II for little-endian, version 42, IFD at offset 8
    header = b'\x49\x49\x2A\x00\x08\x00\x00\x00'

    # Image File Directory (IFD)
    ifd = b''
    # 2-byte Entry Count: 8 entries
    ifd += struct.pack('<H', 8)

    # Helper to create a 12-byte IFD entry
    def create_entry(tag, type, count, value):
        # < for little-endian, H for unsigned short (2 bytes), I for unsigned int (4 bytes)
        return struct.pack('<HHII', tag, type, count, value)

    # Create the 8 IFD entries in ascending order by tag
    ifd += create_entry(256, 3, 1, 256)      # ImageWidth (SHORT)
    ifd += create_entry(257, 3, 1, 256)      # ImageLength (SHORT)
    ifd += create_entry(258, 3, 1, 16)       # BitsPerSample (SHORT)
    ifd += create_entry(259, 3, 1, 1)        # Compression (SHORT) = 1 (None)
    ifd += create_entry(262, 3, 1, 1)        # PhotometricInterpretation (SHORT) = 1 (BlackIsZero)
    ifd += create_entry(273, 4, 1, 110)      # StripOffsets (LONG) = 110 (data starts after this prefix)
    ifd += create_entry(278, 3, 1, 256)      # RowsPerStrip (SHORT)
    ifd += create_entry(279, 4, 1, 131072)   # StripByteCounts (LONG) = 256 * 256 * 2

    # 4-byte offset to the next IFD (0 for none)
    ifd += struct.pack('<I', 0)

    # Combine header and IFD to form the full prefix
    prefix_bytes = header + ifd

    # Encode the prefix in base64
    base64_prefix = base64.b64encode(prefix_bytes)

    print(f"\nTotal prefix length: {len(prefix_bytes)} bytes")
    print("Base64 encoded string:")
    print(base64_prefix.decode('ascii'))

    print("\nVerifying the base64 string...")
    try:
        decoded_bytes = base64.b64decode(base64_prefix)
        assert decoded_bytes == prefix_bytes
        print("Verification successful: Decoded string matches original bytes.")
    except Exception as e:
        print(f"Verification failed: {e}")

if __name__ == "__main__":
    generate_and_print_tiff_header()
```
