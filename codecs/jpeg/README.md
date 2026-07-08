# JPEG codec

Defines an `array -> bytes` codec that encodes a chunk as a baseline (sequential DCT, Huffman-coded) JPEG image. 


JPEG is a **lossy** image compression format, so this codec MUST NOT be used where exact values must be preserved (e.g. label / segmentation data). 

It is intended for `uint8` image data (grayscale or RGB) where a controlled loss of precision is acceptable in exchange for a high compression ratio.

This codec is interoperable with the `jpeg` chunk encoding used by [neuroglancer](https://github.com/google/neuroglancer).

## Codec name

The value of the `name` member in the codec object MUST be `jpeg`.

## Configuration parameters

The codec has a single optional parameter:

- `quality` (integer, optional, default `90`): the JPEG encoding quality, in the range `0`–`100`

- higher values preserve more detail at the cost of a larger encoded size. Decoding is independent of it. 

## Supported data types

- `uint8`

Other data types are not supported by this codec.

## Supported chunk shapes

JPEG can only store images with **1 component** (grayscale) or **3 components** (RGB), so the channel count is derived from the chunk shape:

- last axis of extent `3` → **3-channel RGB** (that axis is the interleaved channel axis);
- any other shape → **1-channel grayscale**.

The chunk is flattened in **C order** (last axis varies fastest), so the channel axis must be the innermost axis. If it is not, place a [`transpose`](../transpose/) codec before `jpeg` to move it there. 

The JPEG image `width` and `height` are arbitrary. A decoder reshapes the decoded samples by the chunk shape, not by the image dimensions.

These rules apply to the inner chunk shape when used inside [`sharding_indexed`](../sharding_indexed/).

## Format and algorithm

The output is a standard JFIF/JPEG bitstream using baseline (sequential DCT, Huffman) coding.

### Encoding

1. The `uint8` chunk data is read in C order into a contiguous buffer.
2. The number of channels (1 or 3) is determined from the chunk shape as described above, and the remaining pixel count is factored into a `width * height` image.

### Decoding

1. The JPEG bitstream is decoded to its `uint8` samples in raster order.
2. For grayscale, the single-component samples are read directly (no color-space conversion). For RGB, the three interleaved components are read per pixel.
3. The samples are reshaped to the chunk shape.

## Interoperability notes

- This codec matches neuroglancer `precomputed`'s `jpeg` encoding for 1- and 3-channel `uint8` data, with no data reordering. 
  
- This works because Zarr's C-order over `[z, y, x, channel]` visits samples in the same order (channel, then x, then y, then z) as neuroglancer's Fortran-order over `[x, y, z]`.

- Because JPEG is lossy, decoded values are generally not bit-identical to the original values. Implementations and users should choose `quality` accordingly.



## Current maintainers

* [Konstantin Bobenko](https://github.com/konsti-bobenko)
