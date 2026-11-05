# Constant chunk key encoding

A chunk key encoding that stores the single chunk of an array under a fixed, user-defined key,
independent of the chunk coordinate.

Its main use case is an array that consists of exactly one chunk (or one [shard](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/sharding-indexed/index.html))
which is stored as a single, possibly foreign, file with a chosen name and extension,
for example an existing HDF5, CZI or TIFF file that is exposed as a Zarr array
without being rewritten into the `c/0/0/...` layout.

## Serialisation

### Object: Constant Chunk Key Encoding

| field         | requirement level | type                                                      | description |
| ------------- | ----------------- | --------------------------------------------------------- | ----------- |
| name          | MUST              | literal string `"constant"`                               |             |
| configuration | MUST              | [Configuration](#object-constant-chunk-key-encoding-configuration) |      |

### Object: Constant Chunk Key Encoding Configuration

| field | requirement level | type   | description                                              |
| ----- | ----------------- | ------ | -------------------------------------------------------- |
| key   | MUST              | string | The chunk key, used verbatim for the chunk of the array. |

## Semantics

The encoded chunk key is the value of `key`, taken literally.
No interpolation takes place: `{`, `}` and `*` have no special meaning.
As for every chunk key encoding, the key of the chunk in the store is the chunk key
appended to the path of the array, separated by `/` (see the Zarr v3 core specification).

For example, an array at the path `images/a` with `"key": "data.h5"`
has its chunk stored under the store key `images/a/data.h5`.

### Restrictions on the key

The `key`:

- MUST NOT be empty
- MUST NOT begin or end with `/`, but MAY contain it elsewhere
- MUST NOT contain the substrings `..`, `\`, `\0`, or `//`
- MUST NOT contain the substring `zarr.json`

These are the same restrictions that the [template chunk key encoding](../template/README.md)
places on the literal parts of its template string, with the addition that the key
MUST NOT end with `/` because it names an object, not a prefix.

### Restrictions on the array

Because every chunk coordinate maps to the same key,
this encoding can only address an array with at most one chunk:

- The chunk grid of the array MUST contain at most one chunk,
  i.e. the product over all dimensions of `ceil(shape[i] / chunk_shape[i])` MUST NOT exceed 1.
  This includes zero-dimensional arrays, which have exactly one chunk.
- The only chunk coordinate that can be encoded is the origin, i.e. the coordinate that is `0` in every dimension
  (the empty coordinate for a zero-dimensional array).
  Encoding any other chunk coordinate MUST result in an error.
- Resizing an array so that it would contain more than one chunk MUST result in an error.

Implementations SHOULD report a violation of the first restriction when the array metadata is read
rather than when the first chunk is accessed.
An array with zero chunks (for example, one of shape `[0]`) has no chunk to address and is valid.

## Examples

A two-dimensional array that consists of a single chunk stored as the file `data.h5`:

```jsonc
{
    "zarr_format": 3,
    "node_type": "array",
    "shape": [1024, 2048],
    "data_type": "int16",
    "chunk_grid": {
        "name": "regular",
        "configuration": { "chunk_shape": [1024, 2048] }
    },
    "chunk_key_encoding": {
        "name": "constant",
        "configuration": { "key": "data.h5" }
    },
    "fill_value": 0,
    "codecs": [ /* ... */ ]
}
```

See [examples.tsv](./examples.tsv) for a set of examples / test cases.

## Notes (non-normative)

- This encoding only decides *where* the chunk is stored.
  The bytes found under the key are decoded by the array's `codecs` like those of any other chunk.
  Exposing a foreign file therefore also requires a codec (or a codec pipeline, e.g. inside a sharding codec)
  that understands the layout of that file; defining such codecs is outside the scope of this extension.
- Arrays with several chunks whose keys follow a pattern are covered by the
  [template](../template/README.md) chunk key encoding, which requires at least one template expression
  and therefore cannot express a fixed key.
- Readers that do not implement this extension cannot locate the chunk and will fail to open the array.

## Motivation

Existing chunk key encodings derive the key from the chunk coordinate.
The `default` and `v2` encodings always produce keys of the form `c/0/0` or `0.0`,
and the `template` encoding requires at least one expression.
None of these can give the sole chunk of an array a fixed, meaningful name,
such as `scan.czi`, so a single existing file cannot be referenced in place.
The related [`suffix`](https://github.com/zarr-developers/zarr-extensions/pull/28) and
[`prefix`](https://github.com/zarr-developers/zarr-extensions/pull/47) proposals
change the key only by appending or prepending to a coordinate-derived key.

Making the single-chunk restriction explicit, instead of relaxing the `template` encoding to allow
templates without expressions, keeps the failure mode safe:
an array that would map several chunks onto one file is rejected up front
instead of silently overwriting or mixing up data.

## Implementations

- Julia: [Zarr.jl](https://github.com/JuliaIO/Zarr.jl) `ConstantChunkKeyEncoding` (pending pull request)
