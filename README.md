# Zarr Extensions Registry

This repository contains the specifications for Zarr extensions for [Zarr version 3](https://zarr-specs.readthedocs.io/en/latest/v3/core/v3.0.html).

It is the normative source for registering names of Zarr v3 extensions.

## Registering an extension

To register an extension, open a new PR with a new extension directory under the relevant extension point:

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

Extensions SHOULD have an implementation that proves the viability of the proposed extension.

Please note that all extensions documents will be licensed under the [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).
Only open a PR if you are willing to license your extension under this license.

The PR will be reviewed by the [Zarr Format Working Group (ZFWG)](https://github.com/orgs/zarr-developers/teams/format-wg).
We aim to be very open about registering extensions.
The review will be done largely based on avoiding confusing extension names and preventing malicious activity as well as maintaining the formal requirements of the extensions.
We recommend opening a "draft PR" first, if you still want to solicit feedback from others in the community. As soon as you turn your PR into a regular PR, the review will be processed.
Extension maintainers are responsible for their extensions.
Updates to the extensions will also be reviewed by the ZFWG.
The ZFWG reserves the right to reassign extensions to other maintainers in case of prolonged inactivity or other reasons at its own discretion.

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

## Extension status

An extension's `README.md` MAY begin with a YAML front matter block that records
the extension's status:

```yaml
---
status: superseded
superseded_by: [bytes]
---
```

| field | type | notes |
| - | - | - |
| `status` | `"active"` or `"superseded"` | `"active"` if the front matter or the field is absent. |
| `superseded_by` | list of strings | Required when `status` is `"superseded"`, and not allowed otherwise. Each string is the name of a registered extension at the same extension point. |

- `active`: the extension may be used for new data.
- `superseded`: new data should use the extensions listed in `superseded_by`
  instead (in that order, when there are several, for example a sequence of
  codecs). Implementations should continue to read data that uses the
  superseded extension. The extension's document may state stronger
  requirements, for example that writers must not use it.

A superseded extension's document SHOULD explain how its data relates to the
extensions that supersede it, for example whether metadata can be rewritten
without re-encoding any data.

The registry website shows the status on each extension's page and in the
sidebar, and its build fails if a status is invalid or names an extension that
is not registered.

## License

All extensions are licensed under the [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).
