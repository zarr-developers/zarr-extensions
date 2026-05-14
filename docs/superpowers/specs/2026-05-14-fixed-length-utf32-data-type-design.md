# Design: `fixed_length_utf32` data type specification

## Goal

Add a Zarr V3 extension specification for the `fixed_length_utf32` data type to
the `zarr-extensions` repository, under `data-types/fixed_length_utf32/`. The
data type represents arrays whose elements are fixed-length UTF-32 strings, as
implemented by zarr-python's `FixedLengthUTF32` class.

## Motivation

This data type exists primarily for **NumPy compatibility**. NumPy's fixed-width
string dtype (`numpy.str_`, spelled `<U` / `>U`) stores each array element as a
fixed number of 4-byte UTF-32 code units, zero-padding strings shorter than the
declared width. The `fixed_length_utf32` data type is the Zarr V3 representation
of exactly this NumPy dtype.

Because the NumPy `<U` dtype is also the native string dtype used throughout
**Zarr V2**, specifying `fixed_length_utf32` gives Zarr V3 a well-defined,
interoperable home for string data originating from Zarr V2 arrays. zarr-python
maps the Zarr V2 dtype name (e.g. `"<U12"`) to and from the V3
`fixed_length_utf32` representation, so a single specification covers both the
NumPy round-trip and the V2-to-V3 migration path.

This is distinct from the variable-length `string` data type, which has no fixed
per-element size and is not NumPy-fixed-width compatible.

## Source of truth

zarr-python's `FixedLengthUTF32` class (`src/zarr/core/dtype/npy/string.py`):

- Zarr V3 name: `fixed_length_utf32`.
- Configuration: `{"length_bytes": length * 4}` where `length` is the number of
  code points and `4` is the UTF-32 bytes-per-code-point. `length` MUST be >= 1,
  so `length_bytes` is always a positive multiple of 4, minimum 4.
- Zarr V2 representation: `{"name": "<U<n>", "object_codec_id": null}`.
- Endianness: the dtype carries endianness via the `HasEndianness` mixin, but the
  V3 JSON configuration stores only `length_bytes`; byte order is delegated to
  the array-to-bytes codec.
- Fill value: a JSON string. (zarr-python uses an empty-string scalar as its
  in-memory default, but "default fill value" is not part of the Zarr data type
  model, so the spec does not describe one.)
- Not an object-codec dtype — it does not use a variable-length codec. Each
  scalar is a fixed-size `length_bytes` blob, encoded by the `bytes` codec.
- Emits `v3_unstable_dtype_warning`, i.e. it is explicitly an extension dtype,
  which is why it belongs in `zarr-extensions`.

## Files

- `data-types/fixed_length_utf32/README.md` — prose specification.
- `data-types/fixed_length_utf32/schema.json` — JSON Schema for the data type
  metadata, following the pattern of the sibling `string`, `bytes`, and `struct`
  specs.

## README.md structure

1. **Title + intro** — "Fixed-length UTF-32 string data type." Each element is a
   string of a fixed maximum number of Unicode code points, encoded as UTF-32
   code units.

2. **Background / motivation** — models NumPy's fixed-width `str` dtype
   (`<U` / `>U`); NumPy stores a fixed number of 4-byte UTF-32 code units per
   element, zero-padding shorter strings. State explicitly that this type exists
   for NumPy compatibility and thereby compatibility with Zarr V2 string data.
   Contrast with the variable-length `string` data type.

3. **Data type representation**
   - **Name:** the string `"fixed_length_utf32"`.
   - **Configuration:** required object with one key, `"length_bytes"` — a
     positive integer that is a multiple of 4, the fixed encoded size of each
     scalar in bytes. The number of code points per scalar is `length_bytes / 4`.
     `length_bytes` MUST be >= 4.
   - Example array metadata fragment.

4. **Bytes codec encoding** — when the `bytes` codec is used, each scalar
   encodes exactly `length_bytes / 4` code points; each code point is a 4-byte
   UTF-32 code unit. Strings shorter than capacity are padded with `U+0000`
   (`0x00000000`) code points after the content. Include an ASCII byte-diagram
   (struct-spec style) for a worked example, e.g. a 3-code-point-capacity scalar
   holding `"Hi"`. Section heading matches the `struct` spec, framing this as
   codec encoding rather than an intrinsic codec-independent layout.

5. **Endianness** — the byte order of the 4-byte code units is determined by the
   `bytes` codec's `endian` parameter, which MUST be set explicitly. The data
   type configuration itself carries no endianness.

6. **JSON scalar encoding** — define how a scalar of this data type is encoded
   in/decoded from JSON: a JSON string of at most `length_bytes / 4` code
   points, with trailing `U+0000` padding stripped on encode and re-added on
   decode. Strings exceeding capacity are rejected. Worked example.

7. **Fill value representation** — defined by reference: the `fill_value` MUST
   be a valid JSON scalar encoding (per the section above). This frames the
   fill value as one application of the general JSON scalar encoding rather
   than a separately-specified format. Does not describe a "default" fill
   value — that is not part of the Zarr data type model.

8. **Codec compatibility** — works with any array-to-bytes codec that encodes
   each element as a fixed-size `length_bytes` blob; the `bytes` codec is the
   standard choice. Variable-length codecs (`vlen-utf8`, `vlen-bytes`) are NOT
   compatible. Byte-manipulation / compression codecs may be layered on top.

9. **Notes** — `length_bytes` is always a multiple of 4; `U+0000` padding matches
   NumPy semantics; distinct from the variable-length `string` type; relationship
   to the Zarr V2 `<U` dtype name.

10. **References** — links to the Unicode Standard (the normative UTF-32
    definition) and the NumPy `numpy.str_` / dtype-objects documentation that
    this data type mirrors.

11. **Change log** — "No changes yet."

12. **Current maintainers** — zarr-python core development team (matching sibling
    specs).

## schema.json structure

Configuration is **required** for this data type (unlike `string`, which permits
a bare-string form), so the schema accepts only the object form:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": { "const": "fixed_length_utf32" },
    "configuration": {
      "type": "object",
      "properties": {
        "length_bytes": {
          "type": "integer",
          "minimum": 4,
          "multipleOf": 4
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

- **`length_bytes` validation:** schema enforces `minimum: 4` and
  `multipleOf: 4`; prose explains the 4-bytes-per-code-point rationale.
- **Endianness:** delegated to the `bytes` codec's `endian` parameter, mirroring
  zarr-python and the `struct` spec; not part of the data type configuration.
- **Fill value length:** MUST NOT exceed `length_bytes / 4` code points; shorter
  strings are padded with `U+0000`. Longer strings are rejected. The spec does
  not describe a "default" fill value — defaults are not part of the Zarr data
  type model.
- **Byte layout:** the spec includes an explicit encoding description with an
  ASCII byte-diagram, under a "Bytes codec encoding" heading (matching the
  `struct` spec) to frame it as codec behavior rather than a codec-independent
  intrinsic layout.
