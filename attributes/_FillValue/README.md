# `_FillValue` attribute

## Summary

This extension is about missing data in Zarr. It documents an existing convention introduced in Xarray: using the `_FillValue` attribute to represent "missing data". This is distinct from the `Array.fill_value` metadata, which is used as the return value for uninitialized chunks.

**Two concepts, now separated in v3:**

| Concept | Zarr v2 | Zarr v3 |
|---------|---------|---------|
| **Uninitialized chunks** | `fill_value` (nullable) | `fill_value` (**required**, not nullable) |
| **Missing data semantics** | Same `fill_value` | `attrs['_FillValue']` (optional) |

**Migration:** Implementations SHOULD use dtype extremes for `fill_value` (e.g., `-32768` for int16, `255` for uint8, `NaN` for floats).


## Description

### Attribute name

The attribute is specified as `"_FillValue"`.

### Attribute values

This paragraph reflects the [Xarray implementation](https://github.com/pydata/xarray/blob/3572f4e70f2b12ef9935c1f8c3c1b74045d2a092/xarray/backends/zarr.py#L117-L140)

- For Zarr core type ``bool``, the value MUST be ``true`` or ``false``.

- For Zarr core types ``int8``, ``int16``, ``int32``, ``int64``, ``uint8``, ``uint16``, ``uint32``, ``uint64``,
  the value MUST be the JSON encoding of the numeric value.

- For Zarr core types ``float16``, ``float32``, ``float64``, the value is first converted to the little-endian 64-bit IEEE-754 representation, and the Base64 encoded value MUST be stored as a JSON string.

- For Zarr extension ``bytes`` type, the value is a sequence of any length, and its Base64 encoded value MUST be stored as a JSON string.

- For Zarr extension ``string`` type, the value is a string and MUST be stored as a JSON string.

- Any other data types are not covered by this extension.

### JSON schema for validation

See [schema.json](schema.json)

### Examples of usage

* For bool core type:

Example with a Zarr array "fill_value" (value used for missing chunks) is ``false``,
but where the "_FillValue" attribute (sentinel used for missing values) is ``true``.

```json
{
  "zarr_format":3,
  "node_type":"array",
  "data_type":"bool",
  "fill_value":false,
  "attributes":{
    "_FillValue":true
  },
  "[...snip...]": "other required Zarr Array JSON members"
}
```

* For integer core types:

Example with a Zarr array "fill_value" (value used for missing chunks) is ``0``,
but where the "_FillValue" attribute (sentinel used for missing values) is ``255``.

```json
{
  "zarr_format":3,
  "node_type":"array",
  "data_type":"uint8",
  "fill_value":0,
  "attributes":{
    "_FillValue": 255
  },
  "[...snip...]": "other required Zarr Array JSON members"
}
```

* For floating point core types:

Example with a Zarr array "fill_value" (value used for missing chunks) is ``NaN``,
but where the "_FillValue" attribute (sentinel used for missing values) is ``1.5``.

```json
{
  "zarr_format":3,
  "node_type":"array",
  "data_type":"float32",
  "fill_value":"NaN",
  "attributes":{
    "_FillValue": "AAAAAAAA+D8="
  },
  "[...snip...]": "other required Zarr Array JSON members"
}
```

* For ``bytes`` extension type:

Example with a Zarr array "fill_value" (value used for missing chunks) is [1, 2, 3],
but where the "_FillValue" attribute (sentinel used for missing values) is [4, 5, 6, 7].

```json
{
  "zarr_format":3,
  "node_type":"array",
  "data_type":"bytes",
  "fill_value":[1,2,3],
  "attributes":{
    "_FillValue": "BAUGBw=="
  },
  "[...snip...]": "other required Zarr Array JSON members"
}
```

* For ``string`` extension type:

Example with a Zarr array "fill_value" (value used for missing chunks) is "missing chunk",
but where the "_FillValue" attribute (sentinel used for missing values) is "missing value".

```json
{
  "zarr_format":3,
  "node_type":"array",
  "data_type":"string",
  "fill_value":"missing chunk",
  "attributes":{
    "_FillValue": "missing value"
  },
  "[...snip...]": "other required Zarr Array JSON members"
}
```

## History and Context

In Zarr V2, `fill_value` is part of the [Array metadata](https://zarr-specs.readthedocs.io/en/latest/v2/v2.0.html#metadata). It is allowed to be `null` although [the key was required](https://zarr-specs.readthedocs.io/en/latest/v2/v2.0.html#metadata). It is defined as:
> A scalar value providing the default value to use for uninitialized portions of the array, or null if no fill_value is to be used.

It has no official semantic meaning other than this.

There is a similar definition in the [NetCDF User Guide Appendix A](https://docs.unidata.ucar.edu/nug/current/attribute_conventions.html)
> The _FillValue attribute specifies the fill value used to pre-fill disk space allocated to the variable. Such pre-fill occurs unless nofill mode is set using nc_set_fill(). The fill value is returned when reading values that were never written. If _FillValue is defined then it should be scalar and of the same type as the variable.

However, it goes further:

> Generic applications often need to write a value to represent undefined or missing values. The fill value provides an appropriate value for this purpose because it is normally outside the valid range and therefore treated as missing when read by generic applications. It is legal (but not recommended) for the fill value to be within the valid range.

This broader interpretation was adopted by [CF Conventions](https://cfconventions.org/cf-conventions/cf-conventions.html#missing-data).

Therefore we can distinguish two distinct use cases for "fill values":
* return value for uninitialized chunks
* generic missing data


When Xarray implemented Zarr V2 support, it hijacked the `Array.fill_value` to have the same semantic meaning as the NetCDF `_FillValue` attribute: it was used for **both use cases**. Because `Array.fill_value` was nullable, Xarray assumed that arrays without `Array.fill_value` contained no missing data, and that arrays _with_ `Array.fill_value` should be "masked" before returning data to the user. For Xarray, this meant replacing all items equal to `fill_value` with `NaN`. (For non-floating-point data, the data are first coerced to float in order to enable this.)😬)

This situation was disrupted by Zarr V3, which made `Array.fill_value` [non nullable for core data types](https://zarr-specs.readthedocs.io/en/latest/v3/data-types/index.html#permitted-fill-values). Furthermore, the default value was set to 0 for common datatypes. This meant that Xarray could no longer assume that `Array.fill_value` represented missing data and automatically replace it with NaN. At this point. Xarray choose to start using the `Array.attrs['_FillValue']` attribute to represent missing data for Zarr V3 arrays, similar to how it already does with NetCDF / HDF5 data. However, Xarray also defined its [own encoding convention](https://github.com/pydata/xarray/blob/3572f4e70f2b12ef9935c1f8c3c1b74045d2a092/xarray/backends/zarr.py#L117-L160) for this attribute which is, unfortunately, distinct from the way Zarr V3 encodes `Array.fill_value`. Users because writing Zarr V3 data using Xarray, and now significant data conforming to this convention exists in the wild.


### Summary Table: How Xarray Uses Fill Values in Zarr

|  | V2 | V3 |
|--|--|--
|`Array.fill_value` | nullable, return value for uninitialized chunks AND used to indicate generic missing data | required (cannot be null), return value for uninitialized chunks |
|`Array.attrs['_FillValue']` | not used | optional, used to indicate generic missing data | 

https://github.com/pydata/xarray/blob/3572f4e70f2b12ef9935c1f8c3c1b74045d2a092/xarray/backends/zarr.py#L117-L140

## Limitations

This approach, sometimes called a "sentinel value," is limited to data types for which an obvious `_FillValue` can be definied (e.g. Nan for floating point types). It is barely suitable for integers, and is clearly not suitable for extension data types with no obvious sentinel value. Those use cases would benefit from a different approach.

The point of this registred attribute is not to find the ideal way to represent missing data in Zarr; it is, rather, to **document the existing convention transparently for the sake of interoperability**. In the future, we may find a better way to deal with missing data in Zarr and deprecate this approach, which clearly has some shortcomings.


## Conversion of Zarr v2 arrays to Zarr v3 arrays

`Array.fill_value` could be null in Zarr v2 but is now required in Zarr v3. When converting Zarr v2 arrays to Zarr v3 implementations are RECOMMENDED to explicitly require the user to specify the `Array.fill_value` if `null`. If migrating V2 data written by Xarray, it is RECOMMENDED to migrate non-null `Array.fill_value` to `Array.attrs['_FillValue']`, respecting the encoding described above.


## Decoded Representation of Missing Data

This spec is not perscriptive for how implementations should represent the decoded, in-memory representation of Arrays with missing data. This will vary by language and context. For example, Xarray uses NumPy Arrays with NaN values to represent missing data. Using Python Masked Arrays would be equally valid.

## Future Considerations

### Representing missing data in Zarr arrays

Some languages have first-class missing data types (avoiding sentinel value ambiguity):

- **R:** [`NA` type](https://www.rdocumentation.org/packages/base/versions/3.6.2/topics/NA) which is distinct from [`NULL` type](https://www.rdocumentation.org/packages/base/versions/3.6.2/topics/NULL)
- **Julia:** [`Missing` type](https://docs.julialang.org/en/v1/manual/missing/) which is distinct from [`Nothing` type](https://docs.julialang.org/en/v1/manual/faq/#Nothingness-and-missing-values) (equivalent to `null`)
- **Python/NumPy:** No native missing type; relies on `NaN` (floats only) or sentinel values
- **Arrow:** Arrow uses a [validity bitmap](https://arrow.apache.org/docs/format/Columnar.html#validity-bitmaps) where 0 represents null and 1 is a valid type
    - When encoded to Parquet, [definition levels](https://arrow.apache.org/blog/2022/10/08/arrow-parquet-encoding-part-2/) are used.

Python alternatives include `numpy.ma.MaskedArray` or PyArrow arrays for generic missing data support across all dtypes.

Currently we make no explicit recommendation of how to represent missing data in Zarr arrays. Future Zarr specification authors may consider how to adopt definition levels from Parquet while implementations may take inspiration from the corresponding Arrow implementations.


## Current maintainers

* Ryan Abernathey | `@rabernat`
