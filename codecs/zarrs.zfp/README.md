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

For example, the array metadata below specifies that the array contains zfp compressed chunks using `fixed_accuracy` mode with a tolerance of 0.05:

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

This codec allows for encoding of higher dimensional arrays by collapsing dimensions of size 1.
For example, a chunk of shape [4, 1, 3, 1, 2, 1] would have a zfp shape of [4, 3, 2].
If the zfp shape has more than 4 dimensions after collapsing, it is an error.
Dimensions of size 1 MUST NOT be collapsed for 1 to 4 dimensional arrays.

These rules apply to the inner chunk shape if this codec is used as the array-to-bytes codec within the `sharding_indexed` codec.

## Supported Data Types

- `int32`, `uint32`, `int64`, `uint64`, `float32`, `float64`

Implementations may support lower-precision data types (e.g. `float16`, `bfloat16`, `int4`, etc.) through promotion / casting to the above data types.

Implementations may support additional data types that could be interpreted or promoted to the above data types (e.g. `datetime64` -> `int64`).

## Format and algorithm

This format is tightly coupled to the [`zfp` C library](https://zfp.readthedocs.io/en/latest/).

### Compression

1. Lower-precision data types must be promoted to 32-bit
  - Floating point data types (e.g. `float16`, `bfloat16`, etc.) can be supported by casting to `float32` in the normal way.
  - Integer data types must be promoted to `int32` in accordance with the `zfp_promote_*` functions:
    - `int` with `N` bits: `int32_value = (int32_t)intN_value << (31 - N)`
    - `uint` with `N` bits: `int32_value = ((int32_t)uintN_value - (1<<(N-1))) << (31 - N)`
2. Data is compressed with `zfp_compress`.

### Decompression

1. Data is decompressed with `zfp_decompress`.
2. Lower-precision data types are restored through demotion:
  - Floating point data types (e.g. `float16`, `bfloat16`, etc.) can be supported by casting from `float32` in the normal way.
  - Integer data types must be be demoted from `int32` in accordance with the appropriate `zfp_demote_*` functions:
    - `int` with `N` bits: `intN_value = (intN_t)clamp(int32_value >> (31 - N), 1<<(N-1), (1<<(N-1)) - 1)`
    - `uint` with `N` bits: `uintN_value = (uintN_t)clamp((int32_value >> (31 - N)) + (1<<(N-1)), 0, (1<<N) - 1)`

## Differences from `numcodecs.zfpy`

- `mode` is a string rather than an integer.
- `mode` supports `reversible` and `expert` mode.
- Lower-precision integer and floating point data types are supported.
- Higher dimensional arrays are supported (provided that at most 4 dimensions have size greater than 1)
- a header is not written with [`zfp_write_header`](https://zfp.readthedocs.io/en/release0.5.5/high-level-api.html#c.zfp_write_header).
  - This header is redundant given the information in the codec configuration.

> [!NOTE]
> An earlier version of the `zfp` codec in `zarrs` Rust crate included an optional [`write_header` parameter](https://docs.rs/zarrs_metadata/0.3.7/zarrs_metadata/v3/array/codec/zfp/struct.ZfpCodecConfigurationV1.html) in the codec configuration.
> This has since been removed in favor of better separating `zfp` and `zfpy`.

## Change log

No changes yet.

## Current maintainers

* [Lachlan Deakin](https://github.com/LDeakin)
