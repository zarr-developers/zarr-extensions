# Vlen-ndarray data type

This document defines `vlen-ndarray`, a data type for arrays whose elements
are variable-length n-dimensional arrays: each element is an array of shape
`(n, *inner_shape)`, where the leading dimension `n` varies per element and
the trailing dimensions (`inner_shape`) and the scalar data type are fixed by
the configuration.

## Background

Ragged data — a regular grid of cells where each cell holds a variable number
of fixed-size records — is common in scientific workflows: per-cell point
observations, t-digest centroid sets, index lists, event records. Zarr v3 has
no native ragged array support; the common workaround stores each element's
raw bytes under the [`"bytes"`](../bytes/README.md) data type and documents
the element interpretation out of band (e.g. in `attributes`). The
`vlen-ndarray` data type promotes that interpretation into the type system:
the array is self-describing, and implementations can return typed arrays per
element instead of opaque byte strings.

`vlen-ndarray` is deliberately encoding-compatible with the `bytes` data type:
when the paired [`vlen-ndarray` codec](../../codecs/vlen-ndarray/README.md) is
used, encoded chunks are byte-identical to `bytes` + `vlen-bytes` chunks whose
elements are each element's raw little-endian bytes. Converting such a store
to `vlen-ndarray` is a metadata-only change.

## Data type representation

A `vlen-ndarray` data type is represented in array metadata as the value of
the `data_type` metadata key. The value MUST be a JSON object with the
following fields:

| field | type | required |
| - | - | - |
| `name` | Literal `"vlen-ndarray"` | yes |
| `configuration` | [Configuration](#configuration) | yes |

The `configuration` field is required: the inner scalar data type and the
inner shape have no defaults. The short-hand form available to extensions
that require no configuration metadata — the bare string `"vlen-ndarray"` in
place of the object — MUST NOT be used for this data type.

### Configuration

The `configuration` field is a JSON object with the following fields:

| field | type | required | notes |
| - | - | - | - |
| `dtype` | string | yes | The scalar data type of the inner arrays. See [`dtype`](#dtype). |
| `inner_shape` | array of integers | yes | The fixed trailing dimensions of every element. See [`inner_shape`](#inner_shape). |

No additional fields are permitted in the configuration.

An element of an array with this data type is an ndarray of shape
`(n, *inner_shape)` with scalar type `dtype`, where `n` is a non-negative
integer that may differ between elements. `n` is not stored in metadata; it is
implied by each element's encoded byte length. The framing of the
[`vlen-ndarray`](../../codecs/vlen-ndarray/README.md) codec records each
element's payload length as a 32-bit unsigned integer, so `n` MUST NOT exceed
`floor((2^32 - 1) / item_size)`, where `item_size` is the size in bytes of one
`(1, *inner_shape)` item.

#### `dtype`

`dtype` names the scalar data type of the inner arrays. It MUST be one of the
fixed-size boolean, integer, floating point, or complex
[core data types](https://zarr-specs.readthedocs.io/en/latest/v3/data-types/index.html#core-data-types):
`"bool"`, `"int8"`, `"int16"`, `"int32"`, `"int64"`, `"uint8"`, `"uint16"`,
`"uint32"`, `"uint64"`, `"float16"`, `"float32"`, `"float64"`, `"complex64"`,
or `"complex128"`. Variable-size and parameterized data types MUST NOT be
used.

> Note: `float16` is listed as "(optionally supported)" in the core data types
> table, so an implementation that supports `vlen-ndarray` may nonetheless be
> unable to handle `"dtype": "float16"`.

#### `inner_shape`

`inner_shape` gives the fixed trailing dimensions of every element. Each
member MUST be an integer greater than or equal to 1. An empty array means
each element is a one-dimensional array of shape `(n,)`.

### Examples

Array metadata for a one-dimensional array whose elements are `(n, 2)` float32
arrays:

```json
{
  "zarr_format": 3,
  "node_type": "array",
  "shape": [12288],
  "data_type": {
    "name": "vlen-ndarray",
    "configuration": {
      "dtype": "float32",
      "inner_shape": [2]
    }
  },
  "chunk_grid": {
    "name": "regular",
    "configuration": {"chunk_shape": [1024]}
  },
  "chunk_key_encoding": {"name": "default"},
  "fill_value": "",
  "codecs": [
    {"name": "vlen-ndarray"},
    {"name": "zstd", "configuration": {"level": 3}}
  ]
}
```

The following configuration describes elements that are one-dimensional
`(n,)` uint64 arrays:

```json
{
  "dtype": "uint64",
  "inner_shape": []
}
```

## Fill value representation

The `fill_value` metadata member MUST be a string containing the
[base64](https://en.wikipedia.org/wiki/Base64)-encoded raw bytes of the fill
element, in little-endian byte order and C (row-major) element order, whose
byte length MUST be a whole multiple of the element item size (the size in
bytes of one `(1, *inner_shape)` item). The empty string encodes the empty
element of shape `(0, *inner_shape)`, which is the recommended and default
fill value.

## Codec compatibility

Arrays with this data type MUST use the
[`vlen-ndarray`](../../codecs/vlen-ndarray/README.md) `array -> bytes` codec,
either directly in the array's codec chain or as the `array -> bytes` codec
within the inner codec chain of the
[`sharding_indexed`](../../codecs/sharding_indexed/README.md) codec.
`bytes -> bytes` codecs (for example, `gzip`, `zstd`, `blosc`) MAY be applied
on top for compression.

## Notes on interoperability and compatibility

- The encoded chunk representation is byte-identical to the
  [`bytes`](../bytes/README.md) data type with the
  [`vlen-bytes`](../../codecs/vlen-bytes/README.md) codec, where each element
  is the raw little-endian bytes of the element array in C (row-major) order.
  Implementations without `vlen-ndarray` support can therefore fall back to
  reading such arrays as `bytes` + `vlen-bytes` after a metadata substitution,
  and existing `bytes`-typed stores following this convention can be upgraded
  by rewriting metadata only.
- A reference implementation is provided by the
  [`zarr-vlen-ndarray`](https://github.com/espg/zarr-vlen-ndarray) Python
  package (registered with zarr-python via entry points).
- This data type serves the `zagg-ragged/2` store revision of the
  [zagg](https://github.com/englacial/zagg) aggregation pipeline; the `/1`
  revision is the `bytes`-typed convention described above.

## Change log

No changes yet.

## Current maintainers

* [Shane Grigsby](https://github.com/espg)
