# Enum codec

Defines an `array -> bytes` codec for the [`enum`](../../data-types/enum/README.md) data type.
It stores the tag of each element (which variant it is) separately from the payloads, and stores the payloads of each variant separately from each other.
Every part has its own codec chain.

With the variants `[null, T]` this codec produces the same bytes as the `optional` codec of [PR #33](https://github.com/zarr-developers/zarr-extensions/pull/33), where `tag_codecs` is `mask_codecs` and `variant_codecs` for the second variant is `data_codecs`.
The one difference is the fill value of the tag array, which matters only to fill-dependent codecs in `tag_codecs`.

## Codec name

The value of the `name` member in the codec object MUST be `enum`.

## Configuration parameters

### `tag_codecs`

An array of codec configurations, applied as a codec chain to the array of tags.
The tag array has:

- the shape of the chunk,
- a data type of `bool` if the `enum` has exactly two variants (`false` = tag 0, `true` = tag 1), otherwise the smallest of `uint8`, `uint16`, `uint32`, `uint64` that can hold the largest tag, and
- a fill value equal to the tag of the fill value's variant.

### `variant_codecs`

An object mapping the name of each _payload variant_ to an array of codec configurations, applied as a codec chain to that variant's payloads.
It MUST contain an entry for every payload variant and MUST NOT contain an entry for a unit variant (a variant with data type `null` or `missing`).

The payloads of a variant form a one-dimensional array with:

- the data type of the variant,
- shape `[N]`, where `N` is the number of elements in the chunk with that tag, and
- a fill value that is the `value` of the `enum` fill value if the fill value's variant is this variant, and otherwise undefined.

The elements are in lexicographical (C) order of their position in the chunk.
Codecs whose encoded form depends on the fill value (e.g. `sharding_indexed`) MUST NOT be used where the fill value is undefined.

## Example

An `optional`-equivalent `float32` array, with a bit-packed tag and compressed payloads:

```json
{
  "data_type": {
    "name": "enum",
    "configuration": {
      "variants": [
        { "name": "null", "data_type": "null" },
        { "name": "some", "data_type": "float32" }
      ]
    }
  },
  "fill_value": { "variant": "null" },
  "codecs": [
    {
      "name": "enum",
      "configuration": {
        "tag_codecs": [{ "name": "packbits" }],
        "variant_codecs": {
          "some": [
            { "name": "bytes", "configuration": { "endian": "little" } },
            { "name": "zstd", "configuration": { "level": 3 } }
          ]
        }
      }
    }
  ]
}
```

A four-variant `enum` with a `uint8` tag array:

```json
{
  "name": "enum",
  "configuration": {
    "tag_codecs": [
      { "name": "bytes" },
      { "name": "zstd", "configuration": { "level": 3 } }
    ],
    "variant_codecs": {
      "censored_below": [{ "name": "bytes", "configuration": { "endian": "little" } }],
      "value": [{ "name": "bytes", "configuration": { "endian": "little" } }]
    }
  }
}
```

## Encoded format

Let the _stored variants_ be the payload variants of the `enum`, in `variants` order.
The encoded chunk is:

1. 8 bytes: length in bytes of the encoded tags (u64 little-endian).
2. 8 bytes for each stored variant, in order: length in bytes of its encoded payloads (u64 little-endian).
3. The encoded tags.
4. The encoded payloads of each stored variant, in order.

If a variant has no elements in the chunk, its encoded payloads MUST be empty and decoders MUST NOT apply its codec chain.
Unit variants have no length and no payloads.

For `[null, T]` this is the `optional` layout: a 16 byte header (mask length, data length), mask, data.

### Algorithm

**Encoding:**
1. Build the tag array from the variant of each element.
2. For each payload variant, extract its elements in C order into a one-dimensional array.
3. Encode the tag array with `tag_codecs`.
4. Encode each non-empty payload array with its `variant_codecs` chain, and use empty bytes for the others.
5. Write the header, the encoded tags, and the encoded payloads.

**Decoding:**
1. Read the header and split the encoded chunk into its parts.
2. Decode the tags with `tag_codecs`.
3. Count the elements of each variant from the tags. Decode each payload array with its chain, skipping variants with no elements.
4. Place each element by its tag, consuming that variant's payloads in order.

### Sharding

It is RECOMMENDED to put the `enum` codec inside `sharding_indexed` rather than the reverse, for the reasons given for the `optional` codec: the payload array shape `[N]` varies per chunk and does not divide evenly into inner chunks.

## Compatible Implementations

None yet.

## Change log

No changes yet.

## Current maintainers

* Mark Kittisopikul ([@mkitti](https://github.com/mkitti))
