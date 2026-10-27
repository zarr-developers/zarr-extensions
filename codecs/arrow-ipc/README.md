# Arrow IPC Codec

Defines and `array -> bytes` that serializes arrays into the [Arrow IPC format](https://arrow.apache.org/docs/format/IPC.html).
This codec can be used in place of the standard `Bytes` codec with any data type which can be safely interpreted as an [Arrow Data Type](https://arrow.apache.org/docs/python/api/datatypes.html).

## Codec name

The value of the `name` member in the codec object MUST be `arrow-ipc`.

## Configuration parameters

- `column_name`: the name of column used for generating an Arrow record batch from the Zarr array data. Implementations SHOULD use the name of the Zarr array here.

## Example

```json
{
    "codecs": [{
        "name": "arrow-ipc",
        "configuration": {"column_name": "temperature"}
    }],
}
```

## Format and algorithm

This is a `array -> bytes` codec.

The codec encodes each Zarr chunk as a standalone Arrow IPC Stream containing a single Record Batch with a single Column.

The encoding process is as follows. For each chunk input array:

1. Flatten the array to a 1D array using C ordering.
1. Interpret the 1D array as an Arrow Array.
1. Wrap the Arrow Array in an Arrow Table with a single column, using the `column_name` configuration parameter to define the name of the column.
1. Write the Arrow Table to an in-memory buffer as an Arrow IPC Stream.

For the decoding process, this is reversed:
1. Read a the bytes as an Arrow IPC Stream, reading only a single Record Batch.
1. Extract the Arrow Array column identified by `column_name`.
1. Interpret this 1D Arrow Array as a slice of a Zarr Array using an appropriate Zarr Data Type.
1. Reshape the array according to the chunk shape assuming C ordering of the items.

## Change log

No changes yet.

## Current maintainers

* [Ryan Abernathey](https://github.com/rabernat)
