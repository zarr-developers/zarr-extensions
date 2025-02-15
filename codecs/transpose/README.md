# Transpose codec

Defines an `array -> array` codec that permutes the dimensions of the chunk
array.


## Status of this document

This codec was accepted as part of ZEP0001 on May 15th, 2023 via https://github.com/zarr-developers/zarr-specs/issues/227.


## Codec name

The value of the `name` member in the codec object MUST be `transpose`.

## Configuration parameters

### `order`
Must be an array of integers specifying a permutation of `0`, `1`, ...,
`n-1`, where `n` is the number of dimensions in the decoded chunk
representation provided as input to this codec.

## Format and algorithm

This is an `array -> array` codec.

Given a chunk array `A` with shape `A_shape` as the decoded representation,
the encoded representation is an array `B` with the same data type as `A`
and shape `B_shape`, where:

- `B_shape[i] = A_shape[order[i]]` for all dimension indices `i`, and
- `B[B_pos] = A[A_pos]`, where `B_pos[i] = A_pos[order[i]]`, for all chunk
  positions `A_pos` and dimension indices `i`.

Note, implementations of this codec may simply construct a virtual view that
represents the transposed result, and avoid physically transposing the
in-memory representation when possible.

## Change log

* The `order` configuration parameter no longer supports the constants `"C"`
  or `"F"` and must instead always be specified as an explicit permutation.

## Current maintainers

* Zarr core development team
