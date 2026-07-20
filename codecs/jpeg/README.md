# JPEG codec

Defines an `array -> bytes` codec that encodes a chunk as a baseline (sequential DCT, Huffman-coded) JPEG image. 


JPEG is a **lossy** image compression format, so this codec MUST NOT be used where exact values must be preserved (e.g. label / segmentation data). 

It is intended for `uint8` image data (grayscale or RGB) where a controlled loss of precision is acceptable in exchange for a high compression ratio.

## Codec name

The value of the `name` member in the codec object MUST be `jpeg`.

## Configuration parameters

- `quality` (integer, required): the JPEG encoding quality, in the range `0`–`100`. Higher values preserve more detail at the cost of a larger encoded size. Decoding does not depend on it.

- `encoded_color_space` (string, required): the color space of the samples as stored in the JPEG stream, for 3-component data. One of:
  - `ycbcr`: the RGB input is converted to YCbCr before encoding (the JFIF-standard color space, and a prerequisite for chroma subsampling). Suitable for natural color images.
  - `rgb`: the three components are stored as-is, with no color-space conversion. Suitable for independent scientific channels (fluorescence, multispectral, …) whose channels are not real colors. The encoder MUST write an APP14 Adobe marker indicating an "unknown" transform, so that decoders do not apply an inverse YCbCr transform.

  This parameter is REQUIRED for 3-component data and has **no default**: the two color spaces are meant for different kinds of data, and silently applying YCbCr would destroy fidelity for data whose channels are not colors. 

  For maximum interoperability, note that encoders and decoders are only guaranteed to support `grayscale` and `ycbcr`; `rgb` (storing color components without conversion) is not supported by all implementations and SHOULD be used only when portability is not a concern. This parameter is defined as an open-ended color space, rather than a simple on/off transform, so that additional color spaces (e.g. XYB, CMYK) can be added later as a backwards-compatible extension.

- `subsampling` (array, required): the subsampling applied to the components of the encoded color space, expressed declaratively as the per-component JPEG sampling factors. It is an array with **one entry per component**, and each entry is a two-element array `[horizontal, vertical]` giving that component's horizontal and vertical sampling factor as integers in the range `1`–`4`. The factors are **relative**: a component is subsampled by the ratio of its factors to the largest factor across all components, so a component with factor `[1, 1]` is stored at half the resolution (in each direction) of a component with factor `[2, 2]`. All-equal factors (e.g. `[[1, 1], [1, 1], [1, 1]]`) therefore mean no subsampling. For `ycbcr`, this is how the chroma components (Cb, Cr) are subsampled relative to luma (Y). The second and third components MUST have factor `[1, 1]`, and the first component's factor MUST be greater than or equal to it in each direction.

For 3-component data, `subsampling` is only meaningful together with `encoded_color_space: ycbcr`; the common `4:2:0` scheme is `[[2, 2], [1, 1], [1, 1]]`. With `encoded_color_space: rgb` it MUST be `[[1, 1], [1, 1], [1, 1]]` (no subsampling), since those components are independent and MUST NOT be subsampled. For grayscale (1-component) data, `subsampling` MUST be `[[1, 1]]`; since there is only one component there is nothing to subsample relative to, so it has no effect.

The common human-readable `J:a:b` chroma-subsampling notation maps to `subsampling` as follows. Implementations MUST support at least these schemes:

  | `J:a:b` | `subsampling` | Chroma resolution vs. luma |
  |---|---|---|
  | `4:4:4` | `[[1, 1], [1, 1], [1, 1]]` | full (no subsampling) |
  | `4:2:2` | `[[2, 1], [1, 1], [1, 1]]` | half horizontally |
  | `4:4:0` | `[[1, 2], [1, 1], [1, 1]]` | half vertically |
  | `4:2:0` | `[[2, 2], [1, 1], [1, 1]]` | half horizontally and vertically |

An implementation MUST reject a configuration whose parameters are invalid for the chunk's channel count (for example, 3-component data without `encoded_color_space`, a `subsampling` array whose length does not match the component count, or a `subsampling` other than `[[1, 1], [1, 1], [1, 1]]` together with `encoded_color_space: rgb`) rather than silently ignoring them.

## Supported data types

- `uint8`

Other data types are not supported by this codec.

## Supported chunk shapes

JPEG stores images with either **1 component** (grayscale) or **3 components** (color). The component count is derived from the chunk shape:

| Chunk shape | Result |
|---|---|
| `(N,)` (1D) | rejected — reshape to 2D first |
| `(H, W)` | 1-component (grayscale) |
| `(H, W, 1)` | 1-component (grayscale) |
| `(H, W, 3)` | 3-component |
| `(H, W, 2)` or `(H, W, C)` with `C ≥ 4` | rejected — reshape/shard so the channel axis is 1 or 3 |
| 4D or higher | rejected — transpose/reshape down to 2D or 3D |

`(H, W, 1)` is accepted as grayscale so that data can be sharded over a size-1 channel axis.

When using different chunk shapes, the [`reshape`](../reshape/) codec should be used prior to the `jpeg` codec to change the chunk shapes into compatible shapes. 

The chunk is flattened in **C order** (last axis varies fastest), so the channel axis must be the innermost axis. If it is not, place a [`transpose`](../transpose/) codec before `jpeg` to move it there.

The spatial axes give the JPEG image `height` (`H`) and `width` (`W`). Each MUST NOT exceed `65535`, since the JPEG format stores each dimension as a 16-bit value. A decoder reshapes the decoded samples by the chunk shape.

JPEG encodes samples in blocks — a *minimum coded unit* (MCU) of 8×8 samples, or up to 16×16 when subsampling is used. When `H` or `W` is not a multiple of the block size, the encoder pads the image up to the next block boundary and the decoder crops back to the stored dimensions, so the chunk shape still round-trips exactly; however, the padded samples share quantized blocks with the real edge samples and can introduce extra artifacts near the right and bottom edges. To avoid this, `H` and `W` SHOULD be multiples of `16` (which covers every subsampling mode; `8` suffices for `4:4:4`). Because Zarr pads boundary chunks to the full chunk shape, choosing a chunk shape whose spatial dimensions are multiples of `16` ensures every encoded image — including boundary chunks — is block-aligned.

## Examples

### Natural color (RGB → YCbCr, 4:2:0)

A 3-component chunk (shape `(H, W, 3)`) holding a natural color image. It is converted to YCbCr and the chroma is subsampled with the common `4:2:0` scheme.

```json
{
    "codecs": [
        {
            "name": "jpeg",
            "configuration": {
                "quality": 90,
                "encoded_color_space": "ycbcr",
                "subsampling": [[2, 2], [1, 1], [1, 1]]
            }
        }
    ]
}
```

### Natural color, no chroma subsampling (4:4:4)

The same shape at higher fidelity: YCbCr conversion but every component kept at full resolution.

```json
{
    "codecs": [
        {
            "name": "jpeg",
            "configuration": {
                "quality": 95,
                "encoded_color_space": "ycbcr",
                "subsampling": [[1, 1], [1, 1], [1, 1]]
            }
        }
    ]
}
```

### Independent scientific channels (`rgb`, no color transform)

No color-space conversion is applied, and the components MUST NOT be subsampled.

```json
{
    "codecs": [
        {
            "name": "jpeg",
            "configuration": {
                "quality": 90,
                "encoded_color_space": "rgb",
                "subsampling": [[1, 1], [1, 1], [1, 1]]
            }
        }
    ]
}
```

### Channel axis not innermost

For a chunk laid out as `(3, H, W)`, place a [`transpose`](../transpose/) codec first to move the channel axis last.

```json
{
    "codecs": [
        { "name": "transpose", "configuration": { "order": [1, 2, 0] } },
        {
            "name": "jpeg",
            "configuration": {
                "quality": 90,
                "encoded_color_space": "ycbcr",
                "subsampling": [[2, 2], [1, 1], [1, 1]]
            }
        }
    ]
}
```

## Format and algorithm

The output is a standard JFIF/JPEG bitstream using baseline (Color Transform, Block Splitting, DCT, Quantization, Huffman)  as defined by [ITU-T81] and [ITU-T871].

### Encoding

1. The component count (1 or 3) is determined from the chunk shape as described above; unsupported shapes are rejected.
2. The `uint8` chunk data is read in C order into a contiguous buffer; the trailing spatial axes give the image `height` (`H`) and `width` (`W`).
3. For 3-component data, the samples are converted to the `encoded_color_space` (RGB → YCbCr for `ycbcr`, no conversion for `rgb`) together with the `subsampling` (for `ycbcr`). For `rgb`, the APP14 Adobe marker indicating an "unknown" transform is written.
4. The samples are encoded as a baseline JPEG at the configured `quality`.

### Decoding

1. The JPEG bitstream is decoded to its `uint8` samples in raster order. The inverse color transform is determined by the stream itself: the APP14 marker, when present, indicates whether an inverse YCbCr transform is applied.
2. For grayscale, the single-component samples are read directly. For color, the three interleaved components are read per pixel.
3. The samples are reshaped to the chunk shape.

## Interoperability notes

- This codec matches neuroglancer `precomputed`'s `jpeg` encoding for 1- and 3-channel `uint8` data, with no data reordering. 
  
- This works because Zarr's C-order over `[z, y, x, channel]` visits samples in the same order (channel, then x, then y, then z) as neuroglancer's Fortran-order over `[x, y, z]`.

- Because JPEG is lossy, decoded values are generally not bit-identical to the original values. Implementations and users should choose `quality` accordingly.

## References

[ITU-T81] ITU-T Recommendation T.81 | ISO/IEC 10918-1. Information technology – Digital compression and coding of continuous-tone still images – Requirements and guidelines. September 1992. URL: https://www.w3.org/Graphics/JPEG/itu-t81.pdf

[ITU-T871] ITU-T Recommendation T.871 | ISO/IEC 10918-5. Information technology – Digital compression and coding of continuous-tone still images: JPEG File Interchange Format (JFIF). May 2011. URL:    https://www.itu.int/rec/T-REC-T.871

## Current maintainers

* [Konstantin Bobenko](https://github.com/konstibob)