# Optional Codec

## Abstract

The optional codec is a meta-codec that enables or disables an encapsulated sequence of other codecs on a per-chunk basis. It achieves this by wrapping a user-defined list of codecs in its configuration and prepending a bitfield header to the byte stream of each chunk. Each bit in the header corresponds to a codec in the encapsulated list, indicating whether it should be applied or skipped. This allows for dynamic, data-dependent optimization of the codec pipeline, such as disabling compression when it provides no benefit.


## Motivation and Scope

The optional codec introduces dynamic, data-dependent, per-chunk optimization to the Zarr v3 codec pipeline. While the Zarr specification allows for a flexible pipeline, the chosen sequence of codecs is static and applies to all chunks in an array. The optional codec addresses this limitation by allowing an implementation to enable or disable specific codecs for each chunk individually. This unlocks several powerful strategies for optimizing storage space, performance, and data processing workflows.

The scope of this codec is to provide the mechanism for conditional application. The codec itself does not implement the decision-making logic (i.e., the heuristics for when to skip a codec). That responsibility lies with the Zarr library or the application writing the data.

### Primary Motivation: Optimizing Storage by Preventing Compression Inflation

The most direct motivation is to handle cases where compression is counterproductive. Compression algorithms can sometimes produce output that is larger than the input, a phenomenon known as compression inflation. This often occurs with:

* Data that is noisy or random, containing no discernible patterns to exploit.
* Data that has already been compressed by another algorithm.
* Chunks that are very small, where the compressor's header overhead outweighs any savings.

Without the optional codec, writers are forced to either accept this storage penalty or disable compression for the entire array. The optional codec provides a standard, elegant solution: the writing application can perform a trial compression on a chunk, and if inflation occurs, it can store the chunk uncompressed by simply setting a bit in the optional codec's header. This ensures that each chunk occupies the minimum possible space.

### Advanced Optimization: Balancing Storage Space vs. Performance
Modern applications often face a trade-off between compression speed and compression ratio. Some codecs are extremely fast but offer modest compression (e.g., lz4), while others are slower but achieve higher compression ratios (e.g., zstd at high levels).

The optional codec allows an implementation to make this trade-off on a per-chunk basis. For example, a pipeline could be configured with both a fast and a slow compressor. The application could then apply heuristics based on the data's content or user requirements:

For performance-critical applications, it could default to a fast compressor and only engage a slower, stronger one on chunks that are identified as highly compressible.

For archival purposes, it could try multiple pre-filters (like shuffle) and compressors, selecting the combination that yields the smallest size for that specific chunk.

This allows a single Zarr array to contain a mix of chunks optimized for different priorities, without compromising the integrity of the dataset as a single logical entity.

### Enabling Modern Workflows: Incremental and Adaptive Processing
The optional codec enables powerful, multi-stage data processing workflows. A key use case is the "write-fast, compress-later" pattern, which is common in high-throughput environments like scientific experiments or data logging.

* Fast Ingest: Data can be written to a Zarr array as quickly as possible, with computationally expensive codecs like compression disabled via the optional codec's bitmask. This minimizes write latency and keeps up with the data source.

*  Re-compression: Later, a separate, offline process can read each chunk, analyze its content, and rewrite it in place with an optimal compression strategy. This operation only involves updating the chunk data and its corresponding bitmask header; the array's global metadata in zarr.json remains unchanged.

This avoids the need for creating separate "raw" and "processed" versions of a dataset, saving storage and reducing data management complexity. It allows an array to be efficiently created and then gradually optimized over time.

###  Enabling Advanced I/O Patterns with Sharding

The optional codec, when combined with the sharding codec, unlocks high-performance I/O patterns that are otherwise difficult to achieve, specifically parallel writes within a single shard.

The key mechanism is the optional codec's ability to enforce **a predictable upper bound on the size of any encoded chunk** . By configuring the decision logic to skip compression when it would inflate the data, the maximum possible size for any chunk's byte representation becomes the size of the uncompressed chunk data.

This enables a sharded store to be designed with fixed-size "slots." Each chunk within the shard is allocated a padded space equal to this upper bound. The exact byte offset of any chunk within the shard file can be calculated directly: offset = chunk_index_in_shard * uncompressed_chunk_size

This has a profound impact on write performance:

* Independent Chunk Modification: Since each chunk resides in a known, non-overlapping slot, it can be overwritten without affecting any other chunk in the shard. The entire shard file does not need to be read and rewritten.
* Parallel I/O Within a Shard: With predictable offsets, multiple threads or processes can issue concurrent write operations to different chunks within the same shard file using overlapped I/O.

This transforms a shard from a monolithic object that must be written sequentially into a parallel-access container. It significantly boosts write throughput in high-performance computing (HPC) and other concurrent data processing environments where multiple workers need to write to the same dataset simultaneously.

#### Shard Compaction as a Post-Processing Step
While this padded shard layout is highly optimized for parallel writes, it can result in a larger file size due to the unused space in each slot. To optimize for long-term storage and read performance, a shard compaction process can be run offline. This subsequent step would read each chunk from its fixed-size slot in the original "write-optimized" shard and write them sequentially into a new, smaller shard file with no padding. The shard's index file would be updated to reflect the new, variable offsets of each chunk in the compacted file. This two-phase approach allows for an extremely high-performance ingest followed by a transition to a space-efficient, read-optimized storage layout, all without altering the logical structure of the Zarr array.

## Usage and Impact

The `optional` codec allows for the creation of Zarr arrays that are more efficient and flexible by making storage decisions on a per-chunk basis. For the user, reading data is completely transparent, while writing data unlocks powerful new optimization strategies.

This section demonstrates how a user would use this feature and the benefits it provides. The examples use a `zarr-python`-style pseudo-code for illustration.

---

### Example 1: Preventing Compression Inflation

The most common problem the `optional` codec solves is preventing a compressed chunk from being larger than its original data. Without this feature, the user has to choose between compressing all chunks or no chunks. With the `optional` codec, the Zarr library can make the optimal choice every time.

#### Configuration (`zarr.json`)

First, the user would configure an array to use the `optional` codec wrapping the desired compressor.

```json
"codecs": [
    { "name": "bytes", "configuration": { "endian": "little" } },
    {
        "name": "optional",
        "configuration": {
            "codecs": [
                { "name": "shuffle", "configuration": { "element_size": 4 } },
                { "name": "zstd", "configuration": { "level": 5 } }
            ]
        }
    }
]
```

### Write-Time Logic

When writing, the Zarr library can now perform a trial compression to see if it's worthwhile.

```python
import zarr
import numpy as np
from my_zarr_lib.codecs import OptionalCodec, Shuffle, Zstd # Assuming codec classes

# 1. Define the decision logic as a function.
def decide_based_on_size(chunk_index, codec, unencoded_chunk, trial_encoded_chunk):
    """Returns True to apply the codec, False to skip it."""
    if codec.name == 'shuffle':
        return True # Always apply shuffle
    return len(trial_encoded_chunk) < len(unencoded_chunk)

# 2. Instantiate the OptionalCodec with its complete configuration.
# This includes the serializable part and the runtime logic.
optional_codec = OptionalCodec(
    # Serializable configuration
    configuration={
        "codecs": [
            {"name": "shuffle", "configuration": {"element_size": 4}},
            {"name": "zstd", "configuration": {"level": 5}}
        ]
    },
    # Runtime configuration
    decision_function=decide_based_on_size,
    trial_encode=True
)

# 3. Create the array, passing the live codec object.
z = zarr.create(
    shape=(10000, 10000),
    chunks=(1000, 1000),
    dtype='f4',
    codecs=[
        Bytes(endian='little'),
        optional_codec, # Pass the fully configured object
        Crc32c()
    ]
)

# 4. Write data as usual.
# The `optional_codec` instance now contains all the logic it needs.
z[0:1000, 0:1000] = np.random.rand(1000, 1000).astype('f4')
```

#### Benefit to the User
The user's datasets become smaller, automatically. The user no longer has to worry that the choice of compressor will bloat the storage when encountering noisy or random data. The optional codec provides a standardized way for libraries to ensure every single chunk is stored in its most space-efficient form.

---

### Example 2: "Write-Fast, Compress-Later" Workflows
In high-throughput scenarios like instrument capture or live simulations, data must be written as fast as possible. Expensive compression can cause data to be dropped. The optional codec allows for ingesting data quickly and then optimizing it for storage later, without changing the array's metadata.

#### Phase 1: Fast Ingest
Chunks can be written with compression explicitly disabled by providing a mask parameter to the writer.

```python=
### Example 2: "Write-Fast, Compress-Later" Workflows

This workflow is ideal for high-throughput applications where write speed is critical. The user can first ingest data with expensive codecs disabled, and then re-open the array later with different runtime settings to optimize it for long-term storage.

#### Phase 1: Fast Ingest

For the initial data capture, the user instantiates the `OptionalCodec` with a decision function that simply disables all nested codecs, ensuring maximum write speed.

```python
import zarr
import numpy as np
from my_zarr_lib.codecs import OptionalCodec, Bytes, Crc32c

# 1. Define a decision function that always returns False.
def disable_all_codecs(chunk_index, codec, unencoded_chunk):
    """A simple function that disables every codec it's called with."""
    return False

# 2. Instantiate the OptionalCodec for fast ingestion.
# trial_encode is False because the decision doesn't depend on the encoded result.
ingest_codec = OptionalCodec(
    configuration={
        "codecs": [
            {"name": "shuffle", "configuration": {"element_size": 4}},
            {"name": "zstd", "configuration": {"level": 5}}
        ]
    },
    decision_function=disable_all_codecs,
    trial_encode=False
)

# 3. Create the array with the ingest-configured codec.
z = zarr.create(
    shape=(10000, 10000),
    chunks=(1000, 1000),
    dtype='f4',
    codecs=[Bytes(endian='little'), ingest_codec, Crc32c()]
)

# 4. All write operations will now be extremely fast.
# The library will call disable_all_codecs() for both shuffle and zstd,
# which returns False. The chunks are written uncompressed (after byteswap).
for data_batch in real_time_data_stream:
    z.append(data_batch)
```

#### Phase 2: Offline Optimization

After data acquisition is complete, the user can run a separate process. They re-open the array, but this time they instantiate the OptionalCodec with the optimizing logic from Example 1.

```python=
# 1. Define the optimizing decision function (re-used from Example 1).
def decide_based_on_size(chunk_index, codec, unencoded_chunk, trial_encoded_chunk):
    """Enables codecs only if they save space."""
    if codec.name == 'shuffle':
        return True # Always apply shuffle
    return len(trial_encoded_chunk) < len(unencoded_chunk)

# 2. Instantiate a NEW OptionalCodec for optimization.
# Note that trial_encode is now True.
optimizing_codec = OptionalCodec(
    configuration={
        "codecs": [
            {"name": "shuffle", "configuration": {"element_size": 4}},
            {"name": "zstd", "configuration": {"level": 5}}
        ]
    },
    decision_function=decide_based_on_size,
    trial_encode=True
)

# 3. Re-open the array in read-write mode, passing the NEW codec instance.
# The library uses this new object for all subsequent write operations.
z = zarr.open(
    'my_data.zarr',
    'r+',
    codecs=[Bytes(endian='little'), optimizing_codec, Crc32c()]
)

# 4. Iterate over chunks and rewrite them in place.
# For each chunk, the library will now call decide_based_on_size(),
# applying shuffle and zstd only when beneficial.
for chunk_slice in z.iter_chunk_slices():
    z[chunk_slice] = z[chunk_slice]
```

#### Benefit to the User
The codec pipeline becomes a dynamic aspect of the workflow, not just static metadata. Users can adapt the behavior of an array to suit different tasks (fast ingest vs. archival) without ever creating a second copy of the data. This significantly simplifies data management for complex, multi-stage processing pipelines.

---

### Example 3: Using Pre-computed Optimization Plans

In some workflows, the optimal codec strategy for each chunk might be determined by a complex, offline analysis of the entire dataset. For instance, a user might calculate the entropy of each chunk and store these decisions in an array. The `chunk_index` parameter allows the `decision_function` to use these pre-computed results during the final write process.

#### Phase 1: Offline Analysis and Mask Generation

Before writing the Zarr array, the user runs a separate process to create an "optimization plan." This plan is an array of bitmasks, with the same shape as the Zarr array's chunk grid.

```python
import numpy as np

# Assume we have a function that analyzes raw data and returns an optimal bitmask.
# The options are:
# - 0b00: Store raw (skip shuffle and zstd).
# - 0b11: Apply both shuffle and zstd.
def analyze_chunk_for_optimal_codecs(raw_chunk_data):
    # ... complex analysis logic ...
    # If the chunk has high entropy or is otherwise uncompressible, store it raw.
    if has_high_entropy(raw_chunk_data):
        return 0b00
    # Otherwise, apply the full shuffle + compress pipeline.
    else:
        return 0b11

# Pre-compute the bitmasks for a 10x10 chunk grid.
# The result is a NumPy array holding the decision for each chunk.
precomputed_bitmasks = np.empty((10, 10), dtype=np.uint8)
for i in range(10):
    for j in range(10):
        raw_chunk = read_raw_data_for_chunk(i, j)
        precomputed_bitmasks[i, j] = analyze_chunk_for_optimal_codecs(raw_chunk)
```

#### Phase 2: Writing the Zarr Array
When writing the Zarr data, the user provides a decision function that simply looks up the result from the precomputed_bitmasks array.

```pyrhon=
import zarr
from my_zarr_lib.codecs import OptionalCodec, Bytes

# 1. Define the decision logic as a lookup function.
# The library provides both chunk_index (a tuple) and codec_index (an integer).
def apply_precomputed_mask(chunk_index, codec_index, codec, unencoded_chunk):
    """Looks up the decision from the pre-computed array."""
    # Get the integer mask for the entire chunk.
    mask_for_chunk = precomputed_bitmasks[chunk_index]
    
    # Check if the bit for the current codec_index is set.
    is_enabled = (mask_for_chunk >> codec_index) & 1
    
    return bool(is_enabled)

# 2. Instantiate the OptionalCodec with the lookup function.
# No trial encoding is needed, making this step very fast.
lookup_codec = OptionalCodec(
    configuration={
        "codecs": [
            {"name": "shuffle", "configuration": {"element_size": 4}},
            {"name": "zstd", "configuration": {"level": 5}}
        ]
    },
    decision_function=apply_precomputed_mask,
    trial_encode=False
)

# 3. Create the array and write data as usual.
z = zarr.create(
    shape=(10000, 10000),
    chunks=(1000, 1000),
    codecs=[Bytes(), lookup_codec]
)

# The library now calls apply_precomputed_mask for each chunk and codec,
# efficiently applying the predetermined optimization plan.
for i in range(10):
    for j in range(10):
        chunk_slice = np.s_[i*1000:(i+1)*1000, j*1000:(j+1)*1000]
        z[chunk_slice] = read_raw_data_for_chunk(i, j)
```

### Benefit to the User

This pattern decouples complex analysis from the Zarr write process. It allows users to employ sophisticated, time-intensive algorithms to determine the best storage strategy without slowing down the final data writing step. It also ensures that the storage layout is perfectly reproducible, as the optimization plan can be saved and version-controlled alongside the source data.

## Backward Compatability

## Detailed Description

The `optional` codec is a meta-codec that conditionally applies an encapsulated sequence of other codecs on a per-chunk basis. It achieves this by prepending a bitmask header to the byte stream of each chunk, where each bit signals whether a specific codec in its configured list should be applied or skipped.

---

### Codec Configuration

The `configuration` object for the `optional` codec contains the following parameters:

* **`codecs`** (list, required): A list of Zarr v3 codec configuration objects. These are the codecs that will be conditionally applied.
* **`header_bits`** (integer, optional): An integer specifying the total number of bits to reserve for the header's bitmask.
    * This value **must** be a multiple of 8.
    * If not provided, it defaults to the smallest multiple of 8 that is greater than or equal to the number of configured codecs. The default is calculated as `ceil(len(codecs) / 8) * 8`.
    * The provided value **must** be greater than or equal to `len(codecs)`. This allows for future expansion of the codec pipeline without requiring a rewrite of existing chunks.

The on-disk size of the header is always `header_bits / 8` bytes.

---

### Encoding Process

When encoding a chunk, the `optional` codec performs the following steps:

1.  **Construct the Bitmask**: The writing application determines which of the nested codecs to apply. Based on this decision, a bitmask of `header_bits` length is constructed.
    * Bit `0` of the mask corresponds to the first codec in the `codecs` list, bit `1` to the second, and so on (using a little-endian bit order).
    * If a bit is set to **`1`**, the corresponding codec **is applied** during encoding.
    * If a bit is set to **`0`**, the corresponding codec **is skipped**.
    * Any reserved bits (i.e., from index `len(codecs)` up to `header_bits - 1`) **must** be set to `0`.

2.  **Apply Codecs**: The codec internally processes the input byte stream by iterating through its `codecs` list. For each codec, it checks the corresponding bit in the mask and either applies the codec's `encode` method or passes the data through unchanged.

3.  **Prepend Header**: The final bitmask is written as a sequence of `header_bits / 8` bytes and prepended to the processed byte stream.

4.  **Output**: The resulting `header + data` byte stream is passed to the next codec in the main pipeline.

---

### Decoding Process

When decoding a chunk, the `optional` codec reverses the process:

1.  **Read Header**: The codec first reads the header from the start of the byte stream. The header size is known from its configuration (`header_bits / 8` bytes).

2.  **Parse Bitmask**: The header bytes are parsed into a bitmask.

3.  **Apply Codecs**: The codec internally processes the *rest* of the byte stream. It iterates through its `codecs` list **in reverse order**. For each codec, it checks the corresponding bit in the mask to determine whether to apply that codec's `decode` method or to pass the data through unchanged.

4.  **Output**: The fully decoded byte stream is passed to the previous codec in the main pipeline. This logic ensures that chunks written with older metadata (and thus fewer codecs) can be correctly read by newer applications, as the `0` in the reserved bit positions safely signals that the new codecs should be skipped.

## Related Work

The concept of a conditional or dynamic data processing pipeline is not new. The `optional` codec is directly inspired by proven features in other data storage systems, most notably HDF5, and shares conceptual similarities with adaptive encoding schemes in columnar data formats and compression libraries.

---

### HDF5 Filter Pipeline and Optional Filters

The most direct inspiration for this codec is the **HDF5 filter pipeline**. HDF5 allows filters (the equivalent of Zarr codecs) to be marked as optional. When a chunk is written, a 32-bit "filter mask" is stored in the chunk's header. Each bit in this mask corresponds to a filter in the pipeline, indicating whether that filter was successfully applied or skipped for that specific chunk.

This mechanism is formally enabled by the `H5Z_FLAG_OPTIONAL` flag when a filter is registered. It is most famously used by the Blosc HDF5 filter to implement the "compress if smaller" heuristic. If Blosc determines that its output would be larger than its input, it instructs the HDF5 library to skip the filter, and the corresponding bit in the filter mask is set.

The proposed `optional` codec is essentially a formal, self-contained implementation of this HDF5 feature within the Zarr v3 codec framework. It generalizes the concept by encapsulating the conditional logic into a dedicated meta-codec rather than relying on flags in each individual codec.

---

### Adaptive Encoding in Columnar Data Formats

Modern columnar data formats like **Apache Parquet** and **Apache ORC** employ sophisticated, data-driven encoding strategies to maximize storage efficiency. When writing a column chunk or data page, these systems analyze the data's statistical properties (e.g., cardinality, ordering, data distribution) and automatically select the most effective encoding scheme from a rich set of options.

Commonly used schemes include:
* **Run-Length Encoding (RLE)** for sequences of repeated values.
* **Dictionary Encoding** for columns with low cardinality.
* **Delta Encoding** for sequences of monotonically increasing numbers (like timestamps).

While the mechanism is different (automatic selection from a pre-defined set vs. a user-defined conditional pipeline), the underlying principle is identical: **the final binary representation of the data is adapted on a per-block basis to best suit the content of that block**. The `optional` codec brings this powerful principle of data-dependent encoding to Zarr's more general-purpose and user-configurable pipeline.

---

### The Blosc Compression Library

The **Blosc library** itself is a multi-stage compression meta-codec, typically combining a pre-filter like `shuffle` or `bitshuffle` with a fast compression algorithm like `LZ4` or `Zstd`. A core feature of the high-level `blosc_compress` function is its internal logic to avoid compression inflation. If the final compressed buffer is not smaller than the original, the library will return the original, uncompressed data with a special header indicating its state.

The `optional` codec externalizes and generalizes this concept. Instead of this logic being a hard-coded, internal feature of a specific compression library, the `optional` codec allows the user to apply this "is it worthwhile?" check to *any* codec or sequence of codecs in the Zarr ecosystem.

---

### Transparent Filesystem Compression

Filesystems like **ZFS** and **Btrfs** support transparent, block-level compression. To avoid wasting CPU cycles, these systems often employ simple heuristics to detect incompressible data. For example, a filesystem might check if the first few kilobytes of a block show any reduction in size after compression. If not, it will abort the process and write the block uncompressed. This is a system-level application of the same fundamental principle: applying expensive data transformations only when they are beneficial.

## Implementation

The implementation separates the core codec mechanics from the higher-level, writer-side decision logic. The core codec operates on a bitmask, while the library's writer is responsible for invoking a user-provided **decision function** to generate that mask for each chunk.

---

### Phase 1: Core Codec Logic (Required)

This foundational step describes the behavior of the `optional` codec itself. The core codec is agnostic as to how its bitmask is generated.

1.  **Define the Codec's State**: A runtime representation of the `optional` codec must manage two pieces of configuration:
    * **Serialized Configuration**: Parsed from `zarr.json` upon initialization (the `codecs` list and `header_bits`).
    * **Runtime Bitmask**: An integer bitmask that dictates the behavior for a single encoding operation. The implementation must provide a mechanism to set this bitmask. If no mask is set before encoding, it **must** default to all `0`s (skip all nested codecs).

2.  **Implement the Decoding Procedure**: The decoding logic is stateless. For a given input of encoded bytes, the procedure must:
    * Read the header from the start of the byte stream, with its size determined by `header_bits`.
    * Parse the header bytes into a bitmask.
    * Process the rest of the byte stream by iterating through the nested `codecs` list **in reverse order**. The decoding procedure for each nested codec is applied only if the corresponding bit in the *header's bitmask* is `1`.

3.  **Implement the Encoding Procedure**: The encoding logic uses the codec's currently configured **runtime bitmask**. For a given input of unencoded bytes, the procedure must:
    * Process the input bytes by iterating through the nested `codecs` list. The encoding procedure for each nested codec is applied only if the corresponding bit in the *runtime bitmask* is `1`.
    * Prepend a header to the processed data. The header is the byte representation of the *runtime bitmask*.

*This phase provides a complete, testable codec. Its behavior is controlled by setting the runtime bitmask before each encoding operation.*

---

### Phase 2: Writer-Side Automation (Required)

This phase describes how a Zarr library should integrate the `optional` codec to automate the creation of the runtime bitmask based on a user-defined decision function.

1.  **Associate Decision Logic with an Array**: When a user creates or opens an array for writing, the library must allow a **decision function** and a **trial encoding flag** (`True`/`False`) to be associated with that array's runtime configuration.

2.  **Define the Decision Function Signature**: The library will invoke this function once for each nested codec. The function must accept the chunk context and return a boolean (`True` to apply the codec, `False` to skip). The signature will vary based on the trial encoding flag:
    * Without trial encoding: `decision_function(chunk_index, codec, unencoded_chunk) -> bool`
    * With trial encoding: `decision_function(chunk_index, codec, unencoded_chunk, trial_encoded_chunk) -> bool`

3.  **Implement the Write Path**: When a chunk is written, the library's top-level writing procedure must:
    * Check if an `optional` codec is in the pipeline.
    * If so, initialize an integer bitmask to `0`.
    * Iterate through the `optional` codec's nested codecs by index `i`. For each nested `codec`:
        * If trial encoding is enabled, perform an in-memory trial encode of the original, unencoded chunk using the current nested `codec`.
        * Call the user's decision function with the appropriate arguments.
        * If the function returns `True`, set the corresponding bit in the bitmask: `mask |= 1 << i`.
    * Set the final, computed bitmask as the **runtime bitmask** on the `optional` codec instance.
    * Proceed with the standard encoding pipeline.

*This phase is dependent on Phase 1 and provides the primary mechanism for users to define dynamic, data-dependent behavior.*

---

### Phase 3: Built-in Heuristics (Recommended)

To simplify common use cases, libraries should provide pre-packaged decision functions that can be selected by name.

1.  **Implement Standard Heuristics**: The library should include a set of standard decision functions. A critical one is `'compress_if_smaller'`, which requires trial encoding and implements the logic: `len(trial_encoded_chunk) < len(unencoded_chunk)`. Other simple heuristics could include `'always_apply'` and `'never_apply'`.

2.  **Provide a Selection Mechanism**: During array creation, the user should be able to select a built-in heuristic using a simple string keyword (e.g., `optional_decision='compress_if_smaller'`), which the library maps to the corresponding decision function and trial encoding setting.

*This phase is dependent on Phase 2 and greatly improves the feature's usability for the most common scenarios.*

## Alternatives

### Multiple Arrays
The primary alternative is for a user to create multiple Zarr arrays with different codec pipelines and write chunks to the appropriate array. This is inflexible, difficult to manage, and prevents transparent access to the dataset as a single logical array.

### A More Complex Choice Codec
One could design a codec that takes a list of full codec pipelines as its configuration and chooses one to apply. The optional codec is a simpler, special case of this, where the choices for each slot are limited to [codec] or []. The simplicity of the optional codec is a major advantage for the most common use cases.

## Discussion

While this proposal focuses on a bytes-to-bytes implementation, the concept could be extended. An array-to-array version could conditionally apply transformations like transpose or bitround based on array properties. However, the mechanism for passing the "mask" metadata between array-to-array codecs is less straightforward than prepending bytes and would require further specification. The bytes-to-bytes version is the most urgent and addresses the key use case of optimizing compression.

## References and Footnotes

1.  **HDF5 Specification**: The HDF5 File Format Specification, "Filter Pipeline Message". This section describes the data filter pipeline and associated flags. [https://support.hdfgroup.org/documentation/hdf5/latest/_f_m_t3.html#FiltMsg](https://support.hdfgroup.org/documentation/hdf5/latest/_f_m_t3.html#FiltMsg)

2.  **Apache Parquet Documentation**: "Encodings". This page describes the various data-dependent encoding schemes used in Parquet. [https://parquet.apache.org/docs/file-format/data-pages/encodings/](https://parquet.apache.org/docs/file-format/data-pages/encodings/)

3.  **Apache ORC Documentation**: "ORC File Format - Encodings". This page details the encoding options available in the ORC format. [https://orc.apache.org/specification/ORCv2/](https://orc.apache.org/specification/ORCv2/)

4.  **Blosc Library**: The official website for the Blosc high-performance compressor. [https://www.blosc.org/](https://www.blosc.org/)

5.  **OpenZFS Documentation**: "Properties - compression". This section describes the behavior of transparent compression in ZFS. [https://openzfs.github.io/openzfs-docs/Performance%20and%20Tuning/Workload%20Tuning.html#compression](https://openzfs.github.io/openzfs-docs/Performance%20and%20Tuning/Workload%20Tuning.html#compression)

6.  **Btrfs Wiki**: "Compression". This page explains the transparent compression feature in the Btrfs filesystem. [https://btrfs.wiki.kernel.org/index.php/Compression](https://btrfs.wiki.kernel.org/index.php/Compression)

7.  **Zarr Enhancement Proposal 2 (ZEP0002)**: "Sharding Codec". This is the formal specification for the Zarr v3 sharding codec. [https://zarr.dev/zeps/accepted/ZEP0002.html](https://zarr.dev/zeps/accepted/ZEP0002.html)

## Copyright

This document is placed in the public domain or under the CC0-1.0-Universal license, whichever is more permissive.

## Current Maintainers

* Mark Kittisopikul (@mkitti), Janelia Research Campus, Howard Hughes Medical Institute
