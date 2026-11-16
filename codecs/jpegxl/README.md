# jpegxl codec

Defines an `array -> bytes` codec that encodes an array chunk as a
[JPEG XL](https://jpeg.org/jpegxl/) codestream.

JPEG XL supports both lossless and lossy compression of 8- and 16-bit integer
and floating-point samples, with one or more channels and one or more frames.
This codec is intentionally minimal: it fixes a simple relationship between the
array chunk and the JPEG XL image, and delegates all dimension rearrangement to
the [`reshape`](../reshape/README.md) and [`transpose`](../transpose/README.md)
codecs.

> This document is a proposed extension. It is licensed under the
> [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).

## Codec name

The value of the `name` member in the codec object MUST be `jpegxl`.

## Configuration parameters

The `configuration` object is REQUIRED and records the encoding parameters used
to produce the codestream. These parameters do not affect decoding (see below),
but recording them makes the encoding deliberate and reproducible. 
This follows the convention of the other image codecs in
this repository (for example [`jpeg`](../jpeg/README.md)).

The configuration covers the JPEG XL encoding parameters that determine the
bytes written to the codestream. It is a **closed set**: implementations MUST
NOT emit members other than those below, and a store is non-conformant if
`configuration` contains unrecognized members. Encoders may provide sensible
default values to users, but they should write those defaults into the metadata
as a definitive source of truth about how to encode blocks. 

**Always present**:

- **`lossless`** (boolean): whether the codestream is mathematically lossless.
  When `true`, `distance` MUST be `0`; when `false`, `distance` MUST be greater
  than `0`.
- **`distance`** (number, ≥ 0): the Butteraugli distance target. `0` means
  mathematically lossless; larger values allow more loss for smaller output.
- **`effort`** (integer, `1`–`10`): the encoder effort/speed setting. Higher
  values spend more time to reduce the encoded size.
- **`decodingspeed`** (integer, `0`–`4`): tier trading encoded size for decode
  speed (`0` = default, smallest).
- **`photometric`** (string, one of `gray`, `rgb`, `xyb`, `unknown`): the color
  space the encoder writes into the codestream. 
- **`primaries`** (string, one of `srgb`, `p3`, `bt2100`, `custom`): the color
  primaries.
- **`transfer`** (string, one of `srgb`, `linear`, `pq`, `hlg`, `dci`, `bt709`,
  `gamma`, `unknown`): the transfer function. 
- **`bitspersample`** (integer, `1`–`32`): the sample bit depth. For integers it
  MAY be below the type width to losslessly pack low-range values (the encoder
  MUST ensure every value fits, or the result is lossy); for floats it MUST
  equal the width. See [Supported data types](#supported-data-types).
- **`usecontainer`** (boolean): whether the codestream is wrapped in the ISOBMFF
  container. (see [Encoded representation](#encoded-representation)).

Some parameters supported by JPEG XL bindings are deliberately **excluded**: a
`planar` (channel-separated) layout, because this codec requires the sample axis
to be the innermost, interleaved axis (see
[Sample layout and color](#sample-layout-and-color)); and decode-time selectors
such as a frame `index` or an orientation toggle, because every frame is decoded
to the `F` axis and orientation handling is fixed by this specification (see
[Orientation](#orientation)).

### Decoding does not use the configuration

Although the parameters above are required, a decoder MUST NOT use them. A
decoder MUST derive the image geometry (`W`, `H`, `S`, `F`), the sample data
type, and the color encoding solely from the JPEG XL codestream, and MUST NOT
change its output based on any member of `configuration`. This is possible
because a JPEG XL codestream fully self-describes its dimensions, bit depth, and
color encoding — including any internal color transform (XYB, YCbCr) and chroma
subsampling. There is therefore **no decode-time parameter** analogous to the
color-space selector that baseline JPEG/JFIF requires (where three channels are
ambiguously either RGB or YCbCr and the decoder must be told which).

See [`schema.json`](./schema.json) for the JSON schema.

## Encoded representation

The encoded chunk is a JPEG XL image in either of the two forms permitted by
the JPEG XL standard: a bare codestream (beginning with `0xFF 0x0A`) or the
ISOBMFF box container (beginning with the JXL container signature `0x00 0x00 0x00 0x0C 0x4A 0x58 0x4C 0x20 0x0D 0x0A 0x87 0x0A`). Decoders
MUST accept both forms. Encoders SHOULD write a bare codestream; the container
form exists to carry metadata boxes (Exif, XMP, JPEG-reconstruction data) that
this codec does not use, and decoders MUST ignore any such boxes.

## Array shape contract

Let the JPEG XL image have `width` (`W`), `height` (`H`), `samples` (`S`, the
number of interleaved sample channels) and `frames` (`F`, the number of
animation keyframes). The decoded array chunk MUST equal the _native JPEG XL
shape_

```
[F, H, W, S]
```

in C (row-major) order, with the `F` axis omitted when `F == 1` and the `S` axis
omitted when `S == 1`. Equivalently, the chunk shape MUST be one of:

| chunk shape    | meaning                      |
| -------------- | ---------------------------- |
| `[H, W]`       | single-frame, single-channel |
| `[H, W, S]`    | single-frame, multi-channel  |
| `[F, H, W]`    | multi-frame, single-channel  |
| `[F, H, W, S]` | multi-frame, multi-channel   |

Decoders MUST return an error if the chunk shape is not one of these forms, or
if `W`, `H`, `S`, `F` derived from the codestream are not consistent with it.

**Disambiguating the two 3-D forms.** A three-dimensional chunk is either
`[H, W, S]` (single frame, `S` channels) or `[F, H, W]` (`F` frames, one
channel). Following the reference bindings
([`imagecodecs`](https://github.com/cgohlke/imagecodecs)), the two are told
apart by the trailing axis size: **≤ 4** is the sample axis `S` (`[H, W, S]`);
**≥ 5** is the width, so the leading axis is the frame axis `F` (`[F, H, W]`).
The interleaved form is therefore limited to `S ≤ 4` (see
[Channels](#channels-s)).

Aside from this trailing-axis rule, the codec does not infer which axes are
spatial, channel, or frame. To store any chunk shape not already in one of the
forms above — including an array with more than four channels — chain a
`reshape` (and, if the channel axis is not innermost, a `transpose`) codec
before `jpegxl`.

### Channels (`S`)

The JPEG XL codestream distinguishes _color channels_ (1 for grayscale or 3 for
a color image; XYB/YCbCr transforms and chroma subsampling apply only to these)
from _extra channels_ (alpha, depth, and other data), and the format permits a
large number of extra channels. The `S` axis of the decoded chunk is the total
number of interleaved sample channels the decoder produces (color channels plus
extra channels).

The interleaved form (`S ≤ 4`, per the rule above) covers:

| `S` | interpretation | color + extra channels |
| --- | -------------- | ---------------------- |
| `1` | grayscale (L)  | 1 gray                 |
| `2` | grayscale + alpha (LA) | 1 gray + 1 extra (alpha) |
| `3` | RGB            | 3 color                |
| `4` | RGB + alpha (RGBA) | 3 color + 1 extra (alpha) |

The reference decoders support all four (`S ∈ {1, 2, 3, 4}`) and return any
alpha/extra channel as stored (it is not forced opaque). Decoders MUST return an
error for a channel count they do not support rather than silently mismatching
the chunk shape.

`S` is **not** a way to stack unrelated channels. For data with many
independent channels (e.g. fluorescence or multispectral microscopy), carry each
channel on the frame (`F`) axis instead — chain a `reshape`/`transpose` so each
channel becomes an independent grayscale image. This both fits `S ≤ 4` and
preserves per-channel fidelity, since no cross-channel color transform is
applied. The interleaved `[H, W, 3]` form is for genuine RGB color only, and
should be chosen deliberately rather than by default.

## Supported data types

`uint8`, `uint16`, `float16`, and `float32`.

The codestream's sample type (integer vs. float) and bit depth relate to the
array data type as follows:

| data type | codestream sample type | `bits_per_sample` | exponent bits |
| --------- | ---------------------- | ----------------- | ------------- |
| `uint8`   | integer                | `1`–`8`           | —             |
| `uint16`  | integer                | `1`–`16`          | —             |
| `float16` | float                  | 16                | 5 (IEEE half) |
| `float32` | float                  | 32                | 8 (IEEE single) |

- **Float data types** MUST use the exact bit depth shown (16 with 5 exponent
  bits for `float16`, 32 with 8 for `float32`); a reduced float bit depth is not
  supported. Note that `float16` and `uint16` both have `bits_per_sample` 16, so
  a decoder MUST use the float flag and exponent-bit count, not the bit width
  alone, to tell them apart.
- **Integer data types** MAY use any bit depth up to the type's width. A depth
  *below* the width losslessly stores data whose values fit in that many bits
  (for example, `uint16` data in the range `0`–`4095` may be stored at
  `bits_per_sample` 12), giving a smaller codestream. An encoder MUST NOT write
  an integer bit depth larger than the array data type's width.

**Value preservation (no rescaling).** A decoder MUST return the sample values
exactly as stored, placed in the array data type without any rescaling. In
particular, a sample stored at `bits_per_sample` `N` keeps its `0`–`2^N−1` value
in the wider container; a decoder MUST NOT expand it to the array type's full
range. (Equivalently, a decoder that normalizes samples to `[0, 1]` MUST map
back using the codestream's `bits_per_sample`, `2^N−1`, not the array type's
width.) A decoder that cannot preserve values this way MUST return an error
rather than produce rescaled data. The bit depth is recorded in the codestream,
so decoders never need the `configuration` to determine it.

## Sample layout and color

Samples are stored in C order, so for a chunk shape ending in `S` the channels
are interleaved (the innermost, unit-stride axis). If a different in-memory
channel order is required, use the `transpose` codec.

Decoders MUST return samples in the color space signaled by the codestream
header — inverting the codestream's internal transforms (XYB, YCbCr, chroma
upsampling) but applying no further conversion toward a display color space (no
forced sRGB gamma, no ICC conversion). Many general-purpose JPEG XL APIs convert
to a display profile by default and MUST have that disabled. Lossless decoding
is bit-exact.

> **Note:** JPEG XL can be lossy. Repeated decode/encode cycles compound
> artifacts, and lossy compression is unsuitable for label/segmentation data.

## Orientation

A JPEG XL codestream can record an EXIF-style image orientation (rotation/flip)
in its header, but the zarr specification is to not include this but instead 
store such information as an reshape, transpose, or image transformation.
If a codestream has an EXIF-style orientaiton, decoders for this codec 
**MUST NOT** apply that orientation transform: they MUST return samples
in the stored pixel order, so that the decoded chunk matches the array's
own axis order exactly. Any reorientation for display belongs to the 
OME-Zarr coordinate transforms of the surrounding array, not to this codec.

Implementations built on general JPEG XL libraries that apply orientation by
default MUST disable it (for example, `imagecodecs` decoders MUST pass
`keeporientation=True`; the `jxl-oxide`-based reference decoder already returns
stored order).

## Relationship to a shared image layout

The `[F, H, W, S]` native shape here is a special case of the more general
image-layout contract that image codecs share — for instance the contiguous
(interleaved) axis order `[frames…] [depth] height width [samples]` used by the
[`imagecodecs`](https://github.com/cgohlke/imagecodecs) "image layout"
abstraction (`imagecodecs/_shared.pyx`), with `depth = 1` for this 2-D-per-frame
codec. The shape and channel model defined here is intended to be generalizable
to other image-format codecs (JPEG, JPEG 2000, WebP, …); standardizing a single
shared shape/channel contract across them is left to a follow-on discussion, so
this document specifies it directly for `jpegxl`.

## Examples

### 2-D grayscale tile

A single-channel 2-D tile is a `[H, W]` chunk encoded directly, with no
`reshape` needed.

```json
{
  "chunk_grid": {
    "name": "regular",
    "configuration": { "chunk_shape": [256, 256] }
  },
  "codecs": [
    {
      "name": "jpegxl",
      "configuration": { ... }
    }
  ]
}
```

### 2-D RGB tile

A natural-color image with the three color channels interleaved as the innermost
axis is a `[H, W, 3]` chunk. The trailing axis of size 3 is the sample axis, so
JPEG XL encodes an RGB image. Choose this deliberately for true-color data; do
not use it to stack unrelated channels (see [Channels](#channels-s)).

```json
{
  "chunk_grid": {
    "name": "regular",
    "configuration": { "chunk_shape": [256, 256, 3] }
  },
  "codecs": [
    {
      "name": "jpegxl",
      "configuration": { ... }
    }
  ]
}
```

### RGBA (color + alpha)

A `[H, W, 4]` chunk encodes three RGB color channels plus one alpha (extra)
channel. The alpha channel is stored and returned as-is (not forced opaque).

```json
{
  "chunk_grid": {
    "name": "regular",
    "configuration": { "chunk_shape": [256, 256, 4] }
  },
  "codecs": [
    {
      "name": "jpegxl",
      "configuration": { ... }
    }
  ]
}
```

### Channel axis not innermost (`transpose`)

If the color channel axis is not the innermost dimension — for example a
channel-first `[3, H, W]` chunk (`c, y, x`) — insert a `transpose` codec to move
it to the innermost position, so `jpegxl` receives `[H, W, 3]`.

```json
{
  "chunk_grid": {
    "name": "regular",
    "configuration": { "chunk_shape": [3, 256, 256] }
  },
  "codecs": [
    { "name": "transpose", "configuration": { "order": [1, 2, 0] } },
    {
      "name": "jpegxl",
      "configuration": { ... }
    }
  ]
}
```

### Multi-frame stack (`reshape`)

The metadata below stores a `[1, 1, 32, 256, 256]` chunk (for example a
`c, t, z, y, x` layout) as a single 32-frame JPEG XL
image. The `reshape` codec drops the two leading unit dimensions to produce the
`[32, 256, 256]` (`[F, H, W]`) native image shape.

```json
{
  "chunk_grid": {
    "name": "regular",
    "configuration": { "chunk_shape": [1, 1, 32, 256, 256] }
  },
  "codecs": [
    { "name": "reshape", "configuration": { "shape": [[2], [3], [4]] } },
    {
      "name": "jpegxl",
      "configuration": { ... }
    }
  ]
}
```

### Many independent channels (compress each separately)

For data with many independent measurement channels (e.g. fluorescence or
multispectral microscopy), do not interleave them as `S`: the interleaved-sample
form is limited to `S ≤ 4`, and `S = 3` applies an RGB color transform that is
inappropriate for channels that are not real colors. Instead keep each channel
as its own grayscale image, carried on the frame (`F`) axis. Because every frame
is an independent grayscale image, per-channel fidelity is preserved (no
cross-channel color transform) in either of the two layouts below.

**One channel per chunk.** Chunk the channel axis to `1` so each chunk holds a
single channel, and use `reshape` to drop that unit axis. A `[c, z, y, x]` array
chunked `[1, 32, 256, 256]` becomes a `[32, 256, 256]` grayscale frame stack —
one JPEG XL image per channel. This gives the finest access granularity (a
single channel can be read without touching the others).

```json
{
  "chunk_grid": {
    "name": "regular",
    "configuration": { "chunk_shape": [1, 32, 256, 256] }
  },
  "codecs": [
    { "name": "reshape", "configuration": { "shape": [[1], [2], [3]] } },
    {
      "name": "jpegxl",
      "configuration": { ... }
    }
  ]
}
```

**Multiple channels per chunk (channels and frames combined).** Alternatively,
keep several channels in one chunk and fold the channel and z axes together onto
the frame axis; `reshape` un-folds them back into separate channel and z axes on
decode. A `[c, z, y, x]` array chunked `[3, 32, 256, 256]` (3 channels ×
32 z-slices) becomes a `[96, 256, 256]` grayscale frame stack (`F = 3 × 32`),
where the `[[0, 1], [2], [3]]` reshape maps input dimensions `c` and `z` onto the
single frame axis (in C order, so frame `f = c·32 + z`). This packs a whole
volume into one JPEG XL image (fewer, larger chunks). The channels remain separate grayscale frames preserving per-channel fidelity exactly as the per-channel layout does.

```json
{
  "chunk_grid": {
    "name": "regular",
    "configuration": { "chunk_shape": [3, 32, 256, 256] }
  },
  "codecs": [
    { "name": "reshape", "configuration": { "shape": [[0, 1], [2], [3]] } },
    {
      "name": "jpegxl",
      "configuration": { ... }
    }
  ]
}
```

## Example data

See the fixtures under
[`testdata/jxl`](https://github.com/google/neuroglancer/tree/master/testdata/jxl)
in the neuroglancer repository (`gray_u8_4x4.jxl`, `rgb_u8_2x2.jxl`, and the
1×1 `uint8`/`uint16`/`float32` samples), together with their `fixtures.json`
describing the expected decoded values.

## Interoperability and compatibility

- The native shape contract matches the (squeezed) decode output of the
  [`imagecodecs`](https://github.com/cgohlke/imagecodecs) `JpegXl` numcodecs
  codec, with the `squeeze` behavior delegated to the `reshape` codec.
- A reference decoder implementation is provided by
  [neuroglancer](https://github.com/google/neuroglancer) in
  `src/datasource/zarr/codec/jpegxl`, which decodes  `jpegxl` chains using the `jxl-oxide` JPEG XL decoder compiled to WebAssembly.  It also supports the `transpose` and `reshape` codecs which are required to make this practically useful for general Nd data. 

## Change log

No changes yet.

## Current maintainers

- TBD