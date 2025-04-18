# ZFP codec

Defines a `array -> bytes` codec that compresses chunks using the [zfp](https://github.com/LLNL/zfp) algorithm.

## Codec name

The value of the `name` member in the codec object MUST be `zarrs.zfp`.

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
        "name": "zarrs.zfp",
        "configuration": {
            "mode": "fixed_accuracy",
            "tolerance": 0.05
        }
    }],
}
```

More examples can be viewed in the [examples](./examples/) subdirectory.

## Supported Data Types

- `int32`, `uint32`, `int64`, `uint64`, `float32`, `float64`
- `int8`, `uint8`, `int16`, `uint16` (through internal promotion 32-bit)

Implementations are permitted to support additional data types that could be interpreted as the above data types (e.g. `datetime64` -> `int64`).

## Format and algorithm

This format is tightly coupled to the [`zfp` C library](https://zfp.readthedocs.io/en/latest/).

### Compression

1. 8 and 16-bit integer data types must be promoted to 32-bit in accordance with the appropriate `zfp_promote_*` method.
2. Data is compressed with `zfp_compress`.

### Decompression

1. Data is decompressed with `zfp_decompress`.
2. 8 and 16-bit integer data types should be demoted in accordance with the appropriate `zfp_demote_*` method.

## Differences from `numcodecs.zfpy`

- `mode` is a string rather than an integer.
- `mode` supports `reversible` and `expert` mode.
- 8 and 16-bit integer data types are supported.
- a header is not written with [`zfp_write_header`](https://zfp.readthedocs.io/en/release0.5.5/high-level-api.html#c.zfp_write_header).
  - This header is redundant given the information in the codec configuration.

> [!NOTE]
> An earlier version of the `zfp` codec in `zarrs` Rust crate included an optional [`write_header` parameter](https://docs.rs/zarrs_metadata/0.3.7/zarrs_metadata/v3/array/codec/zfp/struct.ZfpCodecConfigurationV1.html) in the codec configuration.
> This has since been removed in favor of better separating `zfp` and `zfpy`.

## Change log

No changes yet.

## Current maintainers

* [Lachlan Deakin](https://github.com/LDeakin)
