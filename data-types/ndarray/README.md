# Ndarray data type

This document defines `ndarray`, a data type for arrays whose elements are
themselves n-dimensional arrays of a fixed scalar data type. The element
shape is given in the configuration as a pattern in which `null` marks a
variable-length dimension: `{"dtype": "float32", "shape": [null, 2]}`
describes elements of shape `(n, 2)` with `n` varying per element, while
`{"dtype": "float32", "shape": [3, 2]}` describes fixed `(3, 2)` elements.

## Background

Ragged data — a regular grid of cells where each cell holds a variable number
of fixed-size records — is common in scientific workflows: per-cell point
observations, t-digest centroid sets, index lists, event records. Zarr v3 has
no native ragged array support; the common workaround stores each element's
raw bytes under the [`"bytes"`](../bytes/README.md) data type and documents
the element interpretation out of band (e.g. in `attributes`). The `ndarray`
data type promotes that interpretation into the type system: the array is
self-describing, and implementations can return typed arrays per element
instead of opaque byte strings.

The data type is deliberately general — the shape pattern admits fixed
shapes, one variable dimension, or several — while the `array -> bytes` codec
paired with the array determines which subset of shape patterns is actually
encodable (see [Codec compatibility](#codec-compatibility)). This keeps the
data type stable as codecs for further patterns are registered: adding one
requires no revision here.

## Data type representation

### Name

The name of this data type is the string `"ndarray"`.

An `ndarray` data type is represented in array metadata as the value of the
`data_type` metadata key. The value MUST be a JSON object with the following
fields:

| field | type | required |
| - | - | - |
| `name` | Literal `"ndarray"` | yes |
| `configuration` | [Configuration](#configuration) | yes |

The `configuration` field is required: the inner scalar data type and the
shape pattern have no defaults. The short-hand form available to extensions
that require no configuration metadata — the bare string `"ndarray"` in
place of the object — MUST NOT be used for this data type.

### Configuration

The `configuration` field is a JSON object with the following fields:

| field | type | required | notes |
| - | - | - | - |
| `dtype` | string | yes | The scalar data type of the elements. See [`dtype`](#dtype). |
| `shape` | array of integers and nulls | yes | The element shape pattern. See [`shape`](#shape). |

No additional fields are permitted in the configuration.

An element of an array with this data type is an ndarray with scalar type
`dtype` whose shape matches the pattern `shape`: the element has exactly one
dimension per pattern member, with the extent of each fixed (integer)
dimension equal to the pattern value and the extent of each variable (`null`)
dimension an independent non-negative integer that may differ between
elements. The extents of variable dimensions are not stored in metadata;
whether (and how) they are recoverable from an element's encoded bytes is a
property of the codec serving the array (see
[Codec compatibility](#codec-compatibility)).

#### `dtype`

`dtype` names the scalar data type of the elements. It MUST be one of the
fixed-size boolean, integer, floating point, or complex
[core data types](https://zarr-specs.readthedocs.io/en/latest/v3/data-types/index.html#core-data-types):
`"bool"`, `"int8"`, `"int16"`, `"int32"`, `"int64"`, `"uint8"`, `"uint16"`,
`"uint32"`, `"uint64"`, `"float16"`, `"float32"`, `"float64"`, `"complex64"`,
or `"complex128"`. Variable-size and parameterized data types MUST NOT be
used.

> Note: `float16` is listed as "(optionally supported)" in the core data types
> table, so an implementation that supports `ndarray` may nonetheless be
> unable to handle `"dtype": "float16"`.

Whichever `array -> bytes` codec serves the array, the scalars within an
element are encoded exactly as the core data type named by `dtype` encodes
them — fixed size, no padding between scalars. In particular a `bool` scalar
occupies one byte whose value MUST be `0x00` (false) or `0x01` (true).

#### `shape`

`shape` gives the element shape pattern. It MUST be a non-empty array; each
member MUST be either an integer greater than or equal to 1 (a fixed
dimension) or `null` (a variable-length dimension). A pattern with no `null`
member describes fixed-shape elements.

Fixed dimensions MUST be written as JSON integers. A number with a fractional
part is not conformant, including a spelling whose fractional part is zero
such as `2.0`; JSON Schema's `"type": "integer"` accepts that spelling, so
the accompanying [`schema.json`](schema.json) cannot express this restriction
and it is stated normatively here instead.

An empty pattern (`[]`, describing zero-dimensional elements) is not
permitted: such an element is a single `dtype` scalar, so the scalar data
type should be used directly instead.

### Shape patterns gate codecs

The configured shape pattern determines which `array -> bytes` codecs may
serve the array. Two rules establish which patterns a given codec serves:

- An **extension** `array -> bytes` codec used with this data type MUST
  declare, in its own registration document, which shape patterns it serves.
- The **core** [`bytes`](../../codecs/bytes/README.md) codec serves exactly
  the patterns with no variable dimension. Its encoding for this data type is
  defined by [Bytes codec encoding](#bytes-codec-encoding) below, not by the
  core codec's own registration; pairing it with a pattern that contains a
  variable (`null`) dimension is invalid, because such elements have no fixed
  byte size.

Array metadata that pairs this data type with an `array -> bytes` codec that
does not serve the configured pattern is invalid; implementations MUST report
an error rather than guess an encoding.

### Examples

Array metadata for a one-dimensional array whose elements are `(n, 2)`
float32 arrays, using the [`vlen-ndarray`](../../codecs/vlen-ndarray/README.md)
codec:

```json
{
  "zarr_format": 3,
  "node_type": "array",
  "shape": [12288],
  "data_type": {
    "name": "ndarray",
    "configuration": {
      "dtype": "float32",
      "shape": [null, 2]
    }
  },
  "chunk_grid": {
    "name": "regular",
    "configuration": { "chunk_shape": [1024] }
  },
  "chunk_key_encoding": { "name": "default" },
  "fill_value": "",
  "codecs": [
    { "name": "vlen-ndarray" },
    { "name": "zstd", "configuration": { "level": 3 } }
  ]
}
```

The following configuration describes elements that are one-dimensional
`(n,)` uint64 arrays:

```json
{
  "dtype": "uint64",
  "shape": [null]
}
```

The following configuration describes fixed-shape `(3, 2)` int16 elements:

```json
{
  "dtype": "int16",
  "shape": [3, 2]
}
```

## Bytes codec encoding

This section defines how the core [`bytes`](../../codecs/bytes/README.md)
codec encodes elements of this data type. It applies to the patterns with no
variable dimension, which are the only patterns that codec serves (see
[Shape patterns gate codecs](#shape-patterns-gate-codecs)).

Each element is encoded as the packed concatenation of its `d1 × ... × dk`
scalars in C (row-major) order — the last dimension varies fastest — with
each scalar encoded as the core data type named by `dtype` encodes it. No
padding bytes are inserted between scalars. The encoded size of one element
is the scalar item size times the product of the dimensions, and is the same
for every element of the array.

As a concrete example, `{"dtype": "int16", "shape": [3, 2]}` encodes each
element as 3 × 2 × 2 = 12 bytes:

```
  byte:  0   1   2   3   4   5   6   7   8   9  10  11
       ├───────┼───────┼───────┼───────┼───────┼───────┤
scalar:│[0][0] │[0][1] │[1][0] │[1][1] │[2][0] │[2][1] │
       │(int16)│(int16)│(int16)│(int16)│(int16)│(int16)│
       └───────┴───────┴───────┴───────┴───────┴───────┘
```

### Endianness

The encoding of this data type is little-endian throughout: element payloads
and the base64 `fill_value` (see
[Fill value representation](#fill-value-representation)) both use
little-endian byte order, whichever `array -> bytes` codec serves the array.

Consequently, when `dtype` is a multi-byte scalar type, the `bytes` codec
MUST be configured with an explicit little-endian byte order —
`{"name": "bytes", "configuration": {"endian": "little"}}`. `"endian": "big"`
MUST NOT be used with this data type; implementations MUST report an error
rather than write chunk scalars in a byte order that disagrees with the fill
value. When `dtype` is a single-byte type (`bool`, `int8`, `uint8`) there is
no byte-order ambiguity and the `endian` configuration MAY be omitted.

## Fill value representation

The `fill_value` metadata member MUST be a string containing the
[base64](https://en.wikipedia.org/wiki/Base64)-encoded raw bytes of the fill
element, in little-endian byte order and C (row-major) element order — the
same scalar layout as [Bytes codec encoding](#bytes-codec-encoding). The
encoded byte length MUST correspond to exactly one shape matching the
configured pattern:

- If the pattern contains no variable dimension, the byte length MUST equal
  the element's fixed byte size. The zero-filled element is the recommended
  default fill value.
- If the pattern contains exactly one variable dimension, the byte length
  MUST be a whole multiple of the fixed-portion item size (the scalar item
  size times the product of the fixed dimensions); the variable extent is
  implied by the byte length. The empty string encodes the empty element
  (variable extent `0`), which is the recommended and default fill value.
- If the pattern contains two or more variable dimensions, a non-empty
  payload does not determine a unique shape, so the fill value MUST be the
  empty string, encoding the empty element whose variable extents are all
  `0` — the recommended and default fill value.

## Codec compatibility

The `array -> bytes` codec serving an array with this data type — placed
either directly in the array's codec chain or as the `array -> bytes` codec
within the inner codec chain of the
[`sharding_indexed`](../../codecs/sharding_indexed/README.md) codec — MUST
serve the configured shape pattern, per
[Shape patterns gate codecs](#shape-patterns-gate-codecs).
`bytes -> bytes` codecs (for example, `gzip`, `zstd`, `blosc`) MAY be applied
on top for compression. `array -> array` codecs (for example, `transpose`)
act on the dimensions of the array itself and are agnostic to the element
data type, so they MAY precede the `array -> bytes` codec; they do not change
the element shape pattern, and therefore do not change which
`array -> bytes` codecs may serve the array.

The following mapping of shape-pattern families to compatible
`array -> bytes` codecs is non-normative:

| shape pattern | codec | status |
| - | - | - |
| exactly one variable dimension, in the leading position (`[null, d1, ..., dk]`, `k >= 0`) | [`vlen-ndarray`](../../codecs/vlen-ndarray/README.md) | registered |
| no variable dimension (`[d1, ..., dk]`) | [`bytes`](../../codecs/bytes/README.md) | core |
| exactly one variable dimension, not in the leading position | header-free codecs | not registered |
| two or more variable dimensions | per-element shape-headered codecs | not registered |

- Fixed-shape elements have a fixed byte size, so the core `bytes` codec
  suffices and no new codec is needed. The fixed-size list data type proposed
  in [zarr-extensions#62](https://github.com/zarr-developers/zarr-extensions/pull/62)
  is an adjacent design for this fixed-shape case.
- Any pattern with exactly one variable dimension is length-inferable
  regardless of that dimension's position: the extent is the encoded byte
  length divided by the byte size of the fixed portion, so no per-element
  shape header is needed. The registered `vlen-ndarray` codec nonetheless
  restricts itself to the leading position by design (see its
  [registration](../../codecs/vlen-ndarray/README.md)); a codec for a single
  non-leading variable dimension would use the same header-free layout and
  could be registered separately.
- Patterns with two or more variable dimensions do require each encoded
  element to carry a shape header: a `[shape] + [elements]` layout suffices
  because the pattern fixes the dimensionality, and a
  `dimensionality + [shape] + [elements]` layout is the fully general form.
  No such codec is registered here; because the shape grammar is general,
  either can be registered later without revising this data type.

## Notes on interoperability and compatibility

- When the [`vlen-ndarray`](../../codecs/vlen-ndarray/README.md) codec is
  used (shape pattern `[null, d1, ..., dk]`), the encoded chunk
  representation is byte-identical to the [`bytes`](../bytes/README.md) data
  type with the [`vlen-bytes`](../../codecs/vlen-bytes/README.md) codec,
  where each element is the raw little-endian bytes of the element array in
  C (row-major) order. Implementations without `ndarray` support can
  therefore fall back to reading such arrays as `bytes` + `vlen-bytes` after
  a metadata substitution, and existing `bytes`-typed stores following this
  convention can be upgraded by rewriting metadata only.
- A reference implementation is provided by the
  [`zarr-vlen-ndarray`](https://github.com/espg/zarr-vlen-ndarray) Python
  package (registered with zarr-python on import, and declaring the
  `zarr.data_type` / `zarr.codecs` entry points).
- This data type serves the `zagg-ragged/2` store revision of the
  [zagg](https://github.com/englacial/zagg) aggregation pipeline; the `/1`
  revision is the `bytes`-typed convention described above.

## Change log

No changes yet.

## Current maintainers

* [Shane Grigsby](https://github.com/espg)
