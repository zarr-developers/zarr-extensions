# Fanout chunk key encoding
Defines a chunk key encoding that converts chunk coordinates into a `/`-separated path (representing a sequence of nodes in a tree hierarchy), by splitting each coordinate into multiple nodes such that no node in the hierarchy exceeds a predefined maximum number of children (i.e., fanout). This is useful for filesystems or other hierarchical stores that experience performance issues when nodes (e.g., directories) contain many entries.

## Chunk key encoding name

The value of the `name` member in the chunk key encoding object MUST be `fanout`.

## Configuration parameters

### `max_children`

An integer greater than 3 indicating the maximum number of child entries allowed within a single node (e.g., directory). Defaults to 1001 if omitted.

## Example

For example, the array metadata below specifies that chunk keys are encoded using the `fanout` strategy with a maximum of 1001 files per directory:

```json
{
    "chunk_key_encoding": {
        "name": "fanout",
        "configuration": {
            "max_children": 1001
        }
    }
}
````

## Algorithm
Given chunk coordinates as a tuple of integers and a parameter `max_children`, the chunk key is constructed as follows:

1. For each coordinate `coord` at dimension index `dim` (indexing starts from `0`):

   1. Create a dimension marker `d{dim}`.
   2. Express `coord` in base `max_children - 1`, producing a sequence of digits (most significant first).
   3. Join the digits with `/` and prepend the dimension marker to form a subpath. For example:

      ```
      d{dim}/{digit0}/{digit1}/…/{digitN}
      ```

2. Concatenate all dimension subpaths (in order from the lowest to highest dimension) using `/` as a separator.

3. Append `"/c"` at the end to indicate the chunk file itself.

> **Note:** Because nodes may also contain reserved entries such as the dimensional markers `dN` and the final chunk marker `c`, the effective numeric base used to subdivide coordinates is `max_children - 1`.

> **Note:** This method ensures that no directory contains more than `max_children` child entries. Existing chunks never need to be moved or reorganized to maintain this property when new chunks are added.

### Example
With `max_children = 101` (effective base = 100):

| Coordinates        | Chunk key                    |
| ------------------ | ---------------------------- |
| `()`               | `c`                          |
| `(123,)`           | `d0/1/23/c`                  |
| `(1234, 5, 67890)` | `d0/12/34/d1/5/d2/6/78/90/c` |

## Change log

No changes yet.

## Current maintainers

* Remco Leijenaar (GitHub: [RFLeijenaar](https://github.com/RFLeijenaar))