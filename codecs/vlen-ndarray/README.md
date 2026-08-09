# Vlen-ndarray codec

Defines an `array -> bytes` codec that serializes arrays of variable-length
n-dimensional array elements, as described by the
[`vlen-ndarray`](../../data-types/vlen-ndarray/README.md) data type.

## Codec name

The value of the `name` member in the codec object MUST be `vlen-ndarray`.

## Configuration parameters

None. The element scalar data type and inner shape come from the array's
`vlen-ndarray` data type configuration.

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
        "name": "vlen-ndarray",
        "configuration": {"dtype": "float32", "inner_shape": [2]}
    },
    "codecs": [{
        "name": "vlen-ndarray"
    }]
}
```

## Format and algorithm

This is an `array -> bytes` codec.

This codec is only compatible with the
[`"vlen-ndarray"`](../../data-types/vlen-ndarray/README.md) data type.

Each element of shape `(n, *inner_shape)` is serialized to its raw bytes in
little-endian byte order and C (row-major) element order; the element of
`n = 0` serializes to zero bytes. The resulting variable-length byte strings
are then framed exactly as in the [`vlen-bytes`](../vlen-bytes/README.md)
codec: the encoded chunk is prefixed with a 32-bit little-endian unsigned
integer (u32le) giving the number of elements in the chunk, followed by a
sequence of encoded elements in lexicographical order, each encoded by a
u32le byte count followed by the bytes themselves.

Consequently, for any chunk, the encoded representation is byte-identical to
encoding the per-element raw bytes with the `vlen-bytes` codec. On decode,
each element's item count `n` is recovered from its byte length, which MUST
be a whole multiple of the element item size; decoders MUST report an error
otherwise. The u32le element count MUST equal the product of the chunk shape;
decoders MUST report an error otherwise.

Both counts in the framing are unsigned 32-bit integers, which bounds what
this codec can represent: a chunk MUST NOT contain more than `2^32 - 1`
elements, and an element's serialized payload MUST NOT exceed `2^32 - 1`
bytes — equivalently, `n` MUST NOT exceed `floor((2^32 - 1) / item_size)`,
where `item_size` is the size in bytes of one `(1, *inner_shape)` item.
Encoders MUST report an error rather than truncate or overflow either count.

See https://numcodecs.readthedocs.io/en/stable/other/vlen.html#vlenbytes for
details about the framing.

## Implementation

A reference implementation is provided by the
[`zarr-vlen-ndarray`](https://github.com/espg/zarr-vlen-ndarray) Python
package (registered with zarr-python via entry points).

## Change log

No changes yet.

## Current maintainers

* [Shane Grigsby](https://github.com/espg)
