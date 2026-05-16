# `fixed_size_list` Data Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register a new Zarr v3 data type extension named `fixed_size_list` — a fixed-length, positional, homogeneous sequence of a single base data type, modeled after Apache Arrow's `FixedSizeList`.

**Architecture:** This is a documentation-only deliverable in the `zarr-extensions` registry. Two files are added under `data-types/fixed_size_list/`: a `README.md` specifying the data type (representation, configuration, bytes-codec encoding, JSON scalar encoding, fill value, codec compatibility) and a `schema.json` providing a JSON Schema for validating the `data_type` metadata block. The structure and tone follow existing extensions, especially [`struct`](../../../data-types/struct/README.md) (closest analog — wraps inner data types) and [`fixed_length_utf32`](../../../data-types/fixed_length_utf32/README.md) (similar single-parameter shape).

**Tech Stack:** Markdown, JSON Schema (draft 2020-12), `npx prettier` for JSON formatting (per repository convention in [README.md](../../../README.md)).

**Spec:** [docs/superpowers/specs/2026-05-16-fixed-size-list-data-type-design.md](../specs/2026-05-16-fixed-size-list-data-type-design.md)

---

## File Structure

Files created or modified by this plan:

- **Create** `data-types/fixed_size_list/README.md` — the specification document for the data type. One responsibility: human-readable normative specification.
- **Create** `data-types/fixed_size_list/schema.json` — JSON Schema for validating the `data_type` metadata block. One responsibility: machine-checkable structural validation.

No other files are modified. The repository has no central index of data types — each extension is self-contained in its directory.

---

## Task 1: Create the `schema.json`

Build the schema first so it can be referenced from the README and used to validate example metadata blocks as they are drafted.

**Files:**
- Create: `data-types/fixed_size_list/schema.json`

- [ ] **Step 1: Create the schema file**

Write the file with the following exact contents:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "fixed_size_list",
  "$defs": {
    "dtype": {
      "oneOf": [
        {
          "type": "string",
          "minLength": 1
        },
        {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "minLength": 1
            },
            "configuration": {
              "type": "object"
            }
          },
          "required": ["name", "configuration"],
          "additionalProperties": false
        }
      ]
    }
  },
  "type": "object",
  "properties": {
    "name": {
      "const": "fixed_size_list"
    },
    "configuration": {
      "type": "object",
      "properties": {
        "base_data_type": {
          "$ref": "#/$defs/dtype"
        },
        "list_size": {
          "type": "integer",
          "minimum": 1
        }
      },
      "required": ["base_data_type", "list_size"],
      "additionalProperties": false
    }
  },
  "required": ["name", "configuration"],
  "additionalProperties": false
}
```

Notes:
- The `$defs/dtype` block is copied verbatim from [data-types/struct/schema.json](../../../data-types/struct/schema.json). Both extensions need to accept either a string (for core data types like `"float32"`) or an object (for parametrized extension data types like `numpy.datetime64`) as the inner data type.
- `list_size` uses `"minimum": 1` to enforce "integer greater than or equal to 1" from the spec. No `maximum`.
- `additionalProperties: false` at every level matches the repository convention seen in `struct/schema.json` and `fixed_length_utf32/schema.json`.

- [ ] **Step 2: Format with prettier**

The repository convention in [README.md](../../../README.md) requires JSON schemas to be formatted with prettier. Run from the repository root:

```bash
npx prettier -w data-types/fixed_size_list/schema.json
```

Expected: prettier reports the file as written (or formatted). No errors.

- [ ] **Step 3: Validate the schema is itself valid JSON Schema**

Run from the repository root:

```bash
python3 -c "import json, jsonschema; jsonschema.Draft202012Validator.check_schema(json.load(open('data-types/fixed_size_list/schema.json')))"
```

Expected: exits 0 with no output. (If `jsonschema` is not installed, `pip install jsonschema` first.)

- [ ] **Step 4: Validate positive example — minimal core base type**

Create a temporary file and run validation:

```bash
cat > /tmp/fsl_valid_1.json <<'EOF'
{
  "name": "fixed_size_list",
  "configuration": {
    "base_data_type": "float32",
    "list_size": 3
  }
}
EOF
python3 -c "import json, jsonschema; jsonschema.validate(json.load(open('/tmp/fsl_valid_1.json')), json.load(open('data-types/fixed_size_list/schema.json')))"
```

Expected: exits 0 with no output.

- [ ] **Step 5: Validate positive example — parametrized object base type**

```bash
cat > /tmp/fsl_valid_2.json <<'EOF'
{
  "name": "fixed_size_list",
  "configuration": {
    "base_data_type": {
      "name": "numpy.datetime64",
      "configuration": {"unit": "s", "scale_factor": 1}
    },
    "list_size": 4
  }
}
EOF
python3 -c "import json, jsonschema; jsonschema.validate(json.load(open('/tmp/fsl_valid_2.json')), json.load(open('data-types/fixed_size_list/schema.json')))"
```

Expected: exits 0 with no output.

- [ ] **Step 6: Validate positive example — recursive nesting (struct inside fixed_size_list)**

```bash
cat > /tmp/fsl_valid_3.json <<'EOF'
{
  "name": "fixed_size_list",
  "configuration": {
    "base_data_type": {
      "name": "struct",
      "configuration": {
        "fields": [
          {"name": "x", "data_type": "float32"},
          {"name": "y", "data_type": "float32"}
        ]
      }
    },
    "list_size": 16
  }
}
EOF
python3 -c "import json, jsonschema; jsonschema.validate(json.load(open('/tmp/fsl_valid_3.json')), json.load(open('data-types/fixed_size_list/schema.json')))"
```

Expected: exits 0 with no output.

- [ ] **Step 7: Validate negative example — `list_size = 0` is rejected**

```bash
cat > /tmp/fsl_invalid_size.json <<'EOF'
{
  "name": "fixed_size_list",
  "configuration": {
    "base_data_type": "float32",
    "list_size": 0
  }
}
EOF
python3 -c "
import json, jsonschema, sys
try:
    jsonschema.validate(json.load(open('/tmp/fsl_invalid_size.json')), json.load(open('data-types/fixed_size_list/schema.json')))
    print('UNEXPECTED PASS'); sys.exit(1)
except jsonschema.ValidationError as e:
    print('OK, rejected as expected:', e.message)
"
```

Expected: prints `OK, rejected as expected:` followed by a message mentioning `0` is less than the minimum of `1`. Exits 0.

- [ ] **Step 8: Validate negative example — missing `list_size`**

```bash
cat > /tmp/fsl_missing_size.json <<'EOF'
{
  "name": "fixed_size_list",
  "configuration": {
    "base_data_type": "float32"
  }
}
EOF
python3 -c "
import json, jsonschema, sys
try:
    jsonschema.validate(json.load(open('/tmp/fsl_missing_size.json')), json.load(open('data-types/fixed_size_list/schema.json')))
    print('UNEXPECTED PASS'); sys.exit(1)
except jsonschema.ValidationError as e:
    print('OK, rejected as expected:', e.message)
"
```

Expected: prints `OK, rejected as expected:` followed by a message mentioning `list_size` is a required property. Exits 0.

- [ ] **Step 9: Validate negative example — wrong `name`**

```bash
cat > /tmp/fsl_wrong_name.json <<'EOF'
{
  "name": "FixedSizeList",
  "configuration": {
    "base_data_type": "float32",
    "list_size": 3
  }
}
EOF
python3 -c "
import json, jsonschema, sys
try:
    jsonschema.validate(json.load(open('/tmp/fsl_wrong_name.json')), json.load(open('data-types/fixed_size_list/schema.json')))
    print('UNEXPECTED PASS'); sys.exit(1)
except jsonschema.ValidationError as e:
    print('OK, rejected as expected:', e.message)
"
```

Expected: prints `OK, rejected as expected:` mentioning the `const` mismatch for `name`. Exits 0.

- [ ] **Step 10: Validate negative example — `additionalProperties` rejected**

```bash
cat > /tmp/fsl_extra.json <<'EOF'
{
  "name": "fixed_size_list",
  "configuration": {
    "base_data_type": "float32",
    "list_size": 3,
    "extra": "nope"
  }
}
EOF
python3 -c "
import json, jsonschema, sys
try:
    jsonschema.validate(json.load(open('/tmp/fsl_extra.json')), json.load(open('data-types/fixed_size_list/schema.json')))
    print('UNEXPECTED PASS'); sys.exit(1)
except jsonschema.ValidationError as e:
    print('OK, rejected as expected:', e.message)
"
```

Expected: prints `OK, rejected as expected:` mentioning that `extra` is not allowed (additionalProperties). Exits 0.

- [ ] **Step 11: Clean up temp files**

```bash
rm -f /tmp/fsl_valid_1.json /tmp/fsl_valid_2.json /tmp/fsl_valid_3.json /tmp/fsl_invalid_size.json /tmp/fsl_missing_size.json /tmp/fsl_wrong_name.json /tmp/fsl_extra.json
```

Expected: exits 0.

- [ ] **Step 12: Commit**

```bash
git add data-types/fixed_size_list/schema.json
git commit -m "$(cat <<'EOF'
Add fixed_size_list JSON schema

Schema for the new fixed_size_list data type extension, validating
base_data_type (string or object) and list_size (integer >= 1).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 2: Create the `README.md`

Write the specification document. The structure mirrors [data-types/struct/README.md](../../../data-types/struct/README.md) and [data-types/fixed_length_utf32/README.md](../../../data-types/fixed_length_utf32/README.md). Sections are ordered to match: title, intro, Background, Data type representation, Bytes codec encoding, JSON scalar encoding, Fill value representation, Codec compatibility, Notes, References, Change log, Current maintainers.

**Files:**
- Create: `data-types/fixed_size_list/README.md`

- [ ] **Step 1: Create the README with the exact content below**

```markdown
# `fixed_size_list` data type

Defines a data type for fixed-length, positional sequences of a single inner
("base") data type. Each scalar of a `fixed_size_list` array is a tuple of
exactly `list_size` values, all of the same `base_data_type`.

## Background

`fixed_size_list` models Apache Arrow's
[`FixedSizeList`](https://arrow.apache.org/docs/format/Columnar.html#fixed-size-list-layout)
layout. It is the homogeneous, positional counterpart to the
[`struct`](../struct/README.md) data type: where `struct` describes a
heterogeneous record with named fields, `fixed_size_list` describes a
homogeneous tuple with positional elements.

Typical use cases include RGB(A) pixels, fixed-length feature embeddings,
small mathematical vectors, and quaternions — anywhere each array element
is naturally an N-tuple of values of the same type, and N is known in
advance.

Compared to adding an extra trailing dimension to the outer Zarr array,
`fixed_size_list` keeps the per-scalar tuple structure inside the scalar:
the outer array's shape, chunk grid, and indexing describe only the
user-facing element count, while the tuple-of-N structure is part of the
data type itself.

## Data type representation

A `fixed_size_list` data type is represented in array metadata as the
value of the `data_type` metadata key. The value MUST be a JSON object with
the following fields:

| field | type | required |
| - | - | - |
| `name` | Literal `"fixed_size_list"` | yes |
| `configuration` | [Configuration](#configuration) | yes |

### Configuration

The `configuration` field is a JSON object with the following fields:

| field | type | required | notes |
| - | - | - | - |
| `base_data_type` | A Zarr v3 data type representation: a string for core data types, or an object with `name` and `configuration` for parametrized extension data types | yes | The data type of each element of the list. MUST be a data type whose encoded size in bytes is fixed and known at the time the array is opened. Variable-length data types (e.g. [`string`](../string/README.md)) MUST NOT be used. See [`base_data_type`](#base_data_type). |
| `list_size` | integer ≥ 1 | yes | The number of `base_data_type` scalars contained in each `fixed_size_list` scalar. See [`list_size`](#list_size). |

#### `base_data_type`

`base_data_type` is the data type of every element of the list. It MUST be
a valid Zarr v3 data type representation whose size in bytes is fixed and
known:

- For [core data types](https://zarr-specs.readthedocs.io/en/latest/v3/data-types/index.html#core-data-types),
  this MUST be a string (e.g. `"float32"`, `"int32"`, `"uint8"`).
- For extension data types that require configuration (e.g.
  [`numpy.datetime64`](../numpy.datetime64/README.md)), this MUST be an
  object with a `"name"` key and a `"configuration"` key.

Variable-length data types (e.g. [`string`](../string/README.md)) MUST NOT
be used as the `base_data_type`, as they do not have a fixed encoded size.

`base_data_type` MAY itself be `fixed_size_list` or
[`struct`](../struct/README.md), enabling recursive nesting (for example,
a fixed-size list of structs, or a fixed-size list of fixed-size lists).

#### `list_size`

`list_size` is the number of `base_data_type` scalars contained in each
`fixed_size_list` scalar. It MUST be an integer greater than or equal
to `1`. The field name matches Apache Arrow's `FixedSizeList::list_size`.

The total encoded size in bytes of a `fixed_size_list` scalar is
`sizeof(base_data_type) * list_size`.

### Example

The example below shows a fragment of array metadata for an array whose
elements are 3-tuples of `float32` (for example, RGB pixels or 3D points):

```json
{
    "data_type": {
        "name": "fixed_size_list",
        "configuration": {
            "base_data_type": "float32",
            "list_size": 3
        }
    },
    "fill_value": [0.0, 0.0, 0.0],
    "codecs": [{
        "name": "bytes",
        "configuration": {"endian": "little"}
    }]
}
```

A parametrized inner type uses the object form for `base_data_type`:

```json
{
    "name": "fixed_size_list",
    "configuration": {
        "base_data_type": {
            "name": "numpy.datetime64",
            "configuration": {"unit": "s", "scale_factor": 1}
        },
        "list_size": 4
    }
}
```

A recursive example — a list of 16 2D points, each point represented as a
`struct` with `x` and `y` `float32` fields:

```json
{
    "name": "fixed_size_list",
    "configuration": {
        "base_data_type": {
            "name": "struct",
            "configuration": {
                "fields": [
                    {"name": "x", "data_type": "float32"},
                    {"name": "y", "data_type": "float32"}
                ]
            }
        },
        "list_size": 16
    }
}
```

## Bytes codec encoding

When the `bytes` codec is used, each `fixed_size_list` scalar is encoded as
the packed concatenation of `list_size` encoded `base_data_type` values, in
position order, with no padding between elements.

The total encoded size of a `fixed_size_list` scalar is
`sizeof(base_data_type) * list_size` bytes.

As a concrete example, consider a `fixed_size_list` with
`base_data_type` of `"float32"` and `list_size` of `3`. Each scalar is
encoded as 12 bytes — three contiguous IEEE 754 single-precision values in
the codec's chosen byte order:

```
 byte:  0   1   2   3   4   5   6   7   8   9  10  11
      ├───────────────┼───────────────┼───────────────┤
      │    elem[0]    │    elem[1]    │    elem[2]    │
      │   (float32)   │   (float32)   │   (float32)   │
      └───────────────┴───────────────┴───────────────┘
```

### Endianness

A `fixed_size_list` adds no endianness rules of its own. Byte-order behavior
is inherited from the `base_data_type`:

- If `base_data_type` is a multi-byte numeric type (e.g. `float32`,
  `int32`), the `bytes` codec MUST be configured with an explicit `endian`
  setting (e.g. `{"name": "bytes", "configuration": {"endian": "little"}}`),
  and every encoded element uses that byte order.
- If `base_data_type` is single-byte (e.g. `uint8`, `int8`, `bool`), the
  `endian` configuration MAY be omitted.

## JSON scalar encoding

A scalar of this data type is encoded in JSON as a JSON array of exactly
`list_size` entries. Each entry MUST be a valid JSON encoding of a scalar
of `base_data_type`, in position order.

A JSON value is a valid encoding of a `fixed_size_list` scalar only if it
is a JSON array whose length is exactly `list_size` and whose every entry
is a valid JSON encoding of `base_data_type`. JSON arrays with a different
length, or with any invalid entry, MUST be rejected.

For example, with `base_data_type` of `"float32"` and `list_size` of `3`:

```json
[1.0, 2.5, -3.0]
```

## Fill value representation

The value of the `fill_value` metadata key MUST be a valid
[JSON scalar encoding](#json-scalar-encoding) of a scalar of this data
type: a JSON array of exactly `list_size` entries, each a valid fill value
for `base_data_type`.

```json
"fill_value": [0.0, 0.0, 0.0]
```

There is no scalar-broadcast shorthand. Per-position fill values MUST be
written out explicitly. This matches the [`struct`](../struct/README.md)
requirement that every field have an explicit fill value, and avoids
ambiguity for extension base types whose "zero" or "default" value is not
well defined.

## Codec compatibility

This data type is compatible with any array-to-bytes codec that encodes
each array element as a contiguous, fixed-size binary blob of
`sizeof(base_data_type) * list_size` bytes. The
[`bytes`](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/bytes/index.html)
codec is the standard choice for this role. Byte-manipulation codecs (for
example, `gzip`, `zstd`, `blosc`) MAY be applied on top for compression.

Variable-length codecs (for example,
[`vlen-utf8`](../../codecs/vlen-utf8/README.md) and
[`vlen-bytes`](../../codecs/vlen-bytes/README.md)) are NOT compatible with
this data type, as they do not encode elements at a fixed size.

## Notes

> **Note:** `fixed_size_list` is the homogeneous, positional counterpart of
> [`struct`](../struct/README.md). A `fixed_size_list` with `list_size` of
> `N` is conceptually equivalent to a `struct` of `N` identically typed
> unnamed fields — they share the same bytes-codec encoding — but
> `fixed_size_list` is more compact in metadata and uses positional JSON
> arrays rather than named JSON objects.

> **Note:** `fixed_size_list` is distinct from adding a trailing axis to
> the outer Zarr array. A trailing axis participates in the array's shape,
> chunk grid, and indexing; `fixed_size_list` keeps the tuple structure
> inside the scalar, so the outer array's shape describes only the
> user-facing element count.

> **Note:** The `base_data_type` MUST have a fixed, known encoded size.
> Variable-length data types such as [`string`](../string/README.md) MUST
> NOT be used.

## References

- [Apache Arrow Columnar Format — Fixed-Size List Layout](https://arrow.apache.org/docs/format/Columnar.html#fixed-size-list-layout)
  — the data model and `list_size` field name are drawn from Arrow.
- [`struct`](../struct/README.md) — the heterogeneous, named-field
  counterpart to this data type.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
```

- [ ] **Step 2: Verify the file was written correctly**

Run:

```bash
ls -la data-types/fixed_size_list/
wc -l data-types/fixed_size_list/README.md
```

Expected: `README.md` and `schema.json` both present; README has roughly 180–230 lines.

- [ ] **Step 3: Validate every JSON code block in the README parses as JSON**

The README contains several JSON examples that must be syntactically valid. Run:

```bash
python3 <<'PY'
import re, json, sys, pathlib
text = pathlib.Path('data-types/fixed_size_list/README.md').read_text()
# Match fenced code blocks tagged as json.
blocks = re.findall(r'```json\n(.*?)```', text, re.DOTALL)
print(f"Found {len(blocks)} json code blocks")
errors = 0
for i, block in enumerate(blocks):
    snippet = block.strip()
    # Some blocks are key-value fragments like a fill_value entry: wrap them.
    candidates = [snippet, '{' + snippet + '}']
    parsed = False
    last_err = None
    for cand in candidates:
        try:
            json.loads(cand)
            parsed = True
            break
        except json.JSONDecodeError as e:
            last_err = e
    if not parsed:
        errors += 1
        print(f"  Block {i} FAILED: {last_err}\n----\n{snippet}\n----")
print(f"Errors: {errors}")
sys.exit(1 if errors else 0)
PY
```

Expected: prints a line like `Found 6 json code blocks` (count may vary slightly), followed by `Errors: 0`. Exits 0.

- [ ] **Step 4: Validate the metadata-block examples against `schema.json`**

The README contains three complete `name`/`configuration` example objects under "Example". These must validate against the schema written in Task 1. Run:

```bash
python3 <<'PY'
import json, jsonschema
schema = json.load(open('data-types/fixed_size_list/schema.json'))
examples = [
    {
        "name": "fixed_size_list",
        "configuration": {"base_data_type": "float32", "list_size": 3}
    },
    {
        "name": "fixed_size_list",
        "configuration": {
            "base_data_type": {
                "name": "numpy.datetime64",
                "configuration": {"unit": "s", "scale_factor": 1}
            },
            "list_size": 4
        }
    },
    {
        "name": "fixed_size_list",
        "configuration": {
            "base_data_type": {
                "name": "struct",
                "configuration": {
                    "fields": [
                        {"name": "x", "data_type": "float32"},
                        {"name": "y", "data_type": "float32"}
                    ]
                }
            },
            "list_size": 16
        }
    },
]
for i, ex in enumerate(examples):
    jsonschema.validate(ex, schema)
    print(f"example {i}: OK")
PY
```

Expected: prints `example 0: OK`, `example 1: OK`, `example 2: OK`. Exits 0.

- [ ] **Step 5: Verify cross-reference paths resolve to real files**

The README contains relative links to neighboring extensions. Check they exist:

```bash
for p in \
  data-types/struct/README.md \
  data-types/fixed_size_list/../struct/README.md \
  data-types/fixed_size_list/../string/README.md \
  data-types/fixed_size_list/../numpy.datetime64/README.md \
  data-types/fixed_size_list/../../codecs/vlen-utf8/README.md \
  data-types/fixed_size_list/../../codecs/vlen-bytes/README.md; do
  if [ -f "$p" ]; then echo "OK   $p"; else echo "MISS $p"; fi
done
```

Expected: every line begins with `OK`. No `MISS` lines.

If any line shows `MISS`, locate the correct relative path and fix the link in the README before continuing. Do not commit a README with broken internal links — the repository's CI runs a link checker on every PR (see [.github/workflows/check-links.yml](../../../.github/workflows/check-links.yml)) and a broken link will fail the build.

- [ ] **Step 6: Commit**

```bash
git add data-types/fixed_size_list/README.md
git commit -m "$(cat <<'EOF'
Add fixed_size_list data type specification

Specification for a new Zarr v3 data type extension modeling Apache
Arrow's FixedSizeList: a fixed-length, positional, homogeneous sequence
of a single base data type. Each scalar contains exactly list_size
elements of base_data_type, encoded as a packed concatenation under
the bytes codec.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 3: Final verification

Confirm both files are present, well-formed, and CI-compatible before handing off the branch.

**Files:**
- Verify: `data-types/fixed_size_list/README.md`
- Verify: `data-types/fixed_size_list/schema.json`

- [ ] **Step 1: Confirm both files exist and are tracked**

```bash
git ls-files data-types/fixed_size_list/
```

Expected output (exact, two lines):

```
data-types/fixed_size_list/README.md
data-types/fixed_size_list/schema.json
```

- [ ] **Step 2: Confirm prettier is satisfied with the schema**

Run:

```bash
npx prettier --check data-types/fixed_size_list/schema.json
```

Expected: prints something like `All matched files use Prettier code style!` and exits 0. If it fails, run `npx prettier -w data-types/fixed_size_list/schema.json` and amend the schema commit.

- [ ] **Step 3: Confirm the schema still validates as JSON Schema**

```bash
python3 -c "import json, jsonschema; jsonschema.Draft202012Validator.check_schema(json.load(open('data-types/fixed_size_list/schema.json')))"
```

Expected: exits 0 with no output.

- [ ] **Step 4: Confirm working tree is clean**

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

- [ ] **Step 5: Summarize the branch state**

```bash
git log --oneline main..HEAD
```

Expected: two new commits on the branch — one for the schema, one for the README (in addition to any pre-existing commits on the branch, such as the design-doc commit).

---

## Done

Both deliverables from the spec are in place:

- `data-types/fixed_size_list/README.md`
- `data-types/fixed_size_list/schema.json`

The branch is ready to be opened as a PR against `main` for review by the Zarr steering council, per the registration process in the top-level [README.md](../../../README.md).
