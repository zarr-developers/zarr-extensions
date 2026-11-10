# `fixed_size_list` data type

A data type for fixed-length tuples of a single inner data type.

## Background

`fixed_size_list` models Apache Arrow's
[`FixedSizeList`](https://arrow.apache.org/docs/format/Columnar.html#fixed-size-list-layout)
layout. It is the homogeneous, positional counterpart to
[`struct`](../struct/README.md).

## Data type representation

| field | type | required |
| - | - | - |
| `name` | Literal `"fixed_size_list"` | yes |
| `configuration` | [Configuration](#configuration) | yes |

### Configuration

| field | type | required | notes |
| - | - | - | - |
| `base_data_type` | The JSON representation of a Zarr v3 data type | yes | The data type of each element. MUST have a fixed encoded size. |
| `list_size` | integer ≥ 1 | yes | The number of `base_data_type` scalars in each `fixed_size_list` scalar. |

`base_data_type` MAY itself be `fixed_size_list` or
[`struct`](../struct/README.md), enabling nested composite types.

## JSON scalar encoding

A scalar is encoded in JSON as an array of exactly `list_size` entries,
each a valid JSON encoding of a scalar of `base_data_type`, in position
order.

For example, with `base_data_type` of `"float32"` and `list_size` of `3`:

```json
[1.0, 2.5, -3.0]
```

## Fill value representation

The `fill_value` is a JSON array of `list_size` entries, each a valid
fill value for `base_data_type`.

```json
"fill_value": [0.0, 0.0, 0.0]
```

## Examples

An array of 3-tuples of `float32`:

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

A parametrized inner type:

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

A list of 16 2D points (each point a `struct`):

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

## Codec compatibility

Any array-to-bytes codec that round-trips a tuple of `list_size`
`base_data_type` values may be used. The
[`bytes`](https://zarr-specs.readthedocs.io/en/latest/v3/codecs/bytes/index.html)
codec is the standard choice.

### Bytes codec encoding

Each scalar is the packed concatenation of `list_size` encoded
`base_data_type` values.

For `base_data_type` of `"float32"` and `list_size` of `3`, each scalar is
12 bytes:

```
 byte:  0   1   2   3   4   5   6   7   8   9  10  11
      ├───────────────┼───────────────┼───────────────┤
      │    elem[0]    │    elem[1]    │    elem[2]    │
      │   (float32)   │   (float32)   │   (float32)   │
      └───────────────┴───────────────┴───────────────┘
```

### Endianness

Endianness is inherited from `base_data_type`. Any array-to-bytes codec
that exposes an endianness configuration MUST set it appropriately:

- If `base_data_type` is a multi-byte numeric type (e.g. `float32`,
  `int32`), endianness MUST be configured.
- If `base_data_type` is single-byte (e.g. `uint8`, `int8`, `bool`),
  endianness configuration MAY be omitted.
- If `base_data_type` is itself a compound data type (e.g.
  [`struct`](../struct/README.md) or `fixed_size_list`), endianness is
  governed by the rules of that inner data type, and MUST be configured
  whenever the compound type contains any multi-byte numeric leaf.

## References

- [Apache Arrow Columnar Format — Fixed-Size List Layout](https://arrow.apache.org/docs/format/Columnar.html#fixed-size-list-layout)
  — the data model and `list_size` field name are drawn from Arrow.
- [`struct`](../struct/README.md) — the heterogeneous, named-field
  counterpart to this data type.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
