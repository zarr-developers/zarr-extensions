# Design: `null_terminated_bytes` data type specification

## Goal

Add a Zarr V3 extension specification for the `null_terminated_bytes` data type
to the `zarr-extensions` repository, under `data-types/null_terminated_bytes/`.
The data type represents arrays whose elements are fixed-length, null-terminated
byte strings, as implemented by zarr-python's `NullTerminatedBytes` class.

This spec parallels the `fixed_length_utf32` spec (the NumPy `U` dtype); this
one covers the NumPy `S` dtype.

## Motivation

This data type exists primarily for **NumPy compatibility**. NumPy's fixed-width
bytes dtype (`numpy.bytes_`, spelled `|S<n>`) stores each array element as a
fixed number of bytes, zero-padding byte strings shorter than the declared
width and treating a trailing run of zero bytes as padding (null-termination).
The `null_terminated_bytes` data type is the Zarr V3 representation of exactly
this NumPy dtype.

The NumPy `S` dtype is also the native fixed-width bytes dtype used by
**Zarr V2**, so specifying `null_terminated_bytes` gives Zarr V3 a well-defined,
interoperable home for fixed-width byte-string data originating from Zarr V2
arrays. zarr-python maps the Zarr V2 dtype name (e.g. `"|S10"`) to and from the
V3 `null_terminated_bytes` representation.

This is distinct from the variable-length `bytes` data type, which has no fixed
per-element size.

## Source of truth

zarr-python's `NullTerminatedBytes` class (`src/zarr/core/dtype/npy/bytes.py`):

- Zarr V3 name: `null_terminated_bytes`.
- Configuration: `{"length_bytes": length}` where `length` is the fixed number
  of bytes per element. `length` MUST be >= 1.
- Zarr V2 representation: `{"name": "|S<n>", "object_codec_id": null}`; the V2
  parser accepts dtype strings matching `^\|S\d+$`.
- Null-termination: indexing a NumPy array of this dtype may return fewer than
  `length` bytes, because a trailing run of zero bytes is treated as padding.
  Trailing zero bytes are therefore not recoverable. zarr-python's own docstring
  notes this type is best suited for NumPy compatibility.
- JSON scalar encoding: the bytes are base64-encoded (standard base64) to a
  string; decoding reverses this.
- Default in-memory scalar is the empty byte string `b""`. ("Default fill value"
  is not part of the Zarr data type model, so the spec does not describe one.)
- Each scalar is a fixed-size `length_bytes` blob, encoded by the `bytes` codec.
- Emits an unstable-dtype warning, i.e. it is explicitly an extension dtype.

## Files

- `data-types/null_terminated_bytes/README.md` — prose specification.
- `data-types/null_terminated_bytes/schema.json` — JSON Schema for the data type
  metadata, following the pattern of the sibling `string`, `bytes`, `struct`,
  and `fixed_length_utf32` specs.

## Differences from the `fixed_length_utf32` spec

| Aspect | `fixed_length_utf32` (`U`) | `null_terminated_bytes` (`S`) |
| - | - | - |
| `length_bytes` semantics | code points x 4 | raw byte count (no multiplier) |
| `length_bytes` constraint | multiple of 4, min 4 | positive integer, min 1 |
| Element content | Unicode code points | raw bytes |
| Short-value handling | `U+0000` code point padding | `0x00` byte padding; trailing nulls stripped on read (null-termination) |
| JSON scalar encoding | JSON string | base64-encoded string |
| Endianness | byte order matters; delegated to codec | not applicable (single bytes) |

## README.md structure

1. **Title + intro** — "Null-terminated bytes data type." Each element is a
   fixed-length, null-terminated byte string.

2. **Background / motivation** — models NumPy's `S` dtype (`numpy.bytes_`,
   `|S<n>`); NumPy stores a fixed number of bytes per element, zero-padding
   shorter byte strings and treating trailing zero bytes as padding. State
   explicitly that this type exists for NumPy compatibility and thereby
   compatibility with Zarr V2 byte-string data. Contrast with the
   variable-length `bytes` data type. Note the null-termination caveat: trailing
   zero bytes are not recoverable.

3. **Data type representation** — tabular, following the `rectilinear` chunk
   grid and `fixed_length_utf32` specs. A table for the top-level metadata
   fields (`name`, `configuration`) with an internal link from `configuration`
   to a `### Configuration` subsection, which has its own field table for
   `length_bytes` linking to a `#### length_bytes` subsection.
   - **Name:** the string `"null_terminated_bytes"`.
   - **Configuration:** required object with one key, `"length_bytes"` — a
     positive integer (>= 1), the fixed encoded size of each scalar in bytes.
   - State that the JSON object is the value of the `data_type` metadata key.
   - Example array metadata fragment.

4. **Bytes codec encoding** — when the `bytes` codec is used, each scalar is
   encoded as exactly `length_bytes` bytes. The byte string content is written
   in order; if it is shorter than `length_bytes`, the remaining bytes are
   `0x00`. On decoding, a trailing run of `0x00` bytes is stripped
   (null-termination), so trailing zero bytes of the original value are not
   recoverable. Include an ASCII byte-diagram for a worked example, e.g.
   `length_bytes` 5 holding `b"Hi"`.

5. **Endianness** — a short note: byte strings are sequences of single bytes and
   have no byte order, so no `endian` configuration is relevant to this data
   type. (Kept as a brief section for parity with `fixed_length_utf32`, stating
   the non-applicability explicitly.)

6. **JSON scalar encoding** — a scalar is encoded in JSON as a base64-encoded
   string of its bytes, with any trailing `0x00` padding bytes removed before
   encoding. A base64 string is a valid encoding only if it decodes to at most
   `length_bytes` bytes; decoding a string that yields more than `length_bytes`
   bytes is invalid and MUST be rejected. A string decoding to fewer than
   `length_bytes` bytes decodes to the scalar whose remaining bytes are `0x00`
   padding. Worked example.

7. **Fill value representation** — defined by reference: the `fill_value` MUST
   be a valid JSON scalar encoding (per the section above) — a base64 string
   decoding to at most `length_bytes` bytes. Does not describe a "default" fill
   value.

8. **Codec compatibility** — works with any array-to-bytes codec that encodes
   each element as a fixed-size `length_bytes` blob; the `bytes` codec is the
   standard choice. Variable-length codecs (`vlen-utf8`, `vlen-bytes`) are NOT
   compatible. Byte-manipulation / compression codecs may be layered on top.

9. **Notes** — null-termination caveat (trailing zero bytes are lost on a
   round trip); distinct from the variable-length `bytes` type.

10. **References** — links to the NumPy `numpy.bytes_` scalar documentation and
    the NumPy data type objects documentation that this data type mirrors.

11. **Change log** — "No changes yet."

12. **Current maintainers** — zarr-python core development team (matching sibling
    specs).

## schema.json structure

Configuration is **required** for this data type, so the schema accepts only the
object form (no bare-string form):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": { "const": "null_terminated_bytes" },
    "configuration": {
      "type": "object",
      "properties": {
        "length_bytes": {
          "type": "integer",
          "minimum": 1
        }
      },
      "required": ["length_bytes"],
      "additionalProperties": false
    }
  },
  "required": ["name", "configuration"],
  "additionalProperties": false
}
```

## Decisions

- **`length_bytes` validation:** schema enforces `minimum: 1`; it is a raw byte
  count with no multiple-of constraint (unlike `fixed_length_utf32`).
- **JSON scalar encoding:** base64 string only, matching zarr-python's
  `NullTerminatedBytes`. The integer-array form permitted by the
  variable-length `bytes` spec is intentionally not adopted, to stay aligned
  with the implementation. The empty string `""` is explicitly called out as a
  valid encoding (valid base64 decoding to zero bytes, denoting the empty byte
  string — zarr-python's default in-memory scalar), so implementations do not
  disagree on whether it is a legal fill value.
- **Endianness:** not applicable; the spec states this explicitly rather than
  omitting it, for parity with `fixed_length_utf32`.
- **`raw_bytes`:** intentionally not mentioned. `raw_bytes` is not yet specified
  in `zarr-extensions`; the spec contrasts only with the already-specified
  variable-length `bytes` data type.
- **Fill value:** defined as one application of the JSON scalar encoding; no
  "default" fill value, since defaults are not part of the Zarr data type model.
- **Byte layout:** the spec includes an explicit encoding description with an
  ASCII byte-diagram, under a "Bytes codec encoding" heading (matching the
  `struct` and `fixed_length_utf32` specs).
