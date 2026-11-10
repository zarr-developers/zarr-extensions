# label_multiset data type

Defines a variable-width data type for label multisets, where each array element holds a
multiset of label IDs, each with a non-negative integer count. This data type is used by
[imglib2-label-multisets](https://github.com/saalfeldlab/imglib2-label-multisets) for
volumetric segmentation data, particularly in the
[Paintera](https://github.com/saalfeldlab/paintera) connectome annotation tool.

## Background

A label multiset voxel stores a multiset of label IDs, each carrying a non-negative integer
count representing the number of occurrences of that label. At full resolution, every voxel
is typically a singleton — one label with count 1. After downsampling, a voxel may represent
many labels aggregated from higher-resolution voxels, with counts recording how many
sub-voxels carried each label.

## Data type representation

### Name

The name of this data type is the string `"label_multiset"`.

### Configuration

No configuration is required or permitted for this data type.

## Element structure

Each array element is a list of `(labelId, count)` pairs:

| Field     | Type   | Description |
|-----------|--------|-------------|
| `labelId` | uint64 | Label identifier |
| `count`   | uint32 | Number of occurrences |

The list should be sorted by `labelId` in ascending unsigned order; duplicate label IDs
must not appear (their counts must be summed). An empty list (zero pairs) is valid and
represents a voxel with no label information.

## Reserved label IDs

Five label ID values are reserved at the top of the unsigned 64-bit range:

| Name          | uint64 value (hex)     | int64 value | Meaning |
|---------------|------------------------|-------------|---------|
| `BACKGROUND`  | `0x0000000000000000`   | `0`         | Background label |
| `MAX_ID`      | `0xFFFFFFFFFFFFFFFC`   | `-4`        | Largest usable regular label ID |
| `OUTSIDE`     | `0xFFFFFFFFFFFFFFFD`   | `-3`        | Voxel is outside the dataset bounds |
| `INVALID`     | `0xFFFFFFFFFFFFFFFE`   | `-2`        | Uninitialized / no data |
| `TRANSPARENT` | `0xFFFFFFFFFFFFFFFF`   | `-1`        | Fully transparent (display hint) |

A label ID is *regular* if it is ≤ `MAX_ID` as an unsigned integer (i.e., ≤
`0xFFFFFFFFFFFFFFFC`).

## ArgMax

The **argmax** of a voxel's multiset is the label ID with the highest count. Ties are
broken by the smaller label ID (unsigned comparison). If the multiset is empty, the argmax
is `INVALID` (`0xFFFFFFFFFFFFFFFE`).

```
argmax := INVALID
maxCount := 0
for each (labelId, count) in entries:
    if count > maxCount or (count == maxCount and labelId < argmax):
        argmax = labelId
        maxCount = count
```

The argmax is useful as a scalar integer projection of the multiset for visualization and
interoperability with single-label data consumers.

## Fill value representation

The `fill_value` field in array metadata must be a JSON string containing the hexadecimal
representation of a uint64 label ID. This label ID represents the sole element of a
singleton multiset with count 1:

- `"0xFFFFFFFFFFFFFFFE"` — singleton `{INVALID → 1}` (canonical fill value)
- `"0x0000000000000000"` — singleton `{BACKGROUND → 1}`

## Codec compatibility

This data type must be used with exactly one array-to-bytes codec from the following:

- [`"label_multiset"`](../../codecs/label_multiset/README.md): Zarr v3 native
  serialization (all little-endian). Recommended for new arrays.
- [`"n5_varlen"`](../../codecs/n5_varlen/README.md): N5 varlength block format,
  for interoperability with existing N5-based label multiset datasets. The first inner
  codec inside `n5_varlen` must be
  [`"n5_label_multiset"`](../../codecs/n5_label_multiset/README.md).

Optional bytes-to-bytes codecs (e.g., `gzip`, `blosc`, `zstd`) may follow the
array-to-bytes codec (or be placed inside `n5_varlen`'s inner codec chain).

## Array metadata example

For a new Zarr v3 label multiset array:

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
    "chunk_key_encoding": {"name": "default"},
    "fill_value": "0xFFFFFFFFFFFFFFFE",
    "codecs": [
        {"name": "label_multiset"},
        {"name": "gzip", "configuration": {"level": 6}}
    ],
    "attributes": {
        "label_multisets": true,
        "maxId": 99
    }
}
```

For reading an existing N5 label multiset dataset:

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
    ],
    "attributes": {
        "label_multisets": true
    }
}
```

## Multiresolution

Downscaled resolution levels are stored as separate Zarr arrays within a multiscale group,
compatible with the [OME-Zarr multiscales
specification](https://ngff.openmicroscopy.org/latest/). Each downscaled voxel aggregates
the entry lists from its higher-resolution children, summing counts for matching label IDs.

## Change log

No changes yet.

## Current maintainers

* [Mark Kittisopikul](https://github.com/mkitti)
