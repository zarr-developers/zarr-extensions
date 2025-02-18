# zarr-extensions (PREVIEW)

Currently, this repository is in preview mode. It will become the registry for Zarr v3 extensions as soon as [the changes to the spec](https://github.com/zarr-developers/zarr-specs/pull/330) have been adopted.

---

This repository contains the specification for Zarr extensions for the [Zarr version 3 specification](https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html).

It is the normative source for registering names of Zarr v3 extensions.

## Registering an extension

To register an extension, open a new PR with a new extension directory under the relevant extension point:

 * [Codecs](./codecs/README.md)
 * [Data Types](./dtype/README.md)
 * [Chunk Key Encoding](./chunk-key-encodings/README.md)
 * [Chunk Grid](./chunk-grids/README.md)
 * [Storage Transformers](./storage-transformers/README.md)

Each extension MUST have a `README.md` file that describes the extension and its metadata specification.
Extensions SHOULD have a `schema.json` file that contains the JSON schema for the metadata, if the README.md does not provide a link to an external schema.
Please note that all extensions documents will be licensed under the [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).
Only open a PR if you are willing to license your extension under this license.

The PR will be reviewed by the [Zarr steering council](https://github.com/orgs/zarr-developers/teams/steering-council).
We aim to be very open about registering extensions.
The review will be done largely based on avoiding confusing extension names and preventing malicious activity as well as maintaining the formal requirements of the extensions.
Extension maintainers are responsible for their extensions.
Updates to the extensions will also be reviewed by the steering council.


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

All extensions are licensed under the [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).
