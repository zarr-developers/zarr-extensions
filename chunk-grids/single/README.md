# Single chunk grid

A chunk grid that consists of exactly one chunk, which covers the entire array.

The chunk shape is not stored in the metadata.
It is always equal to the shape of the array.

Its main use case is an array that is stored as one chunk (or one
[shard](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/sharding-indexed/index.html)),
for example a single file that is exposed as a Zarr array.
It is the recommended companion of the [constant](../../chunk-key-encodings/constant/README.md)
chunk key encoding, which stores the chunk under a fixed key.

## Serialisation

### Object: Single Chunk Grid

| field         | requirement level | type                                                | description |
| ------------- | ----------------- | --------------------------------------------------- | ----------- |
| name          | MUST              | literal string `"single"`                           |             |
| configuration | MAY               | [Configuration](#object-single-chunk-grid-configuration) | If present, MUST be an empty object. |

### Object: Single Chunk Grid Configuration

This object has no fields.

## Semantics

- The chunk grid contains exactly one chunk, for every array shape.
- The only valid chunk coordinate is the origin, i.e. the coordinate that is `0` in every dimension
  (the empty coordinate for a zero-dimensional array).
  Any other chunk coordinate is outside the grid.
- The shape of the chunk is equal to the shape of the array.
  Consequently, the chunk shape changes when the array is resized.
- The chunk is a complete chunk: it never extends beyond the array, so there are no partial edge chunks.
- This also holds for an array with a zero-length dimension,
  whose single chunk contains no elements.

Because the chunk shape follows the array shape, resizing an array changes the shape
that the chunk is expected to decode to.
Implementations MUST NOT assume that previously written chunk data remains valid after a resize
and SHOULD rewrite the chunk accordingly.

## Examples

A two-dimensional array that consists of a single chunk:

```jsonc
{
    "zarr_format": 3,
    "node_type": "array",
    "shape": [1024, 2048],
    "data_type": "int16",
    "chunk_grid": {
        "name": "single"
    },
    "chunk_key_encoding": {
        "name": "default"
    },
    "fill_value": 0,
    "codecs": [ /* ... */ ]
}
```

The chunk is stored under the key `c/0/0` and has the shape `[1024, 2048]`.

Combined with the [constant](../../chunk-key-encodings/constant/README.md) chunk key encoding,
the chunk can be stored under a chosen key:

```jsonc
{
    "chunk_grid": { "name": "single" },
    "chunk_key_encoding": {
        "name": "constant",
        "configuration": { "key": "data.h5" }
    }
}
```

See [examples.tsv](./examples.tsv) for a set of examples / test cases.

## Notes (non-normative)

- The purpose of this grid is to make the intent clear.
  A one-chunk array can already be described with a [regular](../regular/README.md) chunk grid
  whose `chunk_shape` is equal to or greater than the array shape, but then:
  - the single-chunk property is implicit.
    A reader has to compute `ceil(shape[i] / chunk_shape[i])` over every dimension to learn that the array is one chunk,
    and cannot tell whether that was intended or accidental.
  - the `chunk_shape` has to be kept in sync with the array shape by hand, for example after a resize.
  - a writer that grows the array can silently turn it into a multi-chunk array.
    A chunk key encoding that can only address one chunk, such as [constant](../../chunk-key-encodings/constant/README.md),
    would then reject the array only at that point.

  The `single` grid states the intent directly in the array metadata.
  There is no configuration to get wrong, and the chunk shape always follows the array shape.
- Readers that do not implement this extension cannot determine the chunk layout and will fail to open the array.
