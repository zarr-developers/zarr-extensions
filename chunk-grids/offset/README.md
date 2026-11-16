# Offset chunk grid

A chunk grid that wraps another chunk grid and shifts it, so that the wrapped grid's chunk 0
begins at a chosen array coordinate instead of at 0. Any registered grid can be wrapped, so a
grid gains a non-zero origin without a member of its own.

## Description

The configuration names a `base_chunk_grid` and an `offset`, one integer per dimension of the
array. An array coordinate `x` along dimension `i` maps to the coordinate `x - offset[i]` of the
base grid, and the base grid's own specification then gives the chunk grid index and the position
within the chunk. Chunk shapes, grid indices and store keys are the base grid's. `offset[i]` is
therefore the array coordinate at which the base grid's chunk 0 begins along dimension `i`.

For a `regular` base grid with chunk shape `d`, the element at coordinate `x` is in the chunk with
grid index `floor((x - offset[i]) / d[i])`, at position `(x - offset[i]) mod d[i]` within it, with
floor division and the modulo that pairs with it.

Base coordinates below 0 are governed by the base grid's specification. The `regular` grid
defines them from version 1.1 ([ZEP 12](https://zarr.dev/zeps/draft/ZEP0012.html): floor
division, negative grid indices, a first chunk that may overhang the array). A base grid that does
not define them requires `offset[i] <= inclusive_min[i]` along every dimension (`<= 0` for an array
whose metadata gives `shape`); placing the offset at the array's lower bound is how such a grid,
`rectilinear` for one, is used with an array whose coordinates start below 0.

Positions of a chunk that lie outside the bounds of the array are not elements of the array,
whether in the first chunk along a dimension or the last; writers SHOULD store the fill value in
them.

With `offset` all zeros the grid is the base grid. Writers SHOULD use the base grid directly in
that case. `offset` MUST NOT be present with a `base_chunk_grid` that is itself `offset`.

Changing `offset` moves every chunk to a new key, so it is fixed for the life of an array. Growing
an array before its first element is a change to its bounds alone (`inclusive_min` under ZEP 12),
not to `offset`; the grid indices of existing chunks do not change.

## Configuration

| field | type | required | notes |
| - | - | - | - |
| `offset` | array of integers | yes | one per dimension; the array coordinate at which the base grid's chunk 0 begins |
| `base_chunk_grid` | chunk grid object | yes | `name` and, if the grid has one, `configuration`; any registered grid other than `offset` |

## Example

A 6 x 7 array with 4 x 5 chunks whose chunk 0 begins at coordinate (1, -1):

```json
{
  "bounds": {"inclusive_min": [-1, 0], "exclusive_max": [5, 7]},
  "chunk_grid": {
    "name": "offset",
    "configuration": {
      "offset": [1, -1],
      "base_chunk_grid": {
        "name": "regular",
        "configuration": {"chunk_shape": [4, 5]}
      }
    }
  },
  "chunk_key_encoding": {"name": "default"}
}
```

The element at (-1, 0) is at base coordinate (-2, 1): chunk `-1` along the first dimension, at
position 2 within it, and chunk `0` along the second, at position 1. The grid indices run `-1, 0`
along the first dimension and `0, 1` along the second, so the chunks are `c/-1/0`, `c/-1/1`,
`c/0/0` and `c/0/1`.

## Uses

- Aligning chunk boundaries with another array's, or with a source's, when the two do not start at
  the same coordinate.
- Translating an array's coordinates without moving a chunk: adding `k` to `offset[i]` and to both
  bounds along dimension `i` leaves every chunk under its key.
- Giving a grid that does not define negative indices, such as `rectilinear`, a chunk 0 at the
  array's lower bound.

Growing an array before its first element does not need this grid: with a `regular` base grid and
the array's bounds in its metadata (ZEP 12), the chunk holding the first element is
`floor(inclusive_min / chunk_shape)`, which is negative when the array has grown below 0.

## Compatibility

- A reader that does not implement this grid refuses the array: a chunk grid cannot be marked
  `must_understand: false`, and zarr-python, tensorstore and neuroglancer each refuse an unknown
  chunk grid name. The same member added to the `regular` grid's configuration would be ignored by
  some current readers, which then address every chunk from grid index 0; that is why this is a
  separate name.
- An array on any grid converts to `offset` with an all-zero `offset` by a metadata rewrite, and
  back. No chunk moves.

## Motivation

Proposed by [@LDeakin](https://github.com/LDeakin) on
[zeps#72](https://github.com/zarr-developers/zeps/pull/72) as the general form of a chunk grid
origin, in place of an `origin` member on the `regular` grid, and adopted there. Discussed in
[zarr-extensions#79](https://github.com/zarr-developers/zarr-extensions/issues/79), where
[@jbms](https://github.com/jbms) asked for a non-zero grid origin to shift and align chunks. An
earlier draft of this entry (`regular_bounded`) carried the array's lower bound inside the chunk
grid; that moved to the core `bounds` member of ZEP 12.

## Implementations

- zarr-python: [zarr-developers/zarr-python#4516](https://github.com/zarr-developers/zarr-python/pull/4516)
  (read and write, with a `regular` base grid)
- tensorstore: [google/tensorstore#296](https://github.com/google/tensorstore/pull/296) (read and
  write, with a `regular` base grid; the offset is the chunk layout's grid origin)
- neuroglancer: [google/neuroglancer#1133](https://github.com/google/neuroglancer/pull/1133) (read,
  with a `regular` base grid)
