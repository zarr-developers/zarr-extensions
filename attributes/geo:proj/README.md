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

Projection codes are identified by a string. The [proj](https://proj.org/) library defines projections
using "authority:code", e.g., "EPSG:4326" or "IAU_2015:30100". Different projection authorities may define
different string formats. Examples of known projection authorities, where when can find well known codes that
clients are likely to support are listed in the following table.

| Authority Name                          | URL                                                        |
| --------------------------------------- | ---------------------------------------------------------- |
| European Petroleum Survey Groups (EPSG) | <http://www.opengis.net/def/crs/EPSG> or <http://epsg.org> |
| International Astronomical Union (IAU)  | <http://www.opengis.net/def/crs/IAU>                       |
| Open Geospatial Consortium (OGC)        | <http://www.opengis.net/def/crs/OGC>                       |
| ESRI                                    | <https://spatialreference.org/ref/esri/>                   |

The `geo:proj.code` field SHOULD be set to `null` in the following cases:

- The data does not have a CRS, such as in the case of non-rectified imagery with Ground Control Points.
- A CRS exists, but there is no valid EPSG code for it. In this case, the CRS should be provided in `geo:proj.wkt2` and/or `geo:proj.projjson`.
  Clients can prefer to take either, although there may be discrepancies in how each might be interpreted.

#### geo:proj.wkt2

WKT2 (ISO 19162) CRS representation

* **Type**: `["string", "null"]`
* **Required**: No

A Coordinate Reference System (CRS) is the data reference system (sometimes called a 'projection')
used by the asset data. This value is a [WKT2](http://docs.opengeospatial.org/is/12-063r5/12-063r5.html) string.

This field SHOULD be set to `null` in the following cases:

- The asset data does not have a CRS, such as in the case of non-rectified imagery with Ground Control Points.
- A CRS exists, but there is no valid WKT2 string for it.

#### geo:proj.projjson

PROJJSON CRS representation

* **Type**: `any`
* **Required**: No

A Coordinate Reference System (CRS) is the data reference system (sometimes called a 'projection')
used by the asset data. This value is a [PROJJSON](https://proj.org/specifications/projjson.html) object,
see the [JSON Schema](https://proj.org/schemas/v0.5/projjson.schema.json) for details.

This field SHOULD be set to `null` in the following cases:

- The asset data does not have a CRS, such as in the case of non-rectified imagery with Ground Control Points.
- A CRS exists, but there is no valid PROJJSON for it.

#### geo:proj.bbox

Bounding box in CRS coordinates

* **Type**: `number` `[]`
* **Required**: No

Bounding box of the assets represented by this Item in the asset data CRS. Specified as 4 coordinates
based on the CRS defined in the `proj:code`, `proj:projjson` or `proj:wkt2` fields.  First two numbers are coordinates
of the lower left corner, followed by coordinates of upper right corner, , e.g., \[west, south, east, north],
\[xmin, ymin, xmax, ymax], \[left, down, right, up], or \[west, south, lowest, east, north, highest].
The length of the array must be 2\*n where n is the number of dimensions. The array contains all axes of the southwesterly
most extent followed by all axes of the northeasterly most extent specified in Longitude/Latitude
based on [WGS 84](http://www.opengis.net/def/crs/OGC/1.3/CRS84).

#### geo:proj.transform

Affine transformation coefficients

* **Type**: `number` `[]`
* **Required**: No

Linear mapping from pixel coordinate space (Pixel, Line) to projection coordinate space (Xp, Yp). It is
a `3x3` matrix stored as a flat array of 9 elements in row major order. Since the last row is always `0,0,1` it can be omitted,
in which case only 6 elements are recorded. This mapping can be obtained from 
GDAL([`GetGeoTransform`](https://gdal.org/api/gdaldataset_cpp.html#_CPPv4N11GDALDataset15GetGeoTransformEPd), requires re-ordering)
or the Rasterio ([`Transform`](https://rasterio.readthedocs.io/en/stable/api/rasterio.io.html#rasterio.io.BufferedDatasetWriter.transform)).
To get it on the command line you can use the [Rasterio CLI](https://rasterio.readthedocs.io/en/latest/cli.html) with the
[info](https://rasterio.readthedocs.io/en/latest/cli.html#info) command: `$ rio info`.

```txt
  [Xp]   [a0, a1, a2]   [Pixel]
  [Yp] = [a3, a4, a5] * [Line ]
  [1 ]   [0 ,  0,  1]   [1    ]
```

If the transform is defined in Item Properties, it is used as the default transform for all assets that don't have an overriding transform.

Note that `GetGeoTransform` and `rasterio` use different formats for reporting transform information. Order expected in `geo:proj.transform` is the
same as reported by `rasterio`. When using GDAL method you need to re-order in the following way:

```python
g = GetGeoTransform(...)
proj_transform = [g[1], g[2], g[0],
                  g[4], g[5], g[3],
                     0,    0,    1]
```

#### geo:proj.spatial_dimensions

Names of spatial dimensions [y_name, x_name]

* **Type**: `string` `[2]`
* **Required**: No

See the [Spatial Dimension Identification](#spatial-dimension-identification) section below for details on how spatial dimensions are identified.

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

The first matching pair determines the spatial dimensions.

#### Group-Level geo:proj with Array-Level dimension_names

When `geo:proj` is defined at the group level but `spatial_dimensions` is not explicitly provided, implementations must handle the fact that `dimension_names` are defined at the individual array level in Zarr v3. The following algorithm defines how to resolve spatial dimensions:

**For Explicit Declaration (when `spatial_dimensions` is provided):**

1. Use the specified `spatial_dimensions` directly
2. Validate that each data array in the group contains these dimension names
3. If any data array lacks the specified spatial dimensions, ignore that array for the purpose of applying `geo:proj`
4. If no data arrays contain the specified spatial dimensions, implementations MUST raise an error

**For Pattern-Based Detection (when `spatial_dimensions` is not provided):**

1. Scan all data arrays within the group
2. For each data array, examine its `dimension_names` for the defined patterns
3. Use the first matching pattern found across all data arrays
4. If no spatial dimension patterns are found in any data array, implementations MUST raise an error

**Example of Valid Group-Level Configuration:**

```json
{
  "zarr_format": 3,
  "node_type": "group",
  "attributes": {
    "geo:proj": {
      "code": "EPSG:4326",
      "transform": [0.1, 0.0, -180.0, 0.0, -0.1, 90.0]
    }
  }
}
```

With data arrays:

- `temperature/`: `dimension_names: ["time", "lat", "lon"]` ✅ Contains ["lat", "lon"]
- `precipitation/`: `dimension_names: ["time", "lat", "lon"]` ✅ Same pattern
- `lat/`: `dimension_names: ["lat"]` ⚠️ Excluded (coordinate array)
- `lon/`: `dimension_names: ["lon"]` ⚠️ Excluded (coordinate array)

### Validation Rules

- **Shape Inference**: Once spatial dimensions are identified (either explicitly through `spatial_dimensions` or through pattern-based detection), their sizes are obtained from the Zarr array's shape metadata
- **Error Handling**: If spatial dimensions cannot be identified through either method, implementations MUST raise an error
- **Semantic Identity Requirement**: If more than one CRS representation (`code`, `wkt2`, `projjson`) is provided, they MUST be semantically identical (i.e., describe the same coordinate reference system). Implementations SHOULD validate this consistency and raise an error if the representations describe different CRS

### Shape Reconciliation

The shape of spatial dimensions is determined on a per-array basis:

1. Identifying the spatial dimensions using either `spatial_dimensions` or pattern-based detection (as described above)
2. For each data array that the `geo:proj` applies to, looking up the spatial dimension names in that array's `dimension_names`
3. Using the corresponding sizes from that same array's `shape` attribute

This approach avoids redundancy and ensures consistency by using each array's own metadata rather than duplicating shape information.

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
