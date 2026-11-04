# lzw codec

Defines a `bytes -> bytes` codec that applies [LZW (Lempel-Ziv-Welch) compression](https://ieeexplore.ieee.org/document/1659158).

## Codec name

The value of the `name` member in the codec object MUST be `lzw`.

## Configuration parameters

None

## Example

For example, the array metadata below specifies that the array is compressed using the LZW method:

```json
{
    "codecs": [{
        "name": "lzw"
    }]
}
```

## Format and algorithm

This is a `bytes -> bytes` codec.

Encoding and decoding is performed using the algorithm defined in [Welch, "A Technique for High-Performance Data Compression," in Computer, vol. 17, no. 6, pp. 8-19, June 1984, doi: 10.1109/MC.1984.1659158](https://ieeexplore.ieee.org/document/1659158)

## Change log

No changes yet.

## Current maintainers

* [@cgohlke](https://github.com/cgohlke) in [imagecodecs](https://github.com/cgohlke/imagecodecs)
