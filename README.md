# zarr-extensions

This repository is the normative source of registered names for the Zarr v3 specification. This includes Zarr extensions as well as a catalog of registered attributes for [Zarr version 3](https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html).

## Registering an extension

To register an extension, open a new PR with a new extension directory under the relevant extension point:

 * [Attributes](./attributes/README.md)
 * [Codecs](./codecs/README.md)
 * [Data Types](./data-types/README.md)
 * [Chunk Key Encoding](./chunk-key-encodings/README.md)
 * [Chunk Grid](./chunk-grids/README.md)
 * [Storage Transformers](./storage-transformers/README.md)

Each extension MUST have a `README.md` file that describes the extension.
The `README.md` file SHOULD include or link to external documents with the following contents:

- detailed description of the extension
- JSON schema for validation
- examples of usage
- example data
- notes on interoperability and compatibility

Extensions SHOULD have a `schema.json` file that contains the JSON schema for the metadata, if the README.md does not provide a link to an external schema.
The JSON schema should be formatted with `npx prettier -w **/schema.json`.

Please note that all extensions documents will be licensed under the [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).
Only open a PR if you are willing to license your extension under this license.

The PR will be reviewed by the [Zarr steering council](https://github.com/orgs/zarr-developers/teams/steering-council).
We aim to be very open about registering extensions.
The review will be done largely based on avoiding confusing extension names and preventing malicious activity as well as maintaining the formal requirements of the extensions.
We recommend opening a "draft PR" first, if you still want to solicit feedback from others in the community. As soon as you turn your PR into a regular PR, the review will be processed.
Extension maintainers are responsible for their extensions.
Updates to the extensions will also be reviewed by the steering council.
The steering council reserves the right to reassign extensions to other maintainers in case of prolonged inactivity or other reasons at its own discretion.

## Registering an attribute

Strictly speaking, registered attributes are not extensions, because the `attributes` dictionary in Zarr arrays and groups may be populated with arbitrary metadata.
Therefore, implementations do not have strict guarantees about the contents of the `attributes` dictionary and are not required to fail if the `attributes` dictionary contains unknown keys.

However, there are a number of attribute keys that are commonly used within the Zarr community as conventions for common or domain-specific metadata.
Therefore, this repository provides a catalog of registered attributes for coordination and discovery purposes.

The process for registering an attribute is similar to registering an extension.
Open a new PR with a new directory under the `attributes` directory, with the top-level key of the registered attribute.

 * [Attributes](./attributes/README.md)

Registered attributes MUST have a `README.md` file that briefly describes the attribute.
It is RECOMMENDED that the `README.md` links to external specification documents with the following contents:

- detailed description of the attribute key(s) and structure
- JSON schema for validation
- examples of usage
- example data
- notes on interoperability and compatibility
- description of any inheritance or precedence rules

Linking to external specification documents ensures flexibility and avoids potential conflicts. 
For straightforward and non-controversial cases, detailed specifications and schemas may still be included in this repository.

The PR will be reviewed by the [Zarr steering council](https://github.com/orgs/zarr-developers/teams/steering-council) using the same review process as for extensions.
Please note that all registered attributes documents will be licensed under the [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).
Only open a PR if you are willing to license your registered attribute under this license.


## Document conventions

These conventions are used for all extension specification documents in this repository.

Conformance requirements are expressed with a combination of descriptive
assertions and [RFC2119] terminology. The key words "MUST", "MUST NOT",
"REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY",
and "OPTIONAL" in the normative parts of specification documents are to be interpreted as
described in [RFC2119]. However, for readability, these words do not appear in
all uppercase letters in specification documents.

All of the text of specification documents are normative except sections explicitly
marked as non-normative, examples, and notes. Examples in specification documents are
introduced with the words "for example".

[RFC2119] S. Bradner. Key words for use in RFCs to Indicate
   Requirement Levels. March 1997. Best Current Practice. URL:
   https://tools.ietf.org/html/rfc2119

[RFC2119]: https://tools.ietf.org/html/rfc2119

## License

All extensions and registered attributes are licensed under the [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).
