# Structured data type (legacy alias)

The `"structured"` data type name is a legacy alias for
[`"struct"`](../struct/README.md).

This alias exists for backwards compatibility with Zarr v3 arrays created
before the `struct` data type was formally registered.

## Data type name

The data type is specified as `"structured"`.

## Read-only alias

Implementations MUST be able to read arrays whose metadata uses `"structured"`
as the data type name.

Implementations MUST NOT write new arrays using `"structured"`. New arrays
should use `"struct"` instead.

## Legacy metadata

Legacy `"structured"` arrays may have metadata that differs from the current
`"struct"` specification. Implementations supporting `"structured"` MUST
handle these legacy forms.

### Missing endian configuration

Arrays where the `bytes` codec has no `endian` configuration
(i.e. `{"name": "bytes"}` with no `configuration` key) MUST be treated as
little-endian. Implementations SHOULD warn when `endian` is absent for
`structured` types with multi-byte numeric fields.

### Base64-encoded fill values

Existing arrays may encode the fill value as a
[base64](https://en.wikipedia.org/wiki/Base64)-encoded string of the raw
packed bytes (e.g. `"AAAAAAAAAAA="` for 8 zero bytes). The byte order of
these packed bytes follows the `endian` parameter of the `bytes` codec, or
little-endian if `endian` is absent.

## Change log

No changes yet.

## Current maintainers

* [zarr-python core development team](https://github.com/orgs/zarr-developers/teams/python-core-devs)
