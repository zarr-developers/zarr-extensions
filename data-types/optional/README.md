# Optional data type

Defines a data type for optional (nullable) values that can contain either a value of a specified underlying data type or be missing/undefined/null.

The `optional` data type does not define how null values should be _interpreted_ and represented in-memory.
This is an implementation detail and MUST not impact encoding/decoding.
If an implementation requires a specific in-memory representation for null values (e.g. `missing` or `nothing` in Julia), they are encouraged to do this through a registered attribute.
See the [In-memory representation](#in-memory-representations) section for examples of how null values could be represented in different programming languages.

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

## In-memory representations

Implementations MAY choose any suitable in-memory representation for optional values, as long as they correctly handle the semantics of nullability through the encoding / decoding process.
The recommended in-memory representations in this section are not normative.

### Rust

The Rust [`Option<T>`](https://doc.rust-lang.org/std/option/) type is a natural fit for representing optional values, where `Option<T>` can be `None` (representing null) or `Some(T)` (representing a value of type `T`).
The table below demonstrates valid `data_type` and `fill_value` combinations with an `optional` and nested `optional` data type, along with their equivalent Rust `Option` values.

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

### Python

An `optional` data type with no nesting could be represented using a masked array, such as a NumPy [`numpy.ma.MaskedArray`](https://numpy.org/doc/stable/reference/maskedarray.generic.html).

A `numpy` array using the `StringDType` with an `na_object` that is not `None` could use the `optional` data type with a `string` underlying data type.
However, the `na_object` itself would not be stored in the Zarr metadata of the `optional` data type.
The `na_object` could be set via a runtime option, or alternatively be encoded separately as an attribute, for example.

### Julia

The Julia `missing` or `nothing` values could be used to represent null values in an `optional` data type represented as `Union{T,missing}` or `Union{T,nothing}` where `T` is the underlying data type.

The `null` value type could be set via a runtime option, or alternatively be encoded separately as an attribute, for example.

### R

In R, `NA` may be used to represent `null` values in an optional data type.

## Codec Compatibility

### `optional` Codec

This data type is primarily designed for the [`optional`](../../codecs/optional/README.md) codec, which separately encodes a validity mask and the non-null data.

### Other Array-to-Array Codecs

While array-to-array codecs MAY support the `optional` data type, users are RECOMMENDED to use the `optional` codec as the sole top-level codec.
This approach is preferred because the codecs contained within the `optional` codec configuration do not need to explicitly handle optional data type semantics since they operate on the underlying data type.

Despite the above recommendation, implementations MAY support the `optional` data type with other array-to-array codecs.
Array-to-array codecs that only manipulate shape (e.g. `reshape`) SHOULD support the `optional` data type.
In general, codecs that perform element-wise transformations (e.g. `scale-offset`) SHOULD persist the optional semantics by applying transformations only to valid (non-null) values, while leaving null values unchanged.
However, future codecs may define their own specific handling of the `optional` data type.
For example, [ternary logic](https://en.wikipedia.org/wiki/Three-valued_logic) could be applied, which would require a different handling of null values.

## Example

See the [`optional` codec](../../codecs/optional/README.md) for an example of how to configure the optional data type within array metadata.

## Compatible Implementations

* zarrs (Rust implementation)

## Change log

No changes yet.

## Current maintainers

* Lachlan Deakin ([@LDeakin](https://github.com/LDeakin))
