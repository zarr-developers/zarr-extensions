# Null data type

Defines `null`, a zero-size data type with exactly one value, "nothing".

`null` is the unit type: it carries no information, and every element of a `null` array is the same value.
It exists primarily as the payload data type of payload-free variants of the [`enum`](../enum/README.md) data type.

## Data type name

The value of the `name` member of the data type MUST be `null`.
The data type has no configuration.

```json
"data_type": "null"
```

## Permitted fill values

The `fill_value` MUST be `null`.

## Encoding

Each element occupies zero bytes.
The `bytes` codec encodes an array of any shape with this data type as an empty byte string.

## Semantics

`null` denotes the deliberate absence of a value, like Rust's `()`, Python's `None`, or Julia's `nothing`.
It is an ordinary value: it compares equal to itself and does not participate in [ternary logic](../missing/README.md#ternary-logic).
Use [`missing`](../missing/README.md) for a value that exists but is unknown.

## Change log

No changes yet.

## Current maintainers

* Mark Kittisopikul ([@mkitti](https://github.com/mkitti))
