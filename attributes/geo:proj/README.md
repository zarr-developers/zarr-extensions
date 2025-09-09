# Projection Attribute Extension for Zarr

- **Extension Name**: Projection Attribute Extension
- **Version**: 1.0.0
- **Extension Type**: Attribute
- **Status**: Proposed
- **Owners**: @emmanuelmathot

## Description

This extension defines a standardized way to encode coordinate reference system (CRS) information for geospatial Zarr arrays and groups using the `geo:proj` attribute.

## Motivation

- Provides simple, standardized CRS encoding without complex nested structures
- Addresses issues identified in GeoZarr discussions regarding CF convention complexity
- Compatible with existing geospatial tools (GDAL, rasterio, pyproj)
- Based on the proven STAC Projection Extension model

## Specification

The `geo:proj` attribute can be added to Zarr arrays or groups to define projection information.

### Required Fields

At least one of the following MUST be provided:

- `code`: Authority and code identifier (e.g., "EPSG:4326")
- `wkt2`: WKT2 string representation of the CRS
- `projjson`: PROJJSON object representation of the CRS

### Optional Fields

- `bbox`: Bounding box in the CRS coordinates
- `transform`: Affine transformation coefficients (6 or 9 elements)
- `shape`: Shape of the spatial dimensions [y, x]
- `spatial_dims`: Names of spatial dimensions in the array

### Spatial Dimension Identification

The extension identifies spatial dimensions through:

1. **Explicit Declaration** (recommended): Use `spatial_dims` to specify dimension names
2. **Convention-Based** (fallback): Automatically detect standard spatial dimension names

#### Explicit Declaration

```json
{
  "geo:proj": {
    "shape": [2048, 2048],
    "spatial_dims": ["latitude", "longitude"]
  }
}
```

#### Convention-Based Detection

If `spatial_dims` is not provided, implementations should scan `dimension_names` for these patterns (in order):

- ["y", "x"] or ["Y", "X"]
- ["lat", "lon"] or ["latitude", "longitude"]
- ["northing", "easting"]
- ["row", "col"] or ["line", "sample"]

The first matching pair determines the spatial dimensions.

### Validation Rules

- When `shape` is provided, values MUST match the sizes of identified spatial dimensions
- The order in `shape` is always [y/lat/northing, x/lon/easting]
- If spatial dimensions cannot be identified and `shape` is provided, implementations MUST raise an error
- When multiple CRS representations are provided, precedence is: `projjson` > `wkt2` > `code`

## Examples

### Example 1: Simple EPSG Code

```json
{
  "zarr_format": 3,
  "shape": [2048, 2048],
  "dimension_names": ["y", "x"],
  "attributes": {
    "geo:proj": {
      "code": "EPSG:3857"
    }
  }
}
```

### Example 2: With Multiple Dimensions and Transform

```json
{
  "zarr_format": 3,
  "shape": [365, 100, 2048, 2048, 4],
  "dimension_names": ["time", "height", "latitude", "longitude", "band"],
  "attributes": {
    "geo:proj": {
      "code": "EPSG:4326",
      "spatial_dims": ["latitude", "longitude"],
      "shape": [2048, 2048],
      "transform": [0.1, 0.0, -180.0, 0.0, -0.1, 90.0],
      "bbox": [-180.0, -90.0, 180.0, 90.0]
    }
  }
}
```

### Example 3: WKT2 Representation

```json
{
  "zarr_format": 3,
  "shape": [1000, 1000],
  "dimension_names": ["northing", "easting"],
  "attributes": {
    "geo:proj": {
      "wkt2": "PROJCRS[\"WGS 84 / UTM zone 33N\",BASEGEOGCRS[\"WGS 84\",DATUM[\"World Geodetic System 1984\",ELLIPSOID[\"WGS 84\",6378137,298.257223563,LENGTHUNIT[\"metre\",1]]],PRIMEM[\"Greenwich\",0,ANGLEUNIT[\"degree\",0.0174532925199433]]],CONVERSION[\"UTM zone 33N\",METHOD[\"Transverse Mercator\",ID[\"EPSG\",9807]],PARAMETER[\"Latitude of natural origin\",0,ANGLEUNIT[\"degree\",0.0174532925199433]],PARAMETER[\"Longitude of natural origin\",15,ANGLEUNIT[\"degree\",0.0174532925199433]],PARAMETER[\"Scale factor at natural origin\",0.9996,SCALEUNIT[\"unity\",1]],PARAMETER[\"False easting\",500000,LENGTHUNIT[\"metre\",1]],PARAMETER[\"False northing\",0,LENGTHUNIT[\"metre\",1]]],CS[Cartesian,2],AXIS[\"easting\",east,ORDER[1],LENGTHUNIT[\"metre\",1]],AXIS[\"northing\",north,ORDER[2],LENGTHUNIT[\"metre\",1]]]",
      "shape": [1000, 1000],
      "transform": [30.0, 0.0, 500000.0, 0.0, -30.0, 5000000.0]
    }
  }
}
```

## Inheritance

When `geo:proj` is defined at the group level, it applies to all arrays within that group unless overridden at the array level.

## Compatibility Notes

- The `code` field follows the "authority:code" format used by PROJ library
- The `wkt2` field should conform to OGC WKT2 (ISO 19162) standard
- The `transform` field follows the same ordering as GDAL's GeoTransform and STAC's projection extension

## References

- [STAC Projection Extension v2.0.0](https://github.com/stac-extensions/projection)
- [PROJJSON Specification](https://proj.org/specifications/projjson.html)
- [OGC WKT2 Standard](https://www.ogc.org/standards/wkt-crs)
