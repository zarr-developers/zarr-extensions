# Rectilinear chunk grid

## Metadata

| field | type | required |
| - | - | - |
| `"name"` | Literal `"rectilinear"` | yes | 
| `"configuration"` | [#configuration][] | yes | 

### Configuration

| field | type | required | notes |
| - | - | - | - |
| `"kind"` | Literal `"inline"` | yes |  |
| `"chunk_shapes"` | array of [Chunk edge lengths](#chunk-edge-lengths) | yes |  The length of `"chunk_shapes"` MUST match the number of dimensions of the array.

#### Chunk edge lengths

The edge lengths of the chunks along an array axis `A` are represented by an array that can contain two types of elements:
- an integer that explicitly denotes an edge length.
- an array that denotes a [run-length encoded](#run-length-encoding) sequence of integers, each of which denotes an edge length.

The sum of the edge lengths MUST match the length of the array along the axis `A`.

#### Run-length encoding

This specificiation defines a JSON representation for run-length encoded sequences.

A run-length encoded sequence of `N` repetitions of some value `V` is denoted by the length-2 JSON array `[V, N]`.

For example, the sequence `[1, 1, 1, 1, 1]` becomes `[1, 5]` after applying this run-length encoding. 

## Resolving

## Example

This example demonstrates 5 different ways of specifying a rectilinear chunk grid for an array with shape `(6, 6, 6, 6, 6)`.

```javascript
{
    ...
    "shape": [6, 6, 6, 6, 6],
    "chunk_grid": {
        "name": "rectilinear",
        "configuration": {
            "kind": "inline",
            "chunk_shapes": [
                [[2, 3]], // expands to [2, 2, 2]
                [[1, 6]], // expands to [1, 1, 1, 1, 1, 1]
                [1, [2, 1], 3], // expands to [1, 2, 3]
                [[1, 3], 3], // expands to [1, 1, 1, 3]
                [6] // expands to [6]
            ]
        }
    }
}
```

## Prior work

A scheme for rectilinear chunking was proposed in a [Zarr extension proposal](https://zarr.dev/zeps/draft/ZEP0003.html) (ZEP). The specification presented here builds on the ZEP 3 proposal and adapts it to the Zarr V3. 

Key difference between this specification and ZEP 003:
- This specification adds run-length encoding for integer sequences
- This specification uses the key `"chunk_shapes"` in the `configuration` field, while ZEP 0003 uses the key `"chunk_shape"`
- Zep 0003 defines a meaning for single-integer elements of its `chunk_shape` metadata: `"chunk_shape" : [10]` declares a sequence of chunks with length 10 repeated to match the shape of the array. While convenient, we avoid the single-integer form here because it ambiguously handles chunks at the end of an array.