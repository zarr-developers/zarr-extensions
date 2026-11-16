# Optional codec

Defines an `array -> bytes` codec that encodes optional (nullable) data by separating the validity mask and data encoding.

This codec is designed for the `optional` data type, which represents nullable values of any underlying data type.

## Codec name

The value of the `name` member in the codec object MUST be `optional`.

## Configuration parameters

### `mask_codecs`
An array of codec configurations that will be applied to encode the mask (boolean array indicating which elements are present).
The mask codecs are applied in sequence as a codec chain.

The mask codec chain operates on an array with:
- the `bool` data type, where `true` indicates a present element and `false` indicates a missing element,
- a shape equal to the chunk shape, and
- a fill value of `false`.

### `data_codecs`
An array of codec configurations that will be applied to encode the data (a one-dimensional array of only the valid/present elements).
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

Example `optional` data can be found in the [examples](./examples/) subdirectory.

## Format and algorithm

This is an `array -> bytes` codec.

This codec is only compatible with the [`optional`](../../data-types/optional/README.md) data type.

The optional codec separates encoding of the mask (boolean array) and the data (a one-dimensional array, excluding missing elements).
The mask and data are encoded through independent codec chains specified by `mask_codecs` and `data_codecs` configuration parameters.
This allows for efficient storage when many elements are missing, and enables independent compression strategies for mask and data.

The data codec chain operates on a one-dimensional array with:
- a data type equal to the underlying data type of the `optional` data type,
- a shape of `[N]`, where `N` is the number of valid (non-null) elements in the chunk, and
- a fill value determined from the fill value of the `optional` data type:
  - if it is a single element array, the fill value is that element (e.g. `[42]` -> `42`, `[[42]]` -> `[42]`, `[null]` -> `null`),
  - if it is `null`, the fill value is `null` if the underlying data type is an `optional` data type, and is otherwise undefined.

The fill value is significant to codecs whose encoded representation depends on it (e.g. `sharding_indexed`).
If the fill value of the `optional` data type is `null`, `data_codecs` (including any nested codecs) MUST NOT contain codecs whose encoded representation depends on the fill value.

The elements of the data array are the valid elements of the chunk in lexicographical order (C order).
If the underlying data type is itself an `optional` data type, the data codec chain must support it (e.g. by containing a nested `optional` codec).

**Note**: The in-memory representation of optional data arrays is an implementation detail.
Implementations MAY choose any suitable representation for handling nullable values in memory (e.g., separate mask and data arrays, nullable object wrappers, etc.), as long as the encoding and decoding follow the specified format.

### Encoded format

The encoded format consists of:
1. 8 bytes: mask length (u64 little-endian) - the number of bytes in the encoded mask.
2. 8 bytes: data length (u64 little-endian) - the number of bytes in the encoded data.
3. N bytes: encoded mask - the result of applying the mask codec chain to the boolean mask.
4. M bytes: encoded data - the result of applying the data codec chain to the one-dimensional array of only valid elements.

If the mask contains no valid (`true`) elements, the data codec chain is not applied and the encoded data MUST be empty (M = 0).
Decoders MUST NOT apply the data codec chain when the decoded mask contains no valid elements.

### Algorithm

**Encoding:**
1. Create a boolean mask array indicating which elements are present (not null).
2. Extract only the valid (non-null) elements in lexicographical order into a one-dimensional data array.
3. Apply the mask codec chain to the mask.
4. Apply the data codec chain to the one-dimensional data array, or produce empty encoded data if there are no valid elements.
5. Write the lengths and encoded data in the specified format.

**Decoding:**
1. Read the mask length and data length from the first 16 bytes.
2. Read and decode the mask using the mask codec chain.
3. Read and decode the one-dimensional data array using the data codec chain, skipping this step if the mask contains no valid elements.
4. Reconstruct the masked array into a suitable in-memory format, with null values where the mask is false.

### Sharding

To shard optional data, it is RECOMMENDED to place the `optional` codec within the [`sharding_indexed`](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/sharding-indexed/) codec, rather than `sharding_indexed` within `data_codecs`.
Within `data_codecs`, the data array shape (`[N]`) varies by chunk and generally will not be evenly divisible by the inner chunk shape (see [zarr-specs#370](https://github.com/zarr-developers/zarr-specs/pull/370)), and `sharding_indexed` is not permitted if the fill value is `null`.

### Compatible Implementations

* zarrs (Rust implementation)

## Change log

No changes yet.

## Current maintainers

* Lachlan Deakin ([@LDeakin](https://github.com/LDeakin))
