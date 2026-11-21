# GeoZL codec

Defines an `array -> bytes` codec that compresses each chunk with [GeoZL](https://github.com/asterisk-labs/geozl), a set of codecs for Earth observation rasters built on [OpenZL](https://github.com/facebook/openzl).
GeoZL adds spatial predictors, block integer packing, NoData handling and bounded-error quantization to OpenZL's graph-based compression.
The codec is lossless by default; with `error` set it is lossy with a guaranteed bound on every sample.

## Codec name

The value of the `name` member in the codec object MUST be `geozl`.

## Configuration parameters

- `recipe` (string, required): the GeoZL graph recipe the encoder runs, such as `planar>zigzag>transpose>entropy` or `planar>zigzag>pfor`.
  A recipe names a predictor followed by the stages that code its residuals, separated by `>`.
  The set of valid recipes and their spelling is defined by GeoZL ([recipe reference](https://github.com/asterisk-labs/geozl/blob/main/.claude/skills/geozl/references/recipes.md)); some recipes apply only to some element widths.
  It is an encoder setting: decoding does not depend on it, because every GeoZL frame records the graph that wrote it.

- `error` (string or `null`, optional): the bounded-error quantizer applied before the recipe, written as a GeoZL error recipe ([near-lossless reference](https://asterisk.coop/geozl/near-lossless.html)).
  Absent or `null` means lossless.
  For every finite sample that is not NoData, the decoded value `x^` and the original `x` satisfy:

  | `error` | Guarantee |
  |---|---|
  | `LINEAR:MAX_ERROR=V` | `abs(x - x^) <= V` |
  | `LOG:MAX_ERROR=P%` | `abs(x - x^) <= (P / 100) * abs(x)` for normal (non-subnormal) values |
  | `SQRT:MAX_ERROR=KN[,A=a,B=b]` | `abs(x - x^) <= K * sqrt(a + b*x)` where `a + b*x > 0` |

  The metadata MUST hold the full recipe as above. Implementations MAY accept shorthands when *building* a configuration (the Python implementation takes `2` for `LINEAR:MAX_ERROR=2` and `"1%"` for `LOG:MAX_ERROR=1%`), but MUST write the full recipe.
  A value that describes zero error, such as `LINEAR:MAX_ERROR=0`, SHOULD be written as an absent `error`.
  Like `recipe`, `error` is an encoder setting that decoding does not depend on.

- `nodata` (number, `"NaN"`, `"Infinity"`, `"-Infinity"` or `null`, optional): a sentinel value that marks missing samples.
  Absent or `null` means no sentinel.
  Samples equal to the sentinel decode exactly, even when `error` is set, and are excluded from prediction and quantization.
  The value MUST be representable in the array's data type, and is compared with samples by bit pattern.
  `float16` arrays do not support a sentinel.
  For floating-point arrays without a sentinel, NaN samples are always kept as NaN.
  The non-finite spellings follow those of `fill_value` in the Zarr v3 core specification.

## Example

For example, the array metadata below compresses `uint16` chunks losslessly:

```json
{
    "codecs": [{
        "name": "geozl",
        "configuration": {
            "recipe": "planar>zigzag>transpose>entropy"
        }
    }]
}
```

and the following keeps every `float32` sample within 0.01 of its original value, with `-9999` marking missing samples:

```json
{
    "codecs": [{
        "name": "geozl",
        "configuration": {
            "recipe": "planar>zigzag>transpose>entropy",
            "error": "LINEAR:MAX_ERROR=0.01",
            "nodata": -9999
        }
    }]
}
```

More examples can be viewed in the [examples](./examples/) subdirectory.

## Supported data types

- `uint8`, `uint16`, `uint32`, `uint64`
- `int8`, `int16`, `int32`, `int64`
- `float16`, `float32`, `float64`

Other data types are not supported by this codec.

## Chunk geometry

GeoZL's predictors read a chunk as one or more *planes*, each made of *rows* of samples. A chunk of shape `shape`, flattened in C order, is mapped as follows:

| Chunk dimensionality | Row width | Rows per plane | Planes |
|---|---|---|---|
| 0 | 1 | 1 | 1 |
| 1, `[n]` | `n` | 1 | 1 |
| 2, `[y, x]` | `x` | `y` | 1 |
| N ≥ 3, `[..., y, x]` | `x` | `y` | product of `shape[:-2]` |
| any chunk with zero elements | 0 | 1 | 1 |

Prediction restarts at each plane, so a `[bands, y, x]` chunk is coded as a stack of independent images.
To predict across another axis, place a [`transpose`](../transpose/) or [`reshape`](../reshape/) codec before this one.

The mapping fixes how an encoder lays out a chunk; decoders do not need it, because each frame records its geometry.
These rules apply to the inner chunk shape when this codec is used inside the [`sharding_indexed`](../sharding_indexed/) codec.

## Format and algorithm

Each encoded chunk is exactly one GeoZL frame, which is an OpenZL frame, with no additional header.

### Encoding

1. The chunk is converted to native-endian samples of its data type in C order.
2. A GeoZL graph is built from `recipe`, `error`, `nodata` and the geometry in [Chunk geometry](#chunk-geometry), and the chunk is compressed through it into one frame.

For `LINEAR` errors on floating-point data and for `SQRT` errors, GeoZL resolves the quantization grid from the range of the samples it is given.
An encoder MUST resolve the grid from a set of samples that contains every sample of the chunk (typically the chunk itself), so that each chunk keeps the bound.
Grids may therefore differ between chunks; each frame records its own.
An encoder MUST refuse a chunk it cannot hold to the bound rather than write it.

### Decoding

1. The frame is decompressed by GeoZL into a byte sequence. It MUST be exactly `prod(shape) * itemsize` bytes long; a decoder MUST reject a frame that decodes to any other length, and SHOULD reject a frame that declares a larger output before allocating it.
2. The bytes are the chunk's samples in C order, in little-endian byte order, and are reshaped to the chunk shape.

A decoder MUST NOT reject a chunk or an array because of the values of `recipe`, `error` or `nodata`. These describe how the frames were written, and a reader may not recognize a recipe that another encoder or a different GeoZL release used. That includes a frame whose graph an encoder composed directly from GeoZL and OpenZL codecs, such as a graph with branches.

Decoders MUST verify the checksums that a frame carries. Lossy frames carry a checksum of the compressed data but not of the content, since the reconstruction differs from the input.

Encoded chunks are untrusted input. Decoders MUST validate every length, count and allocation size in a frame before using it, as GeoZL does.

## Interoperability and compatibility

> [!WARNING]
> GeoZL is pre-1.0. Its [compatibility policy](https://github.com/asterisk-labs/geozl/blob/main/docs/compatibility.md) allows a release to change a codec's frame layout, after which its readers may refuse frames written by earlier releases. Data written with this codec should be read with the GeoZL release that wrote it, or a later one that still reads its layouts, until GeoZL 1.0 fixes the wire format.

- A frame is an OpenZL frame, but most recipes use codecs that only GeoZL registers (predictors, `pfor`, the quantizers, `nodata`). A generic OpenZL decoder without GeoZL's codecs registered, such as `imagecodecs_openzl`, cannot decode them. Frames are not interchangeable with codecs that wrap plain OpenZL.
- The codec is not related to the `numcodecs` or `imagecodecs` codec identifiers, and does not apply to Zarr format 2.
- Partial decoding is not supported; a chunk is always decoded whole.
- GeoZL also decodes frames on NVIDIA and Apple GPUs through its C API; the frame format is the same.

## Implementations

- Python: [`geozl`](https://pypi.org/project/geozl/) registers the codec with `zarr-python` through the `zarr.codecs` entry point as `geozl.zarr_codec.GeoZLCodec`. Proposed in [asterisk-labs/geozl#7](https://github.com/asterisk-labs/geozl/pull/7).

## Change log

No changes yet.

## Current maintainers

* Joe Hamman ([@jhamman](https://github.com/jhamman))
