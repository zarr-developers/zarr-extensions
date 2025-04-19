# ZFP codec

Defines a `array -> bytes` codec that compresses chunks using the [zfp](https://github.com/LLNL/zfp) algorithm.

## Codec name

The value of the `name` member in the codec object MUST be `zfp`.

## Configuration parameters

The configuration of this codec matches the compression modes defined at <https://zfp.readthedocs.io/en/latest/modes.html#expert-mode>.
Refer to that page for usage information.

The codec has one parameter which is always required:
- `mode` (string).

The other required parameters are dependent on the `mode`:
- `"mode": "reversible"`
- `"mode": "expert"`
    - `minbits` (unsigned integer)
    - `maxbits` (unsigned integer)
    - `maxprec` (unsigned integer)
    - `minexp` (signed integer)
- `"mode": "fixed_accuracy"`
    - `tolerance` (number)
- `"mode": "fixed_rate"`
    - `rate` (number)
- `"fixed_precision"`
    - `precision` (unsigned integer)

## Example

For example, the array metadata below specifies that the array contains `zfp` compressed chunks using `fixed_accuracy` mode with a tolerance of 0.05:

```json
{
    "codecs": [{
        "name": "zfp",
        "configuration": {
            "mode": "fixed_accuracy",
            "tolerance": 0.05
        }
    }],
}
```

More examples can be viewed in the [examples](./examples/) subdirectory.

## Supported Chunk Shapes

`zfp` natively only supports 1, 2, 3 and 4 dimensional arrays.
Chunk shapes are mapped to `zfp` field sizes according to the [`zfp_field_Nd`](https://zfp.readthedocs.io/en/release0.5.5/high-level-api.html#array-metadata) APIs as follows:
 - 1D: `[nx]`
 - 2D: `[ny, nx]`
 - 3D: `[nz, ny, nx]`
 - 4D: `[nw, nz, ny, nx]`

The chunk of a zero-dimensional Zarr array is interpreted as a 1D `zfp` field with `nx = 1`.

Chunks with more than four dimensions are not supported directly by this codec.
However, higher-dimensional arrays could be supported by collapsing singleton dimensions (dimensions of size 1) using a [`np.squeeze`](https://numpy.org/doc/stable/reference/generated/numpy.squeeze.html) inspired array-to-array codec, provided the resulting dimensionality is four or fewer.
For example, a chunk with shape `[4, 1, 3, 1, 2, 1]` would be squeezed to a `zfp` field size of `[nz, ny, nx] = [4, 3, 2]`.

These rules apply to the inner chunk shape if this codec is used as the array-to-bytes codec within the `sharding_indexed` codec.

## Supported Data Types

- `int32`, `uint32`, `int64`, `uint64`, `float32`, `float64`

Implementations may support lower-precision data types (e.g. `float16`, `bfloat16`, `int4`, etc.) through promotion / casting to the above data types.

Implementations may support additional data types that could be interpreted or promoted to the above data types (e.g. `datetime64` -> `int64`).

## Format and algorithm

This format is tightly coupled to the [`zfp` C library](https://zfp.readthedocs.io/en/latest/).

### Compression

1. Lower-precision data types must first be promoted to 32-bit
   - Floating point data types (e.g. `float16`, `bfloat16`, etc.) can be supported by casting to `float32` in the normal way.
   - Integer data types must be promoted to `int32` in accordance with the [`zfp_promote_*`](https://zfp.readthedocs.io/en/release0.5.5/low-level-api.html#utility-functions) functions:
     - `int` with `N` bits: `int32_value = (int32_t)intN_value << (31 - N)`
     - `uint` with `N` bits: `int32_value = ((int32_t)uintN_value - (1<<(N-1))) << (31 - N)`
2. The uncompressed data is represented as a contiguous array in a [`zfp_field`](https://zfp.readthedocs.io/en/release0.5.5/high-level-api.html#c.zfp_field) and compressed with `zfp_compress`:
   - The field sizes are set in accordance with the rules described in [Supported Chunk Shapes](#supported-chunk-shapes).

### Decompression

1. The data is decompressed into a contiguous array with `zfp_decompress`.
2. Lower-precision data types are restored through demotion:
   - Floating point data types (e.g. `float16`, `bfloat16`, etc.) can be supported by casting from `float32` in the normal way.
   - Integer data types must be be demoted from `int32` in accordance with the appropriate [`zfp_demote_*`](https://zfp.readthedocs.io/en/release0.5.5/low-level-api.html#utility-functions) functions:
     - `int` with `N` bits: `intN_value = (intN_t)clamp(int32_value >> (31 - N), 1<<(N-1), (1<<(N-1)) - 1)`
     - `uint` with `N` bits: `uintN_value = (uintN_t)clamp((int32_value >> (31 - N)) + (1<<(N-1)), 0, (1<<N) - 1)`

## Differences from `numcodecs.zfpy`

- `mode` is a string rather than an integer.
- `mode` supports `reversible` and `expert` mode.
- Lower-precision integer and floating point data types are supported.
- a header is not written with [`zfp_write_header`](https://zfp.readthedocs.io/en/release0.5.5/high-level-api.html#c.zfp_write_header).
  - This header is redundant given the information in the codec configuration.

> [!NOTE]
> An earlier version of the `zfp` codec in the [`zarrs`](https://github.com/LDeakin/zarrs) Rust crate included an optional [`write_header` parameter](https://docs.rs/zarrs_metadata/0.3.7/zarrs_metadata/v3/array/codec/zfp/struct.ZfpCodecConfigurationV1.html) in the codec configuration.
> This has since been removed in favor of better separating `zfp` and `zfpy`.

## Change log

No changes yet.

## Current maintainers

* [Lachlan Deakin](https://github.com/LDeakin)
