# Rectilinear chunk grid


## Abstract

This document defines a `chunk_grid` object to support rectilinear chunk grids. A rectilinear grid 
is a grid parametrized by a sequence of elements per axis, where each sequence of elements may be 
irregularly spaced. From a chunking perspective, a rectilinear grid is defined by a sequence of 
(potentially) variable-length intervals, or chunk edge lengths, for each axis of an array.

## Indexing

The following diagram illustrates a rectilinear chunk grid. The chunk edge lengths are not to scale.

```bash
              24                  14
   ┌───────────────────────┬──────────────┐
   │                       │              │
   │                       │              │
   │ chunk (0,0)           │ chunk (0,1)  │
16 │                       │              │
   │                       │              │
   │                       │              │
   │                       │              │
   ├───────────────────────┼──────────────┤
   │                       │              │
   │                       │              │
10 │ chunk (1,0)           │ chunk (1,1)  │
   │                       │              │
   │                       │              │
   └───────────────────────┴──────────────┘
```

Every array index resolves to a specific chunk, which can be identified by its index in the chunk 
grid, and an index *within* that chunk, which we refer to here as the "chunk index".
In this example, the chunk grid edge lengths are `[[16, 10], [24, 14]]` i.e., the chunk at chunk index `(0,0)` has shape `[16, 24]`, the chunk at chunk index `(0, 1)` has shape `[14, 16]`, etc.

In this example, the array index `(20, 15)` resolves to the chunk grid index `(1, 0)` and the
chunk index `(4, 15)`. 

More generally, given a tuple of tuples of edge lengths `L` and an array index `idx`, the `nth` 
element of `idx` (denoted `idx[n]`) maps to a chunk grid index by applying the following procedure: 
compute the cumulative sum `C` of the edge lengths in `L[n]`, i.e. 
`C := (L[n][0], L[n][0] + L[n][1], ...)`. The chunk grid index for 
`idx[n]` is given by the index of the first element of `C` that exceeds `idx[n]`. 

Once the chunk grid index `c` is resolved, the chunk index *within* that chunk can be determined by 
subtracting `C[c-1]` from `idx[n]` if `c > 0`, or subtracting 0 otherwise.

## Metadata

| field | type | required |
| - | - | - |
| `name` | Literal `"rectilinear"` | yes | 
| `configuration` | [Configuration](#configuration) | yes | 

### Configuration

| field | type | required | notes |
| - | - | - | - |
| `kind` | Literal `"inline"` | yes | see [kinds of encodings](#kinds-of-encodings) |
| `chunk_shapes` | array of [Chunk edge lengths](#chunk-edge-lengths) | yes |  The length of `chunk_shapes` MUST match the number of dimensions of the array. 
| `encoded_chunk_shapes` | array of [Chunk edge lengths](#chunk-edge-lengths) | no | see [encoded chunk shapes](#encoded-chunk-shapes). If present, the length of `encoded_chunk_shapes` MUST match the number of dimensions of the array. |

#### Kinds of encodings

This specification defines a single permitted value for the `kind` field, namely the string 
`"inline"`. Additions to this specification could define new permitted values for the `kind` field
which could define new semantics for the `chunk_shapes` field.

#### Chunk edge lengths

All edge lengths MUST be positive integers (i.e., at least 1).

The edge lengths of the chunks for an array axis with length `L` can be declared in two ways.

- as an integer

  A single integer defines the step size of a regular 1-dimensional grid.
  
  To convert a single integer `m` into a sequence of explicit chunk edge lengths for an array axis 
  with length `L`, repeat the integer `m` until it defines a sequence with a sum greater than or equal to `L`.

  For example, if `L` is 10, and `m` is 3, the explicit list of chunk lengths is `[3, 3, 3, 3]`.

- as an array that can contain two types of elements:
    - an integer that explicitly denotes an edge length.
    - an array that denotes a [run-length encoded](#run-length-encoding) sequence of integers, 
    each of which denotes an edge length.

The sum of the edge lengths MUST equal or exceed `L`. Overflowing `L` by multiple chunks is 
permitted.

#### Run-length encoding

This specification defines a JSON representation for run-length encoded sequences.

A run-length encoded sequence of `N` repetitions of some value `V` is denoted by the JSON array `[V, N]`. Both `V` and `N` MUST be positive integers (i.e., at least 1).

For example, the sequence `[1, 1, 1, 1, 1]` becomes `[1, 5]` after applying this run-length encoding. 

#### Encoded chunk shapes

By default, the shape a chunk decodes to is given by its edge lengths in `chunk_shapes`. The 
optional `encoded_chunk_shapes` field permits a chunk to decode to a larger shape than the extent 
it contributes to the array.

`encoded_chunk_shapes` is declared exactly like [chunk edge lengths](#chunk-edge-lengths), using the 
same integer, explicit list and run-length encoded forms. It MUST expand to the same number of edge 
lengths per axis as `chunk_shapes` does, and each of its edge lengths MUST be greater than or equal 
to the corresponding edge length in `chunk_shapes`. When declared as a single integer `m`, `m` is 
repeated until it defines a sequence with the same number of edge lengths as the corresponding axis 
of `chunk_shapes`, rather than until its sum reaches the array shape.

When `encoded_chunk_shapes` is present, for the chunk at chunk grid index `c`:

- the chunk decodes to an array whose shape is given by the `c`th edge length of 
  `encoded_chunk_shapes` along each axis,
- the elements it contributes to the array are those whose chunk index along each axis is less than 
  the `c`th edge length of `chunk_shapes` along that axis,
- the remaining elements of the decoded chunk are not part of the array, and readers MUST ignore 
  them.

`chunk_shapes` alone continues to resolve an array index to a chunk grid index and a chunk index, 
exactly as described in [Indexing](#indexing), and the requirement that the sum of its edge lengths 
equal or exceed the array shape applies to `chunk_shapes` as before. `encoded_chunk_shapes` affects 
only how many elements each chunk decodes to.

Omitting `encoded_chunk_shapes` is equivalent to declaring it equal to `chunk_shapes`.

## Example

This example demonstrates different ways of declaring the edge lengths for a rectilinear chunk grid 
via the `chunk_shapes` field.

```javascript
{
    ...
    "shape": [6, 6, 6, 6, 6],
    "chunk_grid": {
        "name": "rectilinear",
        "configuration": {
            "kind": "inline",
            "chunk_shapes": [
                4, // integer. expands to [4, 4]
                [1, 2, 3], // explicit list of edge lengths. expands to itself.
                [[4, 2]], // run-length encoded. expands to [4, 4].
                [[1, 3], 3], // run-length encoded and explicit list. expands to [1, 1, 1, 3]
                [4, 4, 4] // explicit list with overflow chunks
            ]
        }
    }
}
```

### Example with encoded chunk shapes

This example demonstrates `encoded_chunk_shapes`. Two arrays, each of length 550 and chunked 
regularly at 200, are presented as a single array of length 1100 without re-encoding any chunk. 
Each source array's final chunk decodes to 200 elements but contributes only the 150 that belong to 
the array.

```javascript
{
    ...
    "shape": [1100],
    "chunk_grid": {
        "name": "rectilinear",
        "configuration": {
            "kind": "inline",
            // expands to [200, 200, 150, 200, 200, 150]
            "chunk_shapes": [[[200, 2], 150, [200, 2], 150]],
            // integer. expands to [200, 200, 200, 200, 200, 200]
            "encoded_chunk_shapes": [200]
        }
    }
}
```

The chunks therefore begin at array indices 0, 200, 400, 550, 750 and 950. The chunks at chunk grid 
indices 2 and 5 each decode to 200 elements, of which the first 150 are part of the array and the 
remaining 50 are ignored.

## Compatibility with other chunk grids

A rectilinear grid is a generalization of a regular grid (a grid of regularly-spaced elements). Any 
[regular chunk grid ](https://zarr-specs.readthedocs.io/en/latest/v3/chunk-grids/regular-grid/index.html) 
can be converted losslessly to a rectilinear chunk grid. 

The simplest procedure is to copy the 
`chunk_shape` field of the regular chunk grid and assign it to the `chunk_shapes` field of the 
rectilinear chunk grid. 

## Prior work

A scheme for rectilinear chunking was proposed in a 
Zarr extension proposal (ZEP) called [ZEP 0003](https://zarr.dev/zeps/draft/ZEP0003.html). 
The specification presented here builds on the ZEP 0003 proposal and adapts it to the Zarr V3. 

Key differences between this specification and ZEP 0003:
- This specification adds run-length encoding for integer sequences
- This specification uses the field name `"chunk_shapes"` in the `configuration` field, while ZEP 0003 uses the field name `"chunk_shape"`.

## Change log
- Added the optional `encoded_chunk_shapes` field, which permits a chunk to decode to a larger shape
  than the extent it contributes to the array.

## Current maintainers
- Davis Bennett (@d-v-b)