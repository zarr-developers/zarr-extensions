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
   ┌───────────────────────┌──────────────┐
   │                       │              │
   │                       │              │
   │ chunk 0,0             │ chunk 0,1    │
16 │                       │              │
   │                       │              │
   │                       │              │
   │                       │              │
   │───────────────────────└──────────────│
   │                       │              │
   │                       │              │
10 │ chunk 1,0             │ chunk 1,1    │
   │                       │              │
   │                       │              │
   └───────────────────────└──────────────┘                      
```

Every array index resolves to a specific chunk, which can be identified by its index in the chunk 
grid, and an index *within* that chunk, which we refer to here as the "chunk index".

In this example, the array index `(36, 15)` resolves to the chunk grid index `(1, 0)` and the  
chunk index `(12, 15)`. 

More generally, given a tuple of tuples of edge lengths `L` and an array index `idx`, the `nth` 
element of `idx` (denoted `idx[n]`) maps to a chunk grid index by applying the following procedure: 
compute the cumulative sum `C` of the edge lengths in `L[n]`, i.e. 
`C := (L[n][0], L[n][0] + L[n][1], ...)`. The chunk grid index for 
`idx[n]` is given by the index of the first element of `C` that equals or exceeds `idx[n]`. 

Once the chunk grid index is resolved, the chunk index *within* that chunk can be determined by 
subtracting `C[n-1]` (the cumulative sum at the previous chunk grid index) if `n > 0`, or 0, from 
`idx[n]`.

## Metadata

| field | type | required |
| - | - | - |
| `name` | Literal `"rectilinear"` | yes | 
| `configuration` | [configuration](#configuration) | yes | 

### Configuration

| field | type | required | notes |
| - | - | - | - |
| `kind` | Literal `"inline"` | yes | see [kinds of encodings](#kinds-of-encodings) |
| `chunk_shapes` | array of [Chunk edge lengths](#chunk-edge-lengths) | yes |  The length of `chunk_shapes` MUST equal the number of dimensions of the array. 

#### Kinds of encodings

This specification defines a single permitted value for the `kind` field, namely the string 
`"inline"`. Additions to this specification could define new permitted values for the `kind` field
which could define new semantics for the `chunk_shapes` field 

#### Chunk edge lengths

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

This specificiation defines a JSON representation for run-length encoded sequences.

A run-length encoded sequence of `N` repetitions of some value `V` is denoted by the JSON array `[V, N]`. Both `V` and `N` MUST be integers.

For example, the sequence `[1, 1, 1, 1, 1]` becomes `[1, 5]` after applying this run-length encoding. 

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

## Compatibility with other chunk grids

A rectilinear grid is a generalization of a regular grid (a grid of regularly-spaced elements). Any 
[regular chunk grid ](https://zarr-specs.readthedocs.io/en/latest/v3/chunk-grids/regular-grid/index.html) 
can be converted losslessly to a rectilinear chunk grid. 

The simplest procedure is to copy the 
`chunk_shape` field of the regular chunk grid and assign it to the `chunk_shapes` attribute of the 
rectilinear chunk grid. 

## Prior work

A scheme for rectilinear chunking was proposed in a 
Zarr extension proposal (ZEP) called [ZEP 0003](https://zarr.dev/zeps/draft/ZEP0003.html). 
The specification presented here builds on the ZEP 003 proposal and adapts it to the Zarr V3. 

Key difference between this specification and ZEP 003:
- This specification adds run-length encoding for integer sequences
- This specification uses the key `"chunk_shapes"` in the `configuration` field, while ZEP 0003 uses the key `"chunk_shape"`.
