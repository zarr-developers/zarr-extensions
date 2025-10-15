# OME-Zarr

This extension defines a metadata set of attributes specific to the [OME-Zarr](https://ngff.openmicroscopy.org/) format.

OME-Zarr is a format for storing multi-dimensional images and associated metadata based on Zarr hierarchies.
It supports advanced features such as multiscale pyramids and spatial transforms.
OME-Zarr is widely used in microscopy applications, including 2D, 3D, time-lapse, and multi-channel imaging data.

## Attribute name

The OME-Zarr metadata is stored in the `"ome"` attribute.

## Specification and governance

The full specification is available at: https://ngff.openmicroscopy.org/specifications/index.html

The [accompanying Github repository](https://github.com/ome/ngff/) contains the JSON schemas for the metadata.

OME-Zarr is a community-driven project.
Specification changes and enhancements follow the [RFC process specified in RFC-1](https://ngff.openmicroscopy.org/rfc/1/index.html).

## Examples

Examples of OME-Zarr data can be found in the [supported data repositories](https://ngff.openmicroscopy.org/data/index.html).

## Current maintainers

* [`Josh Moore`](@joshmoore)