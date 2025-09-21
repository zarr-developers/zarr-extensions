# Attributes Extensions

This directory contains specifications for Zarr v3 attribute extensions.
This subdirectory lists namespaces that have been formally registered by the community for use as top-level keys in the Zarr v3 attributes dictionary. Each namespace is reserved for that purpose and does not apply when used for nested keys or other contexts.

## What are Attribute Extensions?

Attribute extensions define standardized schemas and semantics for metadata stored in the attributes of Zarr arrays and groups. These extensions enable interoperability by establishing common conventions for domain-specific metadata.

Where possible, attribute extensions should link to external schemas or specifications rather than hosting them directly in this repository. This approach ensures flexibility and avoids potential conflicts. For straightforward and non-controversial cases, JSON schemas may still be included here.


## Creating an Attribute Extension

When creating an attribute extension, consider:

1. **Namespace**: Use a unique prefix to avoid conflicts (e.g., `geo` for geospatial). Choose namespace characters that are compatible with all operating systems by avoiding special characters like colons (:)
2. **Schema**: Provide or link to a JSON schema for validation
3. **Inheritance**: Define behavior when attributes are set at group vs array level
4. **Compatibility**: Consider interoperability with existing tools and standards
5. **Example data**: Where possible, consider including a complete Zarr hierarchy that implements the extension.

## Extension Requirements

Each attribute extension SHOULD:

- Define the attribute key(s) and structure
- Provide a JSON schema for validation
- Include examples of usage
- Document any inheritance or precedence rules
