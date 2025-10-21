# Optional data type

Defines a data type for optional (nullable) values that can contain either a value of a specified underlying data type or be missing/null.

This data type is designed for the [`optional`](../../codecs/optional/README.md) codec, which separately encodes a validity mask and the data.

While array-to-array codecs MAY support the `optional` data type, implementations SHOULD use the `optional` codec as the sole top-level codec.
This approach is preferred because the codecs contained within the `optional` codec configuration do not need to explicitly handle optional data type semantics.

## Configuration parameters

### `name`
The name of the underlying data type.
This can be any valid Zarr data type name.

### `configuration`
The configuration object for the underlying data type.
This should match the configuration requirements of the specified underlying data type.

## Permitted fill values

The value of the `fill_value` metadata key MAY be any valid value of the underlying data type or `null`.

When the `fill_value` is `null`, it represents the absence of a value (missing element).
When the `fill_value` is any other valid value of the underlying data type, that value represents an actual present element, not a missing one.

## Example

For example, the array metadata below specifies that the array contains optional `uint8` values with a fill value of `null` (representing missing elements):

```json
{
    "data_type": {
        "name": "optional",
        "configuration": {
            "name": "uint8",
            "configuration": {}
        }
    },
    "fill_value": null,
    "codecs": [{
        "name": "optional",
        "configuration": {
            "mask_codecs": [
                {
                    "name": "packbits"
                }
            ],
            "data_codecs": [
                {
                    "name": "bytes",
                    "configuration": {
                        "endian": "little"
                    }
                }
            ]
        }
    }]
}
```

### Compatible Implementations

* zarrs (Rust implementation)

## Change log

No changes yet.

## Current maintainers

* Lachlan Deakin ([@LDeakin](https://github.com/LDeakin))
