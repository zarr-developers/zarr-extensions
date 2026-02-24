# Optional data type

Defines a data type for optional (nullable) values that can contain either a value of a specified underlying data type or be missing/undefined/null.

## Configuration parameters

### `name`
The name of the underlying data type.
This can be any valid Zarr V3 data type name.

### `configuration` (optional)
The configuration object for the underlying data type (if required).
This should match the configuration requirements of the specified underlying data type.

## Permitted fill values

The value of the `fill_value` metadata key MUST be `null` or a single element array containing any valid fill value of the underlying data type.

- A `null` fill value represents the absence of a value (missing element).
- A single element array fill value represents a valid value of the underlying data type.

For nested optional types, this representation is applied recursively.

The table below demonstrates valid `data_type` and `fill_value` combinations with an `optional` and nested `optional` data type, along with their equivalent Rust [`Option`](https://doc.rust-lang.org/std/option/) values.

<table>
<thead>
<tr>
<th><code>"data_type"</code></th>
<th><code>"fill_value"</code></th>
<th>Rust value</th>
</tr>
</thead>
<tbody>
<tr>
<td rowspan="2"><code>{<br>&nbsp;&nbsp;"name": "optional",<br>&nbsp;&nbsp;"configuration": {<br>&nbsp;&nbsp;&nbsp;&nbsp;"name": "uint8",<br>&nbsp;&nbsp;}<br>}</code></td>
<td><code>null</code></td>
<td><code>None</code></td>
</tr>
<tr>
<td><code>[42]</code></td>
<td><code>Some(42)</code></td>
</tr>
<tr>
<td rowspan="3"><code>{<br>&nbsp;&nbsp;"name": "optional",<br>&nbsp;&nbsp;"configuration": {<br>&nbsp;&nbsp;&nbsp;&nbsp;"name": "optional",<br>&nbsp;&nbsp;&nbsp;&nbsp;"configuration": {<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"name": "uint8"<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;}<br>}</code></td>
<td><code>null</code></td>
<td><code>None</code></td>
</tr>
<tr>
<td><code>[null]</code></td>
<td><code>Some(None)</code></td>
</tr>
<tr>
<td><code>[[42]]</code></td>
<td><code>Some(Some(42))</code></td>
</tr>
</tbody>
</table>

## Codec Compatibility

### `optional` Codec

This data type is primarily designed for the [`optional`](../../codecs/optional/README.md) codec, which separately encodes a validity mask and the non-null data.

### Other Array-to-Array Codecs

While array-to-array codecs MAY support the `optional` data type, users are RECOMMENDED to use the `optional` codec as the sole top-level codec.
This approach is preferred because the codecs contained within the `optional` codec configuration do not need to explicitly handle optional data type semantics since they operate on the underlying data type.

Despite the above recommendation, implementations MAY support the `optional` data type with other array-to-array codecs.
Array-to-array codecs that only manipulate shape (e.g. `reshape`) SHOULD support the `optional` data type.
Codecs that perform element-wise transformations (e.g. `scale-offset`) MUST persist the optional semantics by applying transformations only to valid (non-null) values, while leaving null values unchanged.

## Example

See the [`optional` codec](../../codecs/optional/README.md) for an example of how to configure the optional data type within array metadata.

## Compatible Implementations

* zarrs (Rust implementation)

## Change log

No changes yet.

## Current maintainers

* Lachlan Deakin ([@LDeakin](https://github.com/LDeakin))
