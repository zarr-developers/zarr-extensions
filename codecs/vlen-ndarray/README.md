# Vlen-ndarray codec

Defines an `array -> bytes` codec that serializes elements of the
[`ndarray`](../../data-types/ndarray/README.md) data type whose shape pattern
has exactly one variable dimension, in the leading position — i.e. elements
of shape `(n, d1, ..., dk)` with `n` varying per element and the trailing
dimensions fixed by the data type configuration.

## Codec name

The value of the `name` member in the codec object MUST be `vlen-ndarray`.

## Configuration parameters

None. The element scalar data type and shape pattern come from the array's
`ndarray` data type configuration.

Because this codec takes no configuration, the `configuration` member MAY be
omitted; if it is present it MUST be an empty object. As for any extension
that requires no configuration metadata, the short-hand form — the bare
string `"vlen-ndarray"` in place of the codec object — MAY also be used.
Writers that require backwards compatibility with Zarr v3.0 SHOULD use the
object form, since the short-hand name form in `codecs` is not available to
v3.0 implementations.

## Example

For example, the array metadata below specifies that the array contains
variable-length `(n, 2)` float32 elements:

```json
{
  "data_type": {
    "name": "ndarray",
    "configuration": { "dtype": "float32", "shape": [null, 2] }
  },
  "codecs": [
    {
      "name": "vlen-ndarray"
    }
  ]
}
```

## Format and algorithm

This is an `array -> bytes` codec.

This codec is only compatible with the
[`ndarray`](../../data-types/ndarray/README.md) data type, and only when the
configured shape pattern contains exactly one variable dimension, in the
leading position: `[null, d1, ..., dk]` with `k >= 0` fixed trailing
dimensions. Implementations MUST report an error when this codec is paired
with any other data type or with any other shape pattern.

Each element of shape `(n, d1, ..., dk)` is serialized to its raw bytes in
little-endian byte order and C (row-major) element order; the element of
`n = 0` serializes to zero bytes. The resulting variable-length byte strings
are then framed exactly as in the [`vlen-bytes`](../vlen-bytes/README.md)
codec: the encoded chunk is prefixed with a 32-bit little-endian unsigned
integer (u32le) giving the number of elements in the chunk, followed by a
sequence of encoded elements in lexicographical order, each encoded by a
u32le byte count followed by the bytes themselves.

Consequently, for any chunk, the encoded representation is byte-identical to
encoding the per-element raw bytes with the `vlen-bytes` codec. This byte
identity is a design goal: existing stores holding raw little-endian element
bytes as `bytes` + `vlen-bytes` upgrade to the typed form with a
metadata-only rewrite.

On decode, each element's leading extent is recovered from its payload length
by the inference rule

```
n = payload_bytes / (itemsize × (d1 × ... × dk))
```

where `itemsize` is the byte size of one `dtype` scalar and the trailing
product is `1` when `k = 0`. A pattern with exactly one variable dimension is
length-inferable no matter where that dimension sits, so no per-element shape
header is needed. This codec further restricts the variable dimension to the
leading position so that growing an element appends bytes to its payload,
which is what preserves the byte identity with existing `bytes` +
`vlen-bytes` stores described above. A codec serving a single *non-leading*
variable dimension
would use the same header-free layout and could be registered separately;
only patterns with two or more variable dimensions genuinely require a
per-element shape header.

An element's payload length MUST be a whole multiple of the item size
`itemsize × (d1 × ... × dk)`; decoders MUST report an error otherwise. The
u32le element count MUST equal the product of the shape of the chunk this
codec encodes — the inner chunk when this codec is nested inside
[`sharding_indexed`](../sharding_indexed/README.md); decoders MUST report an
error otherwise.

Both counts in the framing are unsigned 32-bit integers, which bounds what
this codec can represent: a chunk MUST NOT contain more than `2^32 - 1`
elements, and an element's serialized payload MUST NOT exceed `2^32 - 1`
bytes — equivalently, `n` MUST NOT exceed `floor((2^32 - 1) / item_size)`,
where `item_size` is the size in bytes of one `(1, d1, ..., dk)` item.
Encoders MUST report an error rather than truncate or overflow either count.

See https://numcodecs.readthedocs.io/en/stable/other/vlen.html#vlenbytes for
details about the framing.

## Implementation

A reference implementation is provided by the
[`zarr-vlen-ndarray`](https://github.com/espg/zarr-vlen-ndarray) Python
package (registered with zarr-python on import, and declaring the
`zarr.data_type` / `zarr.codecs` entry points).

## Change log

No changes yet.

## Current maintainers

* [Shane Grigsby](https://github.com/espg)
