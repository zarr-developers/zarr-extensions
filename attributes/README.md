# Attributes Extensions

This directory contains specifications for Zarr v3 attribute extensions.

## What are Attribute Extensions?

Attribute extensions define standardized schemas and semantics for metadata stored in the attributes of Zarr arrays and groups. These extensions enable interoperability by establishing common conventions for domain-specific metadata.

## Registered Extensions

| Extension | Version | Description |
|-----------|---------|-------------|
| [projection](./projection/) | 1.0.0 | Coordinate reference system metadata for geospatial data |

## Creating an Attribute Extension

When creating an attribute extension, consider:

1. **Namespace**: Use a unique prefix to avoid conflicts (e.g., `proj:` for projection)
2. **Schema**: Provide a JSON schema for validation
3. **Inheritance**: Define behavior when attributes are set at group vs array level
4. **Compatibility**: Consider interoperability with existing tools and standards

## Extension Requirements

Each attribute extension MUST:
- Define the attribute key(s) and structure
- Provide a JSON schema for validation
- Include examples of usage
- Document any inheritance or precedence rules
