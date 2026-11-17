# Variable-length bytes data type (alias of `bytes`)

Defines `variable_length_bytes`, an alternative name for the
[`bytes`](../bytes/README.md) data type. Each element of an array with this data
type is a byte string of arbitrary length.

## Background

zarr-python writes `"variable_length_bytes"` as the `data_type` of Zarr V3
arrays holding variable-length byte strings (NumPy `object` arrays of `bytes`,
which Zarr V2 stores as `"|O"` with the `vlen-bytes` object codec). This name
predates the registration of the `bytes` data type and is now present in
existing data. It is registered so that such data has a specification.

`variable_length_bytes` and `bytes` are the same data type. New data should
use `bytes`.

## Data type representation

The value of the `data_type` metadata key must be either the string
`"variable_length_bytes"` or a JSON object with the following fields:

| field | type | required |
| - | - | - |
| `name` | Literal `"variable_length_bytes"` | yes |
| `configuration` | empty JSON object | no |

The two forms are equivalent.

## Semantics

An array whose `data_type` is `variable_length_bytes` must be treated exactly
as if its `data_type` were `bytes`: the set of values, the
[fill value encoding](../bytes/README.md#fill-value-encoding), and codec
compatibility are those of the [`bytes`](../bytes/README.md) data type.
Implementations may rewrite `variable_length_bytes` to `bytes` in metadata
without changing any chunk data.

## Fill value representation

The value of the `fill_value` metadata key follows the
[`bytes` fill value encoding](../bytes/README.md#fill-value-encoding): either an
array of integers from the closed interval `[0, 255]`, or a string produced by
applying [base64 encoding](https://datatracker.ietf.org/doc/html/rfc4648#section-4)
to the byte string.

## Example

The example below shows a fragment of array metadata written by zarr-python.
The fill value is the byte string `0x01 0x02`:

```json
{
    "data_type": "variable_length_bytes",
    "fill_value": "AQI=",
    "codecs": [
        {"name": "vlen-bytes", "configuration": {}},
        {"name": "zstd", "configuration": {"level": 0, "checksum": false}}
    ]
}
```

## Codec compatibility

As for [`bytes`](../bytes/README.md#codec-compatibility): any codec that can
encode variable-length sequences of bytes, for example
[`vlen-bytes`](../../codecs/vlen-bytes/README.md).

## Implementations

- [zarr-python](https://github.com/zarr-developers/zarr-python) (`zarr.core.dtype.VariableLengthBytes`)
  writes this name, and reads both `"variable_length_bytes"` and `"bytes"`.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
