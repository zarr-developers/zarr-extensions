# Template chunk key encoding

A flexible chunk key encoding inspired by rust/ python format string templates.

## Template string syntax

Templates are strings including braced `{}` expressions denoting where to insert values.
The expression consists of one of

- a positive integer representing a zero-based index into the chunk coordinate
- a negative integer representing an index from the end of the chunk coordinate,
  where `-1` is the last value;
  i.e. `positive_index = len(chunk_coordinate) + negative_index`
- an asterisk `*` representing a all values of the chunk coordinate not represented elsewhere

Optionally, this MAY be followed by a colon, then a 0, then the minimum width of the resulting inserted string, to be left-padded by zeros.

- `{0}` denotes the first value of the chunk coordinate, in decimal format
- `{-1}` denotes the last value of the chunk coordinate, in decimal format
- `{*}` is a catch-all/ rest operator:
  - If `{*}` is present, the configuration object MUST include the `separator` field
  - No more than one `*` term may be present
  - Values of the chunk coordinate not included explicitly by another expression are included in left-to-right order, separated by the value of the `separator` field
- `{1:05}` denotes the second value of the chunk coordinate, in decimal format, left-padded with zeros until it is 5 digits long
  - If the coordinate value's decimal representation is already 5 or more digits long, ignore the padding term

Template expressions match the regular expression

```regex
\{((\*|-?\d+)(:0(\d+))?)\}
```

For each term, the matched groups are

- 1: the whole term within the braces
- 2: the index or asterisk
- 3: the whole formatting configuration
- 4: the number of digits to left-pad the value up to

Outside of braces, the template string:

- MUST NOT begin with `/`, but MAY contain it elsewhere
- MUST NOT contain the substrings `..`, `\`, `\0`, or `//`
- MUST NOT contain the substring `zarr.json`

The template string MUST contain at least one braced template expression.

## Serialisation

### Object: Template Chunk Key Encoding

| field | requirement level | type | description |
| - | - | - | - |
| name | MUST | literal string `"template"` | |
| configuration | MUST | [Configuration](object-generic-chunk-key-encoding-configuration) | |

### Object: Template Chunk Key Encoding Configuration

| field | requirement level | type | description |
| - | - | - | - |
| template | MUST | string | Format string to be interpolated |
| separator | MAY | string | MUST be included if the `template` string includes the catch-all pattern `{*}` |

## Validation

A given template string may be valid only for a particular set of chunk coordinate lengths (array dimensionalities).
Providing an incongruent chunk coordinate and template string MUST result in an error.
Examples include

- The chunk coordinate length does not equal the number of template expressions, where there is no catch-all expression `{*}`
- The catch-all expression would be populated by 0 coordinate values
- A positive index is after the end of the coordinate
- A negative index is before the start of the coordinate
- Two indices, positive or negative, resolve to the same value in the chunk coordinate

## Examples

```jsonc
{
    "name": "template",
    "configuration": {
        "format": "images/{-1}/{*:04}.jpeg",
        "separator": "_"
    }
}
```

```jsonc
{
    "name": "template",
    "configuration": {
        "format": "{2}-{0}_{1}",
    }
}
```

See [examples.tsv](./examples.tsv) for a set of examples/ test cases.

## Motivation

This chunk key encoding covers the use cases for the proposed [prefix](https://github.com/zarr-developers/zarr-extensions/pull/47) and [suffix](https://github.com/zarr-developers/zarr-extensions/pull/28) chunk key encodings.
It is also flexible enough to cover the core [default](https://zarr-specs.readthedocs.io/en/latest/v3/chunk-key-encodings/default/index.html) and [v2](https://zarr-specs.readthedocs.io/en/latest/v3/chunk-key-encodings/v2/index.html) chunk key encodings.

It also brings the possibility of accessing legacy arrays stored as stacks of images (e.g. [as used by CATMAID](https://catmaid.readthedocs.io/en/stable/tile_sources.html#directory-based-image-stack)) directly through zarr.
