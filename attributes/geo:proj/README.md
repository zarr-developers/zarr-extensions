# Projection Attribute Extension for Zarr

- **Extension Name**: Projection Attribute Extension
- **Version**: 0.1.0
- **Extension Type**: Attribute
- **Status**: Proposed
- **Owners**: @emmanuelmathot

## Description

This specification defines a JSON object that encodes datum and coordinate reference system (CRS) information for geospatial data. Additionally, this specification defines a convention for storing this object under the `"geo:proj"` key in the attributes of Zarr groups or arrays.

**Recommended usage**: Define `geo:proj` at the **group level** to apply CRS information to all arrays within that group. This matches the common geospatial pattern of storing multiple arrays with the same coordinates in a single group. Array-level definitions are supported for override cases but are less common.

## Motivation

- Provides simple, standardized CRS encoding without complex nested structures
- Compatible with existing geospatial tools (GDAL, rasterio, pyproj)
- Based on the proven STAC Projection Extension model

## Inheritance Model

The `geo:proj` attribute follows a simple group-to-array inheritance model that should be understood first:

### Inheritance Rules

1. **Group-level definition** (recommended): When `geo:proj` is defined at the group level, it applies to all arrays that are direct children of that group. It does not apply to groups or arrays deeper in the hierarchy (e.g., grandchildren).
2. **Array-level override**: An array can completely override the group's `geo:proj` attribute with its own definition
3. **Complete replacement only**: Partial inheritance (overriding only some fields while inheriting others) is not allowed

Most use cases will use group-level definitions without array overrides.

## Specification

The `geo:proj` attribute can be added to Zarr arrays or groups to define projection information.

<!-- GENERATED_SCHEMA_DOCS_START -->
**`geo:proj` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**version**|`string`|Projection metadata version| &#10003; Yes|
|**code**|`["string", "null"]`|Authority:code identifier (e.g., EPSG:4326)|No|
|**wkt2**|`["string", "null"]`|WKT2 (ISO 19162) CRS representation|No|
|**projjson**|`any`|PROJJSON CRS representation|No|
|**bbox**|`number` `[]`|Bounding box in CRS coordinates|No|
|**transform**|`number` `[]`|Affine transformation coefficients|No|
|**spatial_dimensions**|`string` `[2]`|Names of spatial dimensions [y_name, x_name]|No|

### Field Details

Additional properties are allowed.

#### geo:proj.version

Projection metadata version

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Allowed values**:
    * `"0.1"`

#### geo:proj.code

Authority:code identifier (e.g., EPSG:4326)

* **Type**: `["string", "null"]`
* **Required**: No
* **Pattern**: `^[A-Z]+:[0-9]+$`

#### geo:proj.wkt2

WKT2 (ISO 19162) CRS representation

* **Type**: `["string", "null"]`
* **Required**: No

#### geo:proj.projjson

PROJJSON CRS representation

* **Type**: `any`
* **Required**: No

#### geo:proj.bbox

Bounding box in CRS coordinates

* **Type**: `number` `[]`
* **Required**: No

#### geo:proj.transform

Affine transformation coefficients

* **Type**: `number` `[]`
* **Required**: No

#### geo:proj.spatial_dimensions

Names of spatial dimensions [y_name, x_name]

* **Type**: `string` `[2]`
* **Required**: No
<!-- GENERATED_SCHEMA_DOCS_END -->

Note: The shape of spatial dimensions is obtained directly from the Zarr array metadata once the spatial dimensions are identified.

### Spatial Dimension Identification

In this extension, "spatial dimensions" refers to the dimension names of 2D/3D arrays within this group to which the projection definition applies. This extension is designed for regular grids where dimensions directly correspond to spatial axes.

The extension identifies these array dimensions through:

1. **Explicit Declaration** (recommended): Use `spatial_dimensions` to specify dimension names
2. **Pattern-Based Detection** (fallback): Automatically detect spatial dimensions using patterns defined by this extension

#### Explicit Declaration

```json
{
  "geo:proj": {
    "spatial_dimensions": ["latitude", "longitude"]
  }
}
```

#### Pattern-Based Detection

If `spatial_dimensions` is not provided, implementations should scan `dimension_names` for these patterns defined by this extension (in order):

- ["y", "x"] or ["Y", "X"]
- ["lat", "lon"] or ["latitude", "longitude"]
- ["northing", "easting"]
- ["row", "col"] or ["line", "sample"]

The first matching pair determines the spatial dimensions. **Important**: When dimensions like "X" and "Y" are found, they are always interpreted as [Y, X] (following lat/lon convention), regardless of their actual order in the Zarr array's `dimension_names`.

### Validation Rules

- **Shape Inference**: Once spatial dimensions are identified (either explicitly through `spatial_dimensions` or through pattern-based detection), their sizes are obtained from the Zarr array's shape metadata
- **Spatial Dimension Order**: The spatial dimension order is always [y/lat/northing, x/lon/easting]
- **Error Handling**: If spatial dimensions cannot be identified through either method, implementations MUST raise an error
- **Semantic Identity Requirement**: If more than one CRS representation (`code`, `wkt2`, `projjson`) is provided, they MUST be semantically identical (i.e., describe the same coordinate reference system). Implementations SHOULD validate this consistency and raise an error if the representations describe different CRS

### Shape Reconciliation

The shape of spatial dimensions is determined by:

1. Identifying the spatial dimensions using either `spatial_dimensions` or pattern-based detection
2. Looking up these dimension names in the Zarr array's `dimension_names`
3. Using the corresponding sizes from the array's `shape` attribute

This approach avoids redundancy and ensures consistency by using the array's own metadata rather than duplicating shape information.

## Examples

### Example 1: Simple Web Mercator Raster (Group Level)

```json
{
  "zarr_format": 3,
  "node_type": "group",
  "attributes": {
    "geo:proj": {
      "code": "EPSG:3857",
      "transform": [156543.03392804097, 0.0, -20037508.342789244, 0.0, -156543.03392804097, 20037508.342789244],
      "bbox": [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244]
    }
  }
}
```

### Example 2: Multi-band Satellite Image

```json
{
  "zarr_format": 3,
  "shape": [4, 2048, 2048],
  "dimension_names": ["band", "y", "x"],
  "attributes": {
    "geo:proj": {
      "code": "EPSG:32633",
      "spatial_dimensions": ["y", "x"],
      "transform": [30.0, 0.0, 500000.0, 0.0, -30.0, 5000000.0],
      "bbox": [500000.0, 4900000.0, 561440.0, 4961440.0]
    }
  }
}
```

### Example 3: Geographic Coordinates with Transform

```json
{
  "zarr_format": 3,
  "shape": [1800, 3600],
  "dimension_names": ["lat", "lon"],
  "attributes": {
    "geo:proj": {
      "code": "EPSG:4326",
      "transform": [0.1, 0.0, -180.0, 0.0, -0.1, 90.0],
      "bbox": [-180.0, -90.0, 180.0, 90.0]
    }
  }
}
```

### Example 4: WKT2 Representation

```json
{
  "zarr_format": 3,
  "shape": [1000, 1000],
  "dimension_names": ["northing", "easting"],
  "attributes": {
    "geo:proj": {
      "wkt2": "PROJCRS[\"WGS 84 / UTM zone 33N\",BASEGEOGCRS[\"WGS 84\",DATUM[\"World Geodetic System 1984\",ELLIPSOID[\"WGS 84\",6378137,298.257223563,LENGTHUNIT[\"metre\",1]]],PRIMEM[\"Greenwich\",0,ANGLEUNIT[\"degree\",0.0174532925199433]]],CONVERSION[\"UTM zone 33N\",METHOD[\"Transverse Mercator\",ID[\"EPSG\",9807]],PARAMETER[\"Latitude of natural origin\",0,ANGLEUNIT[\"degree\",0.0174532925199433]],PARAMETER[\"Longitude of natural origin\",15,ANGLEUNIT[\"degree\",0.0174532925199433]],PARAMETER[\"Scale factor at natural origin\",0.9996,SCALEUNIT[\"unity\",1]],PARAMETER[\"False easting\",500000,LENGTHUNIT[\"metre\",1]],PARAMETER[\"False northing\",0,LENGTHUNIT[\"metre\",1]]],CS[Cartesian,2],AXIS[\"easting\",east,ORDER[1],LENGTHUNIT[\"metre\",1]],AXIS[\"northing\",north,ORDER[2],LENGTHUNIT[\"metre\",1]]]",
      "transform": [30.0, 0.0, 500000.0, 0.0, -30.0, 5000000.0]
    }
  }
}
```

## Compatibility Notes

- The `version` field allows tracking of changes and ensures compatibility with future updates
- The `code` field follows the "authority:code" format used by PROJ library
- The `wkt2` field should conform to OGC WKT2 (ISO 19162) standard
- The `transform` field follows the same ordering as GDAL's GeoTransform and STAC's projection extension

## References

- [STAC Projection Extension v2.0.0](https://github.com/stac-extensions/projection)
- [PROJJSON Specification](https://proj.org/specifications/projjson.html)
- [OGC WKT2 Standard](https://www.ogc.org/standards/wkt-crs)
