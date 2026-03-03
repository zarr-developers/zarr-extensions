# Cast_value codec

Defines an `array -> array` codec that converts (casts) the values of the input array to a new data type by converting the numerical value of each element. This codec does not re-interpret binary representations, and it leaves all other array properties intact.

This codec is only defined for data types that model real numbers: floating-point and integral data types.

## Procedure

This codec defines an ordered set of conditions that define how a scalar from the input array is transformed into a scalar in the output array with a new data type. The same ordered procedure applies during decoding, with input and output data types swapped.

1. An input scalar is explicitly mapped to an output scalar. This transformation is defined by the `scalar_map` field in the codec configuration. The scalar map MUST be evaluated before any other representability checks.

2. An input scalar represents a value exactly representable in the output data type. A scalar is exactly representable in a target data type if it is an element of the set of numerical values representable by that data type and can be encoded without rounding or range transformation. E.g., `0` in `uint16` maps to `0` in `uint8`. No parametrization of this transformation is required. Exact representability for floating-point types refers to numerical value only, not bit-level encoding. Payload preservation is not required.

3. An input scalar can be transformed to a value that is representable in the output data type using a combination of rounding and a rule for mapping out-of-range scalars into the output data type.

Codec implementations MUST evaluate these conditions in order. If none of these conditions hold for any input scalar, the codec implementation MUST error. This ensures that there are no undefined transformations.

### Special values

If both input and output data types support IEEE 754 semantics, NaN values MUST be propagated unless overridden by `scalar_map`. Signed zero MUST be preserved.

If the output data type does not support NaN or transfinite values and the input scalar has NaN or transfinite semantics, the transformation MUST error unless explicitly overridden by scalar_map.

## Codec metadata

This codec is declared in metadata as a JSON object with the following structure:

| Field | Type | Required |
| -     | -    | -        |
| [`name`](#name)  | string | yes |
| [`configuration`](#configuration) | object | yes |

### Name

The value of the `name` field MUST be the string `"cast_value"`.

### Configuration

The value of the `configuration` field is a JSON object with the following structure:

| Field | Type | Required |
| -     | -    | -        |
| [`data_type`](#data_type)  | Zarr V3 data type metadata | yes |
| [`rounding`](#rounding) | string | no |
| [`out_of_range`](#out_of_range) | string | no |
| [`scalar_map`](#scalar_map) | object | no |

Additional keys are reserved for future versions of this codec. Metadata with additional keys MUST be treated as invalid by readers.

### data_type

The value of the `data_type` field is Zarr V3 data type metadata that defines the data type which the input scalars will be cast to. It also defines the data type of the input to the decoding routine. The fill value of the output array MUST be cast to the target data type using the same casting semantics as elements. This is necessary to ensure that partial chunks are decoded correctly. Implementations SHOULD validate at metadata construction time that the fill value can be successfully cast in both the forward (encode) and inverse (decode) directions using the codec's configuration. If the fill value cannot survive a round-trip cast, implementations MUST treat this as an error.

### rounding

The value of the `rounding` field is a string that defines how values are rounded when casting to a data type with insufficient numerical precision. This applies to any cast where the target data type cannot exactly represent the input value, including casting between floating-point types of different widths and casting from integer types to floating-point types with insufficient mantissa bits (e.g. `int64` to `float32`).

The following values are permitted:

| Value | Description |
| - | - |
| `"nearest-even"` | Round to the nearest representable value, with ties rounded to the value whose least significant digit is even (IEEE 754 `roundTiesToEven`). |
| `"towards-zero"` | Round towards zero. |
| `"towards-positive"` | Round towards positive infinity. Also known as rounding up, or taking the ceiling. |
| `"towards-negative"` | Round towards negative infinity. Also known as rounding down, or taking the floor. |
| `"nearest-away"` | Round to the nearest representable value, with ties going away from zero. |

If this field is not present, implementations MUST use `"nearest-even"`.

### out_of_range

The value of the `out_of_range` field is a string that defines how values outside the representable range of the target `data_type` are handled. If applicable, the rounding rule defined in the `rounding` field MUST be applied before the `out_of_range` transformation.

The following values are permitted:

| Value | Description |
| - | - |
| `"clamp"` | A value with a quantity exceeding the representable range is clamped to the minimum or maximum value of the target data type. For output data types with representations of ±Infinity, values outside the finite range of the data type MUST be mapped to ±Infinity. |
| `"wrap"` | A value exceeding the representable range is mapped to the value in the representable range that is congruent to that input value modulo `2^N` where `N` is the size in bits of the output data type. Only permitted when `data_type` is an integral type that uses a two's complement representation for purposes of modular arithmetic. |

If this field is not present, out-of-range values are not handled by the codec. In this case, implementations MUST treat any out-of-range value as an encoding or decoding failure.

For example, given an input scalar of `128.0` and an output data type of `"int8"`:
- If `out_of_range` is not set, the codec MUST fail.
- If `out_of_range` is `"clamp"`, then the encoded scalar is `127`.
- If `out_of_range` is `"wrap"`, then the encoded scalar is `-128`.

For signed types, wrapping follows two's complement semantics. For example, given an output data type of `"int16"`:
- An input scalar of `32768` wraps to `-32768`.
- An input scalar of `32769` wraps to `-32767`.
- An input scalar of `-32769` wraps to `32767`.

### scalar_map

If present, the value of the `scalar_map` field is a JSON object with the following optional fields:

| Field | Type | Required |
| -     | -    | -        |
| `encode` | array | no |
| `decode` | array | no |

If present, both `encode` and `decode` are JSON arrays of length-2 arrays `[[<input>, <output>], ...]`. Each element defines a mapping from an input scalar to an output scalar. Input scalars are encoded to JSON using the Zarr V3 fill value encoding for the input data type; output scalars are encoded using the fill value encoding for the output data type.

For `encode`, the input data type is the array data type before casting and the output data type is the target `data_type`. For `decode`, the input data type is the target `data_type` and the output data type is the array data type before casting.

Readers MUST interpret each array as a mapping with unique keys (the first element in each sub-array). If the same input scalar is repeated, readers MUST use the first occurrence. Writers SHOULD NOT repeat the same input scalar.

When encoding, if a value matches a key in `scalar_map.encode`, the corresponding mapped value is used instead of the normal casting rules defined by `rounding` and `out_of_range`. Similarly, when decoding, if a value matches a key in `scalar_map.decode`, the corresponding mapped value is used instead of the normal casting rules.

## Example

### NumPy compatibility

When casting a floating-point scalar to an integer, NumPy coerces unrepresentable floats to 0, and uses modular arithmetic for finite values that exceed the representable range of the data type. The example below demonstrates a codec configuration that models NumPy's behavior. Note that this is lossy.

```jsonc
{
    "data_type": "float64",
    "codecs": [
        {
            "name": "cast_value",
            "configuration": {
                "data_type": "uint8",
                "rounding": "towards-zero",
                "out_of_range": "wrap",
                "scalar_map": {
                    "encode": [
                        ["NaN", 0], 
                        ["+Infinity", 0], 
                        ["-Infinity", 0]
                    ]
                }
            }
        },
        "bytes"
    ]
}
```

## References

https://en.wikipedia.org/wiki/Rounding
https://en.wikipedia.org/wiki/IEEE_754

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
