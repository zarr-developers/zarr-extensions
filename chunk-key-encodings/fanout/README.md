# Fanout chunk key encoding
Defines a chunk key encoding that converts chunk coordinates into a `/`-separated path (representing a sequence of nodes in a tree hierarchy), by splitting each coordinate into multiple nodes such that no node in the hierarchy exceeds a predefined maximum number of children. This is useful for filesystems or other hierarchical stores that experience performance issues when nodes (e.g., directories) contain many entries. The encoding also ensures lexicographical ordering of chunk keys.

## Chunk key encoding name

The value of the `name` member in the chunk key encoding object MUST be `fanout`.

## Configuration parameters

### `max_children`

* Type: integer
* Minimum: 100
* Default: 1000

This parameter defines the maximum number of child entries allowed in a single node.

* If a value smaller than 100 is provided, the implementation MUST raise an error.
* If a value that is not a power of 10 is provided, the implementation MAY floor the configuration parameter to the nearest lower power of 10.
* After initialization, the effective value of `max_children` MUST reflect the floored power-of-10 value, which MAY differ from the provided configuration:

| Provided `max_children` | Effective `max_children` |
| ----------------------- | ------------------------ |
| 250                     | 100                      |
| 1234                    | 1000                     |

## Example

For example, the array metadata below specifies that chunk keys are encoded using the `fanout` strategy with a maximum of 10000 files per directory:

```json
{
    "chunk_key_encoding": {
        "name": "fanout",
        "configuration": {
            "max_children": 10000
        }
    }
}
```

## Algorithm
Given a tuple of chunk coordinates and a `max_children` parameter, the chunk key MUST be constructed as follows:

1. Compute `decimal_len`, the number of digits in `max_children - 1` (base-10 representation).

2. For each coordinate:
    1. Split the coordinate (base-10) into chunks of `decimal_len` digits, starting from the least significant digit.
    2. Left-pad the leftmost chunk with zeros as needed so that it has exactly `decimal_len` digits.
    3. The number of chunks for each coordinate minus one (`num_chunks - 1`) must be prepended to the sequence of chunks.

    For example:
    ```
    coordinate = 1234567 (max_children=1000) =>  final_sequence = [2, 001, 234, 567]
    ```

3. Concatenate all coordinate chunk sequences in order (from the lowest to highest dimension) and prepend `"c"` as the root.

4. Join all parts using `/` as a separator.

> **Note:** This encoding ensures that no node contains more than `max_children` entries and that chunk keys are lexicographically sorted.

### Example
With `max_children = 1000` (`decimal_len = 3`):

| Coordinates                  | Chunk key                                 |
| ---------------------------- | ----------------------------------------- |
| `()`                         | `c`                                       |
| `(0)`                        | `c/0/000`                                 |
| `(12,)`                      | `c/0/012`                                 |
| `(1234, 5, 0, 6789012)`      | `c/1/001/234/0/005/0/000/2/006/789/012`   |


## Change log

No changes yet.

## Current maintainers

* Remco Leijenaar (GitHub: [RFLeijenaar](https://github.com/RFLeijenaar))