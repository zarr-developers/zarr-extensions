# Offset chunk key encoding

The `default` chunk key encoding applied to the chunk grid coordinate plus a fixed, per-dimension
integer offset. It lets an array grow in the negative direction of an axis by a whole number of
chunks as a metadata-only change: existing chunks keep their keys.

## Description

Chunk grid coordinates are zero-based: the chunk holding array index 0 along an axis has grid
coordinate 0 on that axis, and the `default` encoding maps grid coordinate `g` to the key
`c/g[0]/g[1]/...`. Adding data before array index 0 therefore shifts every grid coordinate, and
with it every key, which is a rename of every chunk in the store (or a rewrite, when the shift is
not a whole number of chunks).

This encoding introduces one integer per dimension, `offset`, and maps grid coordinate `g` to the
`default` key of `g + offset`:

```
key(g) = default_key(g[0] + offset[0], g[1] + offset[1], ...)
```

Array indexing is unchanged and zero-based; `shape`, the `regular` chunk grid and every codec keep
their meaning. Only the mapping from grid coordinates to store keys moves. With an all-zero
`offset` the keys are byte-for-byte those of `default` with the same separator.

### Growing in the negative direction

To add `k` whole chunks before array index 0 along axis `a`, a writer changes two fields of the
array metadata in one write:

```
shape[a]  = shape[a] + k * chunk_shape[a]
offset[a] = offset[a] - k
```

The chunk formerly at grid coordinate `g[a]` is now at `g[a] + k`, and its key is
`(g[a] + k) + (offset[a] - k) = g[a] + offset[a]`: unchanged. The new leading chunks take the keys
of the grid cells now in front of it, which may be negative (`c/-1/0/0`). A component of the key
with a leading `-` is a legal store key. A writer that must avoid `-` in keys can start from a
large positive `offset` instead and decrease it.

Growing in the positive direction is the ordinary `shape` change, as for `default`.

### Why a new name and not a new field

A reader that does not know this extension must refuse the array rather than open it. The Zarr v3
specification does not permit `must_understand: false` on a chunk key encoding, and an unknown
`name` is a hard failure in every current implementation. A new field on the `regular` chunk grid
or on the `default` encoding would be ignored by current readers, which would then address every
chunk from grid coordinate 0 and show the wrong data with no error.

## Serialisation

### Object: Offset Chunk Key Encoding

| field | requirement level | type | description |
| - | - | - | - |
| name | MUST | literal string `"offset"` | |
| configuration | MUST | [Configuration](#object-offset-chunk-key-encoding-configuration) | |

### Object: Offset Chunk Key Encoding Configuration

| field | requirement level | type | description |
| - | - | - | - |
| offset | MUST | array of integers | one per array dimension; added to the chunk grid coordinate before encoding; any sign |
| separator | MAY | `"/"` or `"."` | the `default` encoding's separator; `"/"` when absent |

## Validation

- The length of `offset` MUST equal the number of array dimensions; a mismatch MUST be an error.
- Every element of `offset` MUST be an integer.
- `separator`, when present, MUST be one of the two values the `default` encoding accepts.

## Examples

An array that has grown by three chunks in the negative direction of its first axis:

```jsonc
{
    "name": "offset",
    "configuration": {
        "separator": "/",
        "offset": [-3, 0, 0]
    }
}
```

Grid coordinate `(0, 0, 0)` is stored under `c/-3/0/0`; grid coordinate `(3, 0, 0)`, which held
array index 0 before the growth, is stored under `c/0/0/0`, where it always was.

Equivalent to `default` with the `.` separator on a 2-D array:

```jsonc
{
    "name": "offset",
    "configuration": {
        "separator": ".",
        "offset": [0, 0]
    }
}
```

## Interoperability and compatibility

- Physical coordinates are a separate layer. Conventions that place array index 0 in a physical
  frame (an OME-NGFF `translation`, a `transform` in a store spec) must be moved by
  `k * chunk_shape[a] * scale` by the writer in the same step, so that the physical position of
  the existing data does not change.
- For a multiscale group, growth is metadata-only at every level only when
  `k * chunk_shape_level0[a] / downsample_i[a]` is a whole number of level-`i` chunks for every
  level `i`. Otherwise the coarser levels have to be recomputed over the affected region.
- The two metadata edits of a growth are one `zarr.json` write, so a reader never observes one
  without the other. A writer racing a growth on the same array is the writer's concern, exactly
  as for a `shape` change.
- A store that treats keys as paths (a filesystem) places `c/-1/...` beside `c/0/...`. Stores that
  list keys lexicographically order `-` before digits.

## Motivation

Volumes assembled from parts that arrive over time, in no fixed order (serial-section imaging,
tiled acquisitions registered as they land, time series extended backwards), need to prepend data
to an existing array. Discussed since 2018 in
[zarr-specs#9](https://github.com/zarr-developers/zarr-specs/issues/9) and in
[zarr-specs#122](https://github.com/zarr-developers/zarr-specs/issues/122); a change to array
indexing was declined there, and a chunk-level extension that keeps array indexing zero-based was
the alternative its reviewers named. This is that extension, kept to the one field it needs.

## Implementations

- python: <https://github.com/rhoadesScholar/zarr-chunk-offset>
  - registers the encoding with [zarr-python](https://pypi.org/project/zarr/) (>= 3.1.3) through
    the `zarr.chunk_key_encoding` entry point
  - `adopt` (switch a `default` array to `offset` with zeros, no key changes) and
    `prepend_chunks` (the two-field growth) as reference operations
  - [`bench/`](https://github.com/rhoadesScholar/zarr-chunk-offset/tree/main/bench) measures the
    growth against the ways available without the encoding (renaming or copying every chunk)
- zarr-python core: `OffsetChunkKeyEncoding` and `Array.prepend`,
  <https://github.com/zarr-developers/zarr-python/pull/4516>
- tensorstore (zarr3 driver, read and write): <https://github.com/google/tensorstore/pull/296>
- neuroglancer (read): <https://github.com/google/neuroglancer/pull/1133>
