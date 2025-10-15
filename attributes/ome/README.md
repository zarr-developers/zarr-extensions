# OME-Zarr

This extension defines a metadata set of attributes that are specific to the
[OME-Zarr](https://ngff.openmicroscopy.org/) format.

OME-Zarr is a format for storing multi-dimensional images and metadata based on Zarr hierarchies.
It supports features such as multiscale pyramids and transforms.
OME-Zarr is commonly used for microscopy data (like 2D, 3D, time-lapse, multi-channel microscopy images).

## Attribute name

The OME-Zarr metadata is stored in the `"ome"` attribute.

## Specification and governance

The specification is hosted at https://ngff.openmicroscopy.org/specifications/index.html.
The [accompanying Github repository](https://github.com/ome/ngff/) also contains JSON schemas for the metadata.

OME-Zarr is a community-driven project, which is evolved by the [RFC process specified in RFC-1](https://ngff.openmicroscopy.org/rfc/1/index.html).

## Examples

Examples can be found in the [various data repositories](https://ngff.openmicroscopy.org/data/index.html) that support OME-Zarr.


## Current maintainers

* [`Josh Moore`](@joshmoore)