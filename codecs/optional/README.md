# Optional codec

Defines an `array -> bytes` codec that encodes optional (nullable) data by separating the validity mask and data encoding.

This codec is designed for the `optional` data type, which represents nullable values of any underlying data type.

## Codec name

The value of the `name` member in the codec object MUST be `optional`.

## Configuration parameters

### `mask_codecs`
An array of codec configurations that will be applied to encode the mask (boolean array indicating which elements are present).
The mask codecs are applied in sequence as a codec chain.

### `data_codecs`
An array of codec configurations that will be applied to encode the data (flattened bytes of only the valid/present elements).
The data codecs are applied in sequence as a codec chain.

## Example

For example, the array metadata below specifies the optional codec with `packbits` serialisation for the mask, and `gzip` compression for the data:

```json
{
  "data_type": {
    "name": "optional",
    "configuration": {
      "name": "uint8",
      "configuration": {}
    }
  },
  "fill_value": null,
  "codecs": [
    {
      "name": "optional",
      "configuration": {
        "mask_codecs": [
          {
            "name": "packbits"
          }
        ],
        "data_codecs": [
          {
            "name": "bytes"
          },
          {
              "name": "gzip",
              "configuration": {
                "level": 5
              }
          }
        ]
      }
    }
  ]
}
```

## Format and algorithm

This is an `array -> bytes` codec.

This codec is only compatible with the [`optional`](../../data-types/optional/README.md) data type.

The optional codec separates encoding of the mask (boolean array) and the data (flattened bytes, excluding missing elements).
The mask and data are encoded through independent codec chains specified by `mask_codecs` and `data_codecs` configuration parameters.
This allows for efficient storage when many elements are missing, and enables independent compression strategies for mask and data.

**Note**: The in-memory representation of optional data arrays is an implementation detail.
Implementations MAY choose any suitable representation for handling nullable values in memory (e.g., separate mask and data arrays, nullable object wrappers, etc.), as long as the encoding and decoding follow the specified format.

### Encoded format

The encoded format consists of:
1. 8 bytes: mask length (u64 little-endian) - the number of bytes in the encoded mask.
2. 8 bytes: data length (u64 little-endian) - the number of bytes in the encoded data.
3. N bytes: encoded mask - the result of applying the mask codec chain to the boolean mask.
4. M bytes: encoded data - the result of applying the data codec chain to the flattened bytes of only valid elements.

### Algorithm

**Encoding:**
1. Create a boolean mask array indicating which elements are present (not null).
2. Extract only the valid (non-null) elements into a flattened data array.
3. Apply the mask codec chain to the mask.
4. Apply the data codec chain to the flattened data bytes.
5. Write the lengths and encoded data in the specified format.

**Decoding:**
1. Read the mask length and data length from the first 16 bytes.
2. Read and decode the mask using the mask codec chain.
3. Read and decode the flattened data using the data codec chain.
4. Reconstruct the masked array into a suitable in-memory format, with null values where the mask is false.

### Compatible Implementations

* zarrs (Rust implementation)

## Change log

No changes yet.

## Current maintainers

* Lachlan Deakin ([@LDeakin](https://github.com/LDeakin))
