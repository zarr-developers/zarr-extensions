# singleton_dim

Defines an `array -> array` codec which can insert or remove 1-length dimensions.

This is primarily useful to prepare data for another codec which has constraints on the dimensionality of its input.
For example, to apply a 2D image codec to a 3D volume:

- use a [chunk grid](../../chunk-grids/README.md) or a codec like [sharding_indexed](../sharding_indexed/README.md) to reduce one dimension down to size 1
- use the `singleton_dim` codec to drop that dimension
- apply the 2D image codec

This codec has also been referred to by names like `squeeze`, `expand_dims`, `add_axis`, and so on.

## Codec name

The value of the `name` member in the codec object MUST be `singleton_dim`.

## Configuration parameters

The `configuration` object MUST have an `operations` key,
whose value MUST be an array of objects.

The objects in the `operations` array MUST have exactly one key,
which MUST be either `"insert"` or `"remove"`, and whose value MUST be an unsigned integer representing a zero-based index into an array.

## Example

```json
{
    "name": "singleton_dim",
    "configuration": {
        "operations": [
            {"insert": 0},
            {"remove": 3}
        ]
    }
}
```

## Procedure

### Encoding

1. Start with an input array with shape `[i0, i1, ... , iN]`
2. Iterate through the `operations` array from left to right
3. If the key in the operation object is `"insert"`, insert a `1` into the shape array at the given index
    - If the index is greater than the length of the array, raise an error
4. If the key in the operation object is `"remove"`, remove the value in the shape array at the given index
    - If the index is equal to or greater than the length of the array, raise an error
    - If the removed value was not 1, raise an error
5. Reshape the input array into the output shape
    - The number of elements will be the same, and if the input data were contiguous, no copies will be needed

Note that the order of operations is important, as inserting or removing an element from the array changes the indices at which all following elements will be found.

```python
def encode(codec: dict, array: np.ndarray) -> np.ndarray:
    assert codec["name"] == "singleton_dim"
    shape = list(array.shape)
    for op in codec["configuration"]["operations"]:
        if "insert" in op:
            idx = op["insert"]
            assert idx <= len(shape)
            shape.insert(idx, 1)
        elif "remove" in op:
            idx = op["remove"]
            assert idx < len(shape)
            assert shape[idx] == 1
            shape.pop(idx)
    return array.reshape(*shape)
```

### Decoding

Follow the procedure above, except

- iterate through the array from right to left
- treat instances of `"insert"` as if they were `"remove"` and vice versa

```python
def decode(codec: dict, array: np.ndarray) -> np.ndarray:
    assert codec["name"] == "singleton_dim"
    shape = list(array.shape)
    for op in reversed(codec["configuration"]["operations"]):
        if "insert" in op:
            idx = op["insert"]
            assert idx < len(shape)
            assert shape[idx] == 1
            shape.pop(idx)
        elif "remove" in op:
            idx = op["remove"]
            assert idx <= len(shape)
            shape.insert(idx, 1)
    return array.reshape(*shape)
```

## Maintainer

- Chris Barnes <chrislloydbarnes@gmail.com>

## Implementations
