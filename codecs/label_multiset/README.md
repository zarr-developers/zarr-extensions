# label_multiset codec

Defines an `array -> bytes` codec that serializes arrays of the
[`label_multiset`](../../data-types/label_multiset/README.md) data type into a compact
binary representation using the Zarr-native (all little-endian) format. The codec exploits
per-chunk list deduplication: voxels sharing identical entry lists reference the same
offset, which compresses regions of uniform labeling (e.g., background) very efficiently.

For N5 interoperability with existing imglib2-label-multisets datasets, use the
[`n5_label_multiset`](../n5_label_multiset/README.md) codec inside
[`n5_varlen`](../n5_varlen/README.md) instead.

## Codec name

The value of the `name` member in the codec object MUST be `label_multiset`.

## Configuration parameters

No configuration is required or permitted for this codec.

## Compatibility

This codec is only compatible with the
[`"label_multiset"`](../../data-types/label_multiset/README.md) data type.

## Example

```json
{
    "data_type": "label_multiset",
    "codecs": [{"name": "label_multiset"}]
}
```

## Format and algorithm

This is an `array -> bytes` codec. The chunk contains `N` voxels in the chunk-linearization
order defined by the chunk grid. `N` equals the product of the chunk shape dimensions
(partial boundary chunks are treated as padded to the full chunk shape for the purposes of
this codec).

### Chunk layout

```
┌──────────────────────────────────────────────────────────────────┐
│  listEntryOffsets[0..N-1]  (uint32 each, little-endian)          │  4·N bytes
├──────────────────────────────────────────────────────────────────┤
│  listData  (variable, all little-endian)                         │  remaining bytes
└──────────────────────────────────────────────────────────────────┘
```

Total encoded size: `4·N + listDataSize` bytes.

### `listEntryOffsets` array

One entry per voxel, in chunk-linearization (C / row-major) order. Each entry is an
unsigned 32-bit little-endian byte offset into the `listData` region where that voxel's
entry list begins. Multiple voxels may share the same offset (list deduplication).

### `listData` region

A concatenation of unique entry lists in the order they were first encountered during
encoding. Each entry list has the following structure:

```
Offset  Size  Endian  Content
------  ----  ------  -------------------------------------------
0       4     LE      numEntries (uint32) — number of entries
4       8     LE      entries[0].labelId (uint64)
12      4     LE      entries[0].count   (uint32)
16      8     LE      entries[1].labelId (uint64)
24      4     LE      entries[1].count   (uint32)
...
```

Each entry list occupies `4 + 12·numEntries` bytes. An empty entry list (`numEntries = 0`)
is valid and occupies exactly 4 bytes.

Entries within a list should be sorted by `labelId` in ascending unsigned order, with no
duplicate `labelId` values.

> **Note:** Existing N5 datasets produced by imglib2-label-multisets may contain unsorted
> entry lists. Implementations SHOULD accept unsorted lists when decoding and SHOULD write
> sorted lists when encoding.

### Encoding procedure

1. Iterate voxels in chunk-linearization order.
2. For each voxel, serialize its entry list to bytes.
3. If an identical byte sequence already exists in `listData`, record its existing offset
   in `listEntryOffsets`; otherwise append the byte sequence to `listData` and record the
   new offset.
4. Write `listEntryOffsets` (uint32 LE each), then `listData`.

### Decoding procedure

1. Read `N` × uint32 LE values as `listEntryOffsets`.
2. Read the remaining bytes as `listData`.
3. For each voxel, locate its entry list in `listData` using the corresponding offset and
   parse `numEntries` followed by the `(labelId, count)` pairs.
4. Compute the argmax for each voxel from its entry list (or deduplicate from a cache of
   previously computed argmax values for repeated offsets).

### Null / all-empty chunks

If all voxels in a chunk have empty entry lists (zero entries), an implementation MAY
represent the chunk as absent in the store (using the fill value mechanism) rather than
writing an explicit byte sequence.

## Change log

No changes yet.

## Current maintainers

* [Mark Kittisopikul](https://github.com/mkitti)
