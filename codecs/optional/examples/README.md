# Optional codec example data

This directory contains example Zarr array demonstrating the use of the `optional` codec and `optional` data type.

### `array_optional.zarr`

This Zarr array uses the `optional` codec to encode an array of optional `uint8` values.

The fill value is set to `null`, representing missing elements.
The array contains the below elements (`N` marks missing values):

```text
 0  N  2  3
 N  5  N  7
 8  9  N  N
12  N  N  N
```

### `array_optional_nested.zarr`

This Zarr array demonstrates nesting of the `optional` codec/data type.
It encodes an array of optional optional `uint8` values, requiring two layers of the `optional` codec and data type.

The fill value is `[null]`, representing missing inner optional elements.
The array contains the below elements (`N` marks missing values, `SN` marks missing inner optional values):

```text
 N  SN   2   3
 N   5   N   7
SN  SN   N   N
SN  SN   N   N
```