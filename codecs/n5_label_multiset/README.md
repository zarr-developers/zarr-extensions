# n5_label_multiset codec

Defines an `array -> bytes` codec that serializes arrays of the
[`label_multiset`](../../data-types/label_multiset/README.md) data type using the N5
legacy binary format produced by
[imglib2-label-multisets](https://github.com/saalfeldlab/imglib2-label-multisets)
(`LabelUtils.serializeLabelMultisetTypes()`).

This codec is intended to be used as the first inner codec inside
[`n5_varlen`](../n5_varlen/README.md), which wraps it with the N5 varlength block header.
It is not intended to be used as a standalone codec in the outer Zarr codec chain.

For new Zarr v3 arrays, use the [`label_multiset`](../label_multiset/README.md) codec
instead, which uses an all-little-endian layout without the legacy header fields.

## Codec name

The value of the `name` member in the codec object MUST be `n5_label_multiset`.

## Configuration parameters

No configuration is required or permitted for this codec. The format is fixed to the
N5 legacy layout.

## Compatibility

This codec is only compatible with the
[`"label_multiset"`](../../data-types/label_multiset/README.md) data type.

This codec is designed to be composed with [`"n5_varlen"`](../n5_varlen/README.md):

```
Outer codec chain:
  n5_varlen
    └─ configuration.codecs:
         n5_label_multiset   ← array → bytes (this codec)
         [gzip / blosc / …]  ← bytes → bytes (optional compression)
```

## Examples

### N5 label_multiset data without compression

```json
{
    "data_type": "label_multiset",
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

### N5 label_multiset data with gzip compression

```json
{
    "data_type": "label_multiset",
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

## Format and algorithm

This is an `array -> bytes` codec. The chunk contains `N` voxels in the chunk-linearization
order defined by the chunk grid. `N` equals the product of the chunk shape dimensions
(partial boundary chunks are treated as padded to the full chunk shape).

### Chunk layout

```
┌──────────────────────────────────────────────────────────────────┐
│  argMaxSize  (int32, big-endian)                                  │  4 bytes
│  (implementations MUST write 0)                                  │
├──────────────────────────────────────────────────────────────────┤
│  argMax[0..argMaxSize-1]  (int64 each, big-endian)               │  8·argMaxSize bytes
│  (present only when argMaxSize > 0; legacy files only)           │
├──────────────────────────────────────────────────────────────────┤
│  listEntryOffsets[0..N-1]  (int32 each, big-endian)              │  4·N bytes
├──────────────────────────────────────────────────────────────────┤
│  listData  (variable, all little-endian)                         │  remaining bytes
└──────────────────────────────────────────────────────────────────┘
```

> **Note on byte-order asymmetry:** The `argMaxSize`, cached `argMax` values, and
> `listEntryOffsets` are big-endian; the `listData` region is entirely little-endian.
> This asymmetry is a historical artifact of the original Java implementation.

### `argMaxSize` field

A signed 32-bit big-endian integer. Implementations MUST write `0`. Implementations
reading this format MUST accept any non-negative value; if `argMaxSize > 0`, the
`argMax` region MUST be skipped (argmax values are recomputed from the entry lists
at load time).

### `listEntryOffsets` array

One signed 32-bit big-endian integer per voxel, in chunk-linearization (C / row-major)
order. Each value is a byte offset into the `listData` region where that voxel's entry
list begins. Multiple voxels may share the same offset (list deduplication). The
effective range of offsets is `[0, 2^31 - 1]`.

### `listData` region

A concatenation of unique entry lists in the order they were first encountered during
encoding. The `listData` region is entirely little-endian. Each entry list has the
following structure:

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

1. Write `argMaxSize = 0` as int32 BE.
2. Iterate voxels in chunk-linearization order.
3. For each voxel, serialize its entry list to bytes (LE format as above).
4. If an identical byte sequence already exists in `listData`, record its existing offset
   in `listEntryOffsets`; otherwise append the byte sequence to `listData` and record the
   new offset.
5. Write `listEntryOffsets` (int32 BE each), then `listData`.

### Decoding procedure

1. Read `argMaxSize` as int32 BE from offset 0.
2. If `argMaxSize > 0`, skip `8·argMaxSize` bytes (legacy cached argmax values).
3. Read `N` × int32 BE values as `listEntryOffsets`.
4. Read the remaining bytes as `listData`.
5. For each voxel, locate its entry list in `listData` using the corresponding offset and
   parse `numEntries` followed by the `(labelId, count)` pairs.
6. Compute the argmax for each voxel from its entry list (or deduplicate from a cache of
   previously computed argmax values for repeated offsets).

### Null / all-empty chunks

If all voxels in a chunk have empty entry lists (zero entries), an implementation MAY
represent the chunk as absent in the store (using the fill value mechanism) rather than
writing an explicit byte sequence.

## Worked example

For a 32×32×32 chunk (N = 32768 voxels), the uncompressed payload written by this codec
has the following layout:

```
Bytes 0–3:         00 00 00 00         argMaxSize = 0 (int32 BE)
Bytes 4–131075:    …                   listEntryOffsets[32768] (int32 BE each)
Bytes 131076–…:    …                   listData (all little-endian)
```

When this payload is wrapped by `n5_varlen` (raw/no compression), the on-disk block is:

```
Bytes 0–1:         00 01               mode = 0x0001 (varlength, uint16 BE)
Bytes 2–3:         00 03               ndim = 3 (uint16 BE)
Bytes 4–7:         00 00 00 20         dims[0] = 32 (uint32 BE)
Bytes 8–11:        00 00 00 20         dims[1] = 32 (uint32 BE)
Bytes 12–15:       00 00 00 20         dims[2] = 32 (uint32 BE)
Bytes 16–19:       XX XX XX XX         num_bytes (uint32 BE) — payload byte count
Bytes 20–…:        <n5_label_multiset payload>
```

## Change log

No changes yet.

## Current maintainers

* [Mark Kittisopikul](https://github.com/mkitti)
