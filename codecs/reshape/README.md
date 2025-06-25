# reshape codec

Defines an `array -> array` codec that performs a reshaping operation.

Note that `reshape` always preserves the (logical) lexicographical order (i.e. C
order traversal) of elements within an array, but may be combined with the
`transpose` codec to both reorder and reshape an array.

## Codec name

The value of the `name` member in the codec object MUST be `reshape`.

## Configuration parameters

### `shape`
An array specifying the size `B_shape[i]` of each dimension `i` of
the *output* array `B` as a function of the shape `A_shape` of the input array
`A`.  Each element `shape[i]` must be one of:

- a positive integer `size`, specifying that `B_shape[i] := size`.

- an array of integers `input_dims`, specifying that:

  ```
  B_shape[i] := prod(A_shape[input_dims]]
  ```.

  Specifying the corresponding `input_dims` rather than an explicit `size` is
  paticularly useful when using variable-size chunking.

- the special value `-1`, which must occur at most once, specifying that
  `B_shape[i]` is determined automatically in order to satisfy the
  invariant that `prod(B_shape) == prod(A_shape)`.

Implementations MUST return an error if the invariant

```
prod(B_shape) == prod(A_shape)
```

cannot be satisfied.

Additionally, when `shape[i]` is specified as an array of integers `input_dims`,
implementations MUST return an error if the following constraints are not
satisfied:

- the flattened list of input dimensions, over all elements of `shape`, must be
  in monotonically increasing order, i.e. `"shape": [[0, 1], 10, [3, 4]]` is
  allowed but the following are NOT allowed:

  - `"shape": [[1], [0]]`
  - `"shape": [[1, 0], 10, [3, 4]]`
  - `"shape": [[3, 4], 10, [0, 1]]` are not allowed.

  This constraint serves to avoid confusing `shape` configurations that may
  (incorrectly) suggest a transpose, when in fact the `reshape` codec never
  performs a transpose.

- If `input_dims` specifies `k > 0` input dimensions:

  `prod(B_shape[:i]) == prod(A_shape[input_dims[0]])` and
  `prod(B_shape[i+1:]) == prod(A_shape[input_dims[k-1]+1:])`.

This two constraints ensure that if the size of output dimension `i` is
specified by `input_dims`, the coordinates in the input array along `input_dims`
actually correspond to the raveled index along output dimension `i`.

## Example

For example, the array metadata below specifies that the compressor is the Zstd
codec configured with a compression level of 1 and with the checksum stored:

```json
{
    "chunk_grid": {
      "name": "regular",
      "configuration": {
        "chunk_shape": [100, 50, 64, 3]
      }
    },
    "codecs": [
      {
        "name": "reshape",
        "configuration": {
            "shape": [[0, 1], [2], 3]
        }
      },
      {
        "name": "bytes"
        "configuration": {"endian": "little"}
      }
    ]
}
```

## Format and algorithm

This is an `array -> array` codec.

The dimensionality of the output array `B` is equal to the length of the `shape`
configuration parameter, and the output shape `B_shape` is determined as
specified above.

As this codec does NOT alter the lexicographical order of elements, the contents
of the output array `B` is related to the contents of the input array `A` by:
`ravel(B) == ravel(A)`.

Implementations should, when possible, construct a virtual view rather than copy
the array.

## Change log

No changes yet.

## Current maintainers

* Jeremy Maitin-Shepard ([@jbms](https://github.com/jbms)), Google
