# Geo Projection Attribute Extension for Zarr

- **Extension Name**: Geo Projection Attribute Extension
- **Version**: 0.1.0
- **Extension Type**: Attribute
- **Status**: Proposed
- **Owners**: @emmanuelmathot

## Description

This specification defines a JSON object that encodes datum and coordinate reference system (CRS) information for geospatial data stored under the `proj` key within the `geo` dictionary in the attributes of Zarr groups or arrays.

## External Specification

The complete specification, including detailed documentation, JSON schema, examples, and implementation notes, is maintained in the [EOPF Data Model repository](https://github.com/EOPF-Explorer/data-model/tree/main/attributes/geo/proj).

**Repository**: https://github.com/EOPF-Explorer/data-model  
**Specification Path**: `attributes/geo/proj/`

## Quick Reference

- **Recommended usage**: Store CRS-encoding JSON object under the `proj` key in the `geo` dictionary of group `attributes`
- **Inheritance**: Group-level definitions apply to direct child arrays; array-level definitions override group-level
- **Key fields**: `version`, `code`, `wkt2`, `projjson`, `bbox`, `transform`, `spatial_dimensions`

## License

This attribute extension is licensed under the [MIT License](https://opensource.org/licenses/MIT).