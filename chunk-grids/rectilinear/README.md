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

A scheme for rectilinear chunking was proposed in a [Zarr extension proposal](https://zarr.dev/zeps/draft/ZEP0003.html) (ZEP). The current specification  