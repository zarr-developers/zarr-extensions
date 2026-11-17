# Enum data type

Defines `enum`, a [tagged union](https://en.wikipedia.org/wiki/Tagged_union) data type.
Each element is exactly one of a fixed, ordered list of named variants, and each variant has its own payload data type.

`enum` generalizes the [`optional` data type](https://github.com/zarr-developers/zarr-extensions/pull/33).
An optional value is an `enum` with two variants, one carrying [`null`](../null/README.md) and one carrying the underlying type.
An `enum` with a [`missing`](../missing/README.md) variant gives nullable data with ternary-logic semantics that matches Apache Arrow and Polars nulls.

Like Rust's `enum`, Julia's `Union{...}`, and Arrow's dense union.
Unlike a C enumeration, which is the special case where every variant has data type `null`.

## Data type name

The value of the `name` member of the data type MUST be `enum`.

## Configuration parameters

### `variants`

A non-empty JSON array of variant objects.
Each variant has these members:

- `name`: a non-empty string. Names MUST be unique within the `enum`. Nested `enum` types have independent namespaces.
- `data_type`: the data type of the variant's payload. Any valid Zarr v3 data type (a string, or an object with `name` and optional `configuration`).
  Variable-length data types and nested `enum` types are allowed.
  A variant that carries no information uses [`null`](../null/README.md) or [`missing`](../missing/README.md).

The order of variants is significant.
The _tag_ of a variant is its zero-based index in `variants`.
New variants MAY be appended to extend an `enum`, but never inserted or reordered, since that would change the tag of stored data.

A variant whose data type is `null` or `missing` is a _unit variant_.
All other variants are _payload variants_.

## Permitted fill values

The `fill_value` is a JSON object with:

- `variant`: the name of a variant, and
- `value`: a valid fill value for that variant's data type. It MUST be present for a payload variant. It MUST be `null` or absent for a unit variant.

## Examples

### `optional` equivalent

The `optional` data type with underlying type `uint8` is:

```json
{
  "name": "enum",
  "configuration": {
    "variants": [
      { "name": "null", "data_type": "null" },
      { "name": "some", "data_type": "uint8" }
    ]
  }
}
```

| `optional` fill value | `enum` fill value                        |
| --------------------- | ---------------------------------------- |
| `null`                | `{"variant": "null"}`                    |
| `[42]`                | `{"variant": "some", "value": 42}`       |
| `[null]` (nested)     | `{"variant": "some", "value": {"variant": "null"}}` |

Variant order places the absent case first, so the tag equals the validity mask of `optional` (`false` = absent, `true` = present).
Variant names do not affect the encoding.

### Nullable with ternary logic

Arrow- and Polars-compatible nullable `float64`:

```json
{
  "name": "enum",
  "configuration": {
    "variants": [
      { "name": "missing", "data_type": "missing" },
      { "name": "value", "data_type": "float64" }
    ]
  }
}
```

With `bool` as the payload this gives Kleene logic, see [`missing`](../missing/README.md#ternary-logic).

### General tagged union

Distinguishing the reason a measurement is absent:

```json
{
  "name": "enum",
  "configuration": {
    "variants": [
      { "name": "missing", "data_type": "missing" },
      { "name": "not_applicable", "data_type": "null" },
      { "name": "censored_below", "data_type": "float32" },
      { "name": "value", "data_type": "float32" }
    ]
  }
}
```

with `"fill_value": {"variant": "missing"}`.

### C-style enumeration

```json
{
  "name": "enum",
  "configuration": {
    "variants": [
      { "name": "red", "data_type": "null" },
      { "name": "green", "data_type": "null" },
      { "name": "blue", "data_type": "null" }
    ]
  }
}
```

## Usage and interoperability examples

These examples are non-normative.
The Arrow, Polars and DuckDB (SQL) snippets are checked in CI by [`examples/test_interop.py`](./examples/test_interop.py).
The data used throughout is a chunk of four `float64` values with the second and fourth absent: `[1.5, <absent>, 3.0, <absent>]`.
It is stored as tags `[1, 0, 1, 0]` and, for the one payload variant, the payloads `[1.5, 3.0]`.

### `[null, T]`

Use `[null, T]` when absence is an ordinary value and you do not want any interpretation imposed on it.
This is the `optional` data type.

```json
{
  "data_type": {
    "name": "enum",
    "configuration": {
      "variants": [
        { "name": "none", "data_type": "null" },
        { "name": "some", "data_type": "float64" }
      ]
    }
  },
  "fill_value": { "variant": "none" },
  "codecs": [
    {
      "name": "enum",
      "configuration": {
        "tag_codecs": [{ "name": "packbits" }],
        "variant_codecs": {
          "some": [{ "name": "bytes", "configuration": { "endian": "little" } }]
        }
      }
    }
  ]
}
```

| Language | Value                                                             |
| -------- | ----------------------------------------------------------------- |
| Rust     | `[Some(1.5), None, Some(3.0), None]` as `Vec<Option<f64>>`        |
| Python   | `[1.5, None, 3.0, None]`                                          |
| Julia    | `Union{Nothing,Float64}[1.5, nothing, 3.0, nothing]`              |

Arrow, Polars and SQL have a single null, with no separate "nothing".
Exporting `[null, T]` to them therefore maps `null` to their null, and importing from them gives `[missing, T]` unless the user asks for `[null, T]`.
Nested optionals such as `Some(None)` cannot be represented there.

### `[missing, T]`

Use `[missing, T]` for nullable data with Arrow, Polars, SQL, R or Julia `missing` semantics.

```json
{
  "data_type": {
    "name": "enum",
    "configuration": {
      "variants": [
        { "name": "missing", "data_type": "missing" },
        { "name": "value", "data_type": "float64" }
      ]
    }
  },
  "fill_value": { "variant": "missing" },
  "codecs": [
    {
      "name": "enum",
      "configuration": {
        "tag_codecs": [{ "name": "packbits" }],
        "variant_codecs": {
          "value": [{ "name": "bytes", "configuration": { "endian": "little" } }]
        }
      }
    }
  ]
}
```

The tags are the validity bitmap and the payloads are the valid values with the nulls removed.
Arrow itself stores nulls in place, with the values buffer at full length, so converting means a gather one way and a scatter the other, as below.

**Apache Arrow (PyArrow)**

```python
import numpy as np, pyarrow as pa

a = pa.array([1.5, None, 3.0, None])

# Arrow -> enum: tags are the validity bitmap, payloads are the valid values.
tags = a.is_valid().to_numpy(zero_copy_only=False)        # [1, 0, 1, 0] as bool
payloads = a.drop_null().to_numpy(zero_copy_only=False)   # [1.5, 3.0]

# enum -> Arrow: scatter the payloads and mask the rest.
full = np.zeros(len(tags))
full[tags] = payloads
b = pa.array(full, mask=~tags)                            # [1.5, null, 3.0, null]
```

**Polars**

```python
import numpy as np, polars as pl, pyarrow as pa

s = pl.Series([1.5, None, 3.0, None])
tags = s.is_not_null().to_numpy()                         # [True, False, True, False]
payloads = s.drop_nulls().to_numpy()                      # [1.5, 3.0]

full = np.zeros(len(tags))
full[tags] = payloads
t = pl.from_arrow(pa.array(full, mask=~tags))             # [1.5, null, 3.0, null]
```

A `NaN` is a `float64` value, not a missing value.
It is stored in the payloads and is not counted as absent by `is_null()` in Arrow or Polars.

**SQL**

A nullable column of type `DOUBLE` corresponds to `[missing, float64]`.

| SQL                          | Meaning for `[missing, T]`                       |
| ---------------------------- | ------------------------------------------------ |
| `x IS NULL`                  | tag is the `missing` variant                     |
| `COUNT(x)`                   | number of elements with the `value` tag          |
| `SUM(x)`, `AVG(x)`           | reduce over the payloads only                    |
| `x = NULL`, `NULL = NULL`    | `NULL` (`missing`), not `true`                   |

Ternary logic for a nullable `bool` array (`[missing, bool]`) is the same in all of these:

| Expression                   | SQL `NULL`    | Arrow `and_kleene` / `or_kleene` | Polars `&` / `\|` | Julia `missing`          |
| ---------------------------- | ------------- | --------------------------------- | ----------------- | ------------------------ |
| `missing AND false`          | `false`       | `false`                           | `false`           | `missing & false == false` |
| `missing AND true`           | `NULL`        | `null`                            | `null`            | `missing`                |
| `missing OR true`            | `true`        | `true`                            | `true`            | `missing \| true == true` |
| `missing OR false`           | `NULL`        | `null`                            | `null`            | `missing`                |

```python
import pyarrow as pa, pyarrow.compute as pc
pc.and_kleene(pa.array([None, None, True]), pa.array([False, True, None]))
# [false, null, null]
```

### `[int64, float64]`

A general tagged union.
Each element is either an `int64` or a `float64`, and which one is recorded by the tag.
Neither is absent.
Here the variant names are required, because two variants with different types are otherwise indistinguishable in a JSON fill value.

```json
{
  "data_type": {
    "name": "enum",
    "configuration": {
      "variants": [
        { "name": "int", "data_type": "int64" },
        { "name": "float", "data_type": "float64" }
      ]
    }
  },
  "fill_value": { "variant": "int", "value": 0 },
  "codecs": [
    {
      "name": "enum",
      "configuration": {
        "tag_codecs": [{ "name": "packbits" }],
        "variant_codecs": {
          "int": [
            { "name": "bytes", "configuration": { "endian": "little" } },
            { "name": "zstd", "configuration": { "level": 3 } }
          ],
          "float": [
            { "name": "bytes", "configuration": { "endian": "little" } },
            { "name": "zstd", "configuration": { "level": 3 } }
          ]
        }
      }
    }
  ]
}
```

For the four elements `[7, 2.5, 4.0, 9]`, where `7` and `9` are integers and `2.5` and `4.0` are floats:

| Part              | Content            |
| ----------------- | ------------------ |
| tags (`bool`)     | `[0, 1, 1, 0]`     |
| `int` payloads    | `[7, 9]`           |
| `float` payloads  | `[2.5, 4.0]`       |

Both payload arrays have a length that depends on the chunk, so each is encoded independently.
The `float` payloads are `float64`, so `4.0` stays a float and does not collapse into an integer.

The layout is an Arrow dense union without the offsets: type ids are the tags, and the offset of an element is the number of earlier elements with the same tag.

```python
import pyarrow as pa

ids = pa.array([0, 1, 1, 0], type=pa.int8())       # tags
offsets = pa.array([0, 0, 1, 1], type=pa.int32())  # position within each variant's payloads
u = pa.UnionArray.from_dense(
    ids, offsets,
    [pa.array([7, 9], pa.int64()), pa.array([2.5, 4.0], pa.float64())],
    ["int", "float"],
)
u.to_pylist()   # [7, 2.5, 4.0, 9]
```

The same data in other systems:

| System        | Representation                                                                      |
| ------------- | ----------------------------------------------------------------------------------- |
| Rust          | `enum Num { Int(i64), Float(f64) }`                                                 |
| Julia         | `Union{Int64,Float64}`                                                              |
| DuckDB        | `UNION(int BIGINT, float DOUBLE)`, with `union_tag(x)` giving the variant name      |
| Polars        | No native union type. Use a `Struct` of two nullable fields, or two columns.        |

## Codec compatibility

### `enum` codec

The [`enum` codec](../../codecs/enum/README.md) is the primary array-to-bytes codec for this data type.
It encodes the tags and each variant's payloads separately, each with its own codec chain.

### Other codecs

Other array-to-bytes codecs do not support `enum` unless they define an encoding for it.
The `bytes` codec does not support `enum`.
Codecs that only change shape (e.g. `transpose`, `reshape`) SHOULD support `enum`.
Users are RECOMMENDED to use the `enum` codec as the sole top-level codec.

## In-memory representation

The in-memory representation is an implementation detail and MUST NOT affect encoding.
Suggested mappings, which are not normative:

| Language / library | Representation                                                                 |
| ------------------ | ------------------------------------------------------------------------------ |
| Rust               | `enum`; `Option<T>` for `[null, T]`                                            |
| Julia              | `Union{Nothing,T}` for `null`, `Union{Missing,T}` for `missing`, general `Union` |
| R                  | `NA` for `missing`                                                             |
| Apache Arrow       | Dense union (type ids are the tags); a validity bitmap for `[missing, T]`      |
| Polars             | Nulls for `[missing, T]`; `Enum`/`Struct` for other cases                      |
| NumPy              | `numpy.ma.MaskedArray` for `[missing, T]`                                      |

Arrow type ids are `int8`, so an `enum` with more than 128 variants has no direct dense-union mapping.

## Compatible Implementations

None yet.

## Change log

No changes yet.

## Current maintainers

* Mark Kittisopikul ([@mkitti](https://github.com/mkitti))
