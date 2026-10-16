# Regular bounded chunk grid

A regular chunk grid whose chunk 0 starts at a declared array coordinate (`origin`) and whose
elements start at a declared coordinate (`lower_bound`). Chunk grid indices may be negative, and
the first chunk along a dimension may be partly filled, as the last chunk already may be. An array
can then grow before its first element, by any number of elements, as a metadata-only change:
existing chunks keep their keys.

## Description

`shape` keeps its meaning: the number of elements along each dimension. Along dimension `i` the
elements occupy the coordinates `[lower_bound[i], lower_bound[i] + shape[i])`.

Chunk grid index `g` along dimension `i` covers the coordinates
`[origin[i] + g * chunk_shape[i], origin[i] + (g + 1) * chunk_shape[i])`. The element at coordinate
`x` is in chunk `floor((x - origin[i]) / chunk_shape[i])`, at position
`(x - origin[i]) mod chunk_shape[i]` inside it, with floor division and the matching modulo.

Each chunk is stored under the key the array's chunk key encoding gives its grid index, which may
be negative (`c/-1/0` under `default`). Every chunk is encoded at its full `chunk_shape`. Elements
of a chunk outside `[lower_bound, lower_bound + shape)` are not part of the array, exactly as for
the last chunk of a `regular` grid.

With `origin` and `lower_bound` all zero, the grid is the `regular` grid with the same
`chunk_shape`.

### Growing in front

To add `n` elements before the first element along dimension `i`, a writer changes two fields in
one write: `shape[i] += n` and `lower_bound[i] -= n`. `origin` is unchanged, so every chunk keeps
its grid index and its key, and every existing element keeps its coordinate. The new elements fill
the rest of the current first chunk and, when `n` is larger, new chunks at lower grid indices.

Growing after the last element is a change to `shape` alone, as for `regular`.

### Indexing

`lower_bound` declares the coordinate of the first element. How an implementation exposes it is up
to the implementation: one with zero-based indexing may keep index `j` meaning coordinate
`lower_bound[i] + j` and report the coordinate range separately; one with explicit index domains
may index by coordinate.

### Negative chunk keys

A negative grid index is written in decimal with a leading `-`. A key component `-0` MUST NOT be
written, and MUST be rejected when parsing.

## Configuration

| field | type | required | notes |
| - | - | - | - |
| `chunk_shape` | array of integers | yes | as for `regular`; each at least 1 |
| `origin` | array of integers | yes | the array coordinate where chunk 0 starts; any sign |
| `lower_bound` | array of integers | yes | the coordinate of the first element; any sign |

All three arrays MUST have one element per array dimension.

## Example

A 6 x 7 array with 4 x 5 chunks, grown by 3 rows and 2 columns in front:

```json
{
  "shape": [9, 9],
  "chunk_grid": {
    "name": "regular_bounded",
    "configuration": {
      "chunk_shape": [4, 5],
      "origin": [0, 0],
      "lower_bound": [-3, -2]
    }
  },
  "chunk_key_encoding": { "name": "default" }
}
```

The elements occupy the coordinates `[-3, 6) x [-2, 7)`. Grid indices run `-1, 0, 1` along both
dimensions; the first element sits at position 1 of chunk `-1` along the first dimension and at
position 3 of chunk `-1` along the second. The four chunks of the original array keep their keys,
`c/0/0`, `c/0/1`, `c/1/0` and `c/1/1`; the new ones are `c/-1/-1`, `c/-1/0`, `c/-1/1`, `c/0/-1`
and `c/1/-1`.

## Compatibility

- A reader that does not implement this grid refuses the array: a chunk grid cannot be marked
  `must_understand: false`, and zarr-python, tensorstore and neuroglancer each refuse an unknown
  chunk grid name. The same keys added to the `regular` grid's configuration would be ignored by
  some current readers, which then address every chunk from grid index 0; that is why this is a
  separate name.
- An array on `regular` converts to `regular_bounded` with all-zero `origin` and `lower_bound` by a
  metadata rewrite. No chunk moves.
- Conventions that attach physical positions to an array (an OME-NGFF `translation`) need to say
  whether they refer to the first element or to coordinate 0. This extension does not change them.
- In a multiscale group, growing in front is a metadata change at every level; the coarser levels
  are recomputed over the new region.

## Motivation

Volumes assembled from parts that arrive over time, in no fixed order: serial-section imaging,
tiled acquisitions registered as they land, time series extended backwards. Discussed in
[zarr-specs#9](https://github.com/zarr-developers/zarr-specs/issues/9),
[zarr-specs#122](https://github.com/zarr-developers/zarr-specs/issues/122),
[zarr-extensions#30](https://github.com/zarr-developers/zarr-extensions/issues/30) and
[zarr-extensions#79](https://github.com/zarr-developers/zarr-extensions/issues/79). This follows
the `origin` and lower-bound design suggested on
[zarr-extensions#80](https://github.com/zarr-developers/zarr-extensions/pull/80), which proposed an
`offset` chunk key encoding and is superseded by this entry.

## Implementations

- zarr-python: [zarr-developers/zarr-python#4516](https://github.com/zarr-developers/zarr-python/pull/4516)
  (`Array.prepend`, `Array.domain`)
- tensorstore: [google/tensorstore#296](https://github.com/google/tensorstore/pull/296) (read, write,
  and resizing of the lower bound)
- neuroglancer: [google/neuroglancer#1133](https://github.com/google/neuroglancer/pull/1133) (read)
