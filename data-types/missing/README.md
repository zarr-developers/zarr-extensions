# Missing data type

Defines `missing`, a zero-size data type with exactly one value, "missing".
It represents a value that exists but is unknown or not recorded, like `missing` in Julia, `NA` in R, `pandas.NA`, and SQL `NULL`.

`missing` is the same as [`null`](../null/README.md) on disk.
They differ only in semantics: `missing` participates in [ternary logic](#ternary-logic) and propagates through operations, whereas `null` is an ordinary value.
They are separate data types so that the distinction survives a round trip.

## Data type name

The value of the `name` member of the data type MUST be `missing`.
The data type has no configuration.

```json
"data_type": "missing"
```

## Permitted fill values

The `fill_value` MUST be `null`.

## Encoding

Each element occupies zero bytes.
The `bytes` codec encodes an array of any shape with this data type as an empty byte string.

## Semantics

The semantics below apply to implementations that provide the operations concerned.
They do not affect encoding or decoding.

### Ternary logic

For nullable boolean data (an [`enum`](../enum/README.md) with a `missing` variant and a `bool` variant), logical operators follow Kleene three-valued logic, with `missing` as the unknown value:

| `a`       | `b`       | `a AND b` | `a OR b`  | `NOT a`   |
| --------- | --------- | --------- | --------- | --------- |
| `true`    | `missing` | `missing` | `true`    | `false`   |
| `false`   | `missing` | `false`   | `missing` | `true`    |
| `missing` | `missing` | `missing` | `missing` | `missing` |

`AND` and `OR` are commutative.
This matches Julia's `missing`, R's `NA`, SQL `NULL`, and Apache Arrow and Polars (Kleene) logic.

### Other operations

- Comparisons and arithmetic involving `missing` yield `missing`, including `missing == missing`.
- Reductions SHOULD offer an option to skip `missing` values (e.g. `skipmissing` in Julia, `na.rm` in R).

## Interoperability

- The Apache Arrow `Null` logical type and the Polars `Null` data type are arrays whose every element is null. This is `missing`.
- An Arrow or Polars nullable array of type `T` (a validity bitmap plus values) is an [`enum`](../enum/README.md) with variants `[missing, T]`. The tags are the validity bitmap.
- Julia `Missing` and `Union{T,Missing}`, and R `NA`, map the same way.

## Change log

No changes yet.

## Current maintainers

* Mark Kittisopikul ([@mkitti](https://github.com/mkitti))
