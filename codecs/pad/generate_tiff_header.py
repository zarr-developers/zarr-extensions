import struct
import base64

def generate_and_print_tiff_header():
    """
    Constructs the 110-byte TIFF header and IFD for a 256x256 uint16,
    little-endian, single-strip image, and prints the base64 encoding.
    """
    print("Generating the 110-byte TIFF header and IFD for a 256x256 uint16, little-endian, single-strip image.")

    # 8-byte TIFF header
    # II for little-endian, version 42, IFD at offset 8
    header = b'\x49\x49\x2a\x00\x08\x00\x00\x00'

    # Image File Directory (IFD)
    ifd = b''
    # 2-byte Entry Count: 8 entries
    ifd += struct.pack('<H', 8)

    # Helper to create a 12-byte IFD entry
    def create_entry(tag, type, count, value):
        # < for little-endian, H for unsigned short (2 bytes), I for unsigned int (4 bytes)
        return struct.pack('<HHII', tag, type, count, value)

    # Create the 8 IFD entries in ascending order by tag
    ifd += create_entry(256, 3, 1, 256)      # ImageWidth (SHORT)
    ifd += create_entry(257, 3, 1, 256)      # ImageLength (SHORT)
    ifd += create_entry(258, 3, 1, 16)       # BitsPerSample (SHORT)
    ifd += create_entry(259, 3, 1, 1)        # Compression (SHORT) = 1 (None)
    ifd += create_entry(262, 3, 1, 1)        # PhotometricInterpretation (SHORT) = 1 (BlackIsZero)
    ifd += create_entry(273, 4, 1, 110)      # StripOffsets (LONG) = 110 (data starts after this prefix)
    ifd += create_entry(278, 3, 1, 256)      # RowsPerStrip (SHORT)
    ifd += create_entry(279, 4, 1, 131072)   # StripByteCounts (LONG) = 256 * 256 * 2

    # 4-byte offset to the next IFD (0 for none)
    ifd += struct.pack('<I', 0)

    # Combine header and IFD to form the full padding
    padding_bytes = header + ifd

    # Encode the padding in base64
    base64_padding = base64.b64encode(padding_bytes)

    print(f"\nTotal padding length: {len(padding_bytes)} bytes")
    print("Base64 encoded string:")
    print(base64_padding.decode('ascii'))

    print("\nVerifying the base64 string...")
    try:
        decoded_bytes = base64.b64decode(base64_padding)
        assert decoded_bytes == padding_bytes
        print("Verification successful: Decoded string matches original bytes.")
    except Exception as e:
        print(f"Verification failed: {e}")

if __name__ == "__main__":
    generate_and_print_tiff_header()