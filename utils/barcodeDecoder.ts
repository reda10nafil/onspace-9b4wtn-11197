/**
 * Enhanced Barcode/QR Code Decoder for React Native
 * Uses external APIs with optimized image preprocessing
 */

import * as ImageManipulator from 'expo-image-manipulator';

export interface BarcodeDecodeResult {
    success: boolean;
    data?: string;
    source?: 'qrserver' | 'zxing';
    error?: string;
}

/**
 * Preprocesses image with multiple variations for better detection
 */
async function createImageVariations(imageUri: string): Promise<string[]> {
    console.log('🎨 [Preprocessing] Creating optimized image variations...');

    const variations: string[] = [];

    try {
        // Variation 1: Large, high quality PNG (best for detailed barcodes)
        const highQuality = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 2000 } }],
            {
                compress: 1.0,
                format: ImageManipulator.SaveFormat.PNG
            }
        );
        variations.push(highQuality.uri);
        console.log('✅ Created variation 1: High quality PNG');

        // Variation 2: Medium size, good compression (balanced)
        const balanced = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 1200 } }],
            { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        variations.push(balanced.uri);
        console.log('✅ Created variation 2: Balanced JPEG');

        // Variation 3: Smaller, optimized for API limits
        const compact = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 800 } }],
            { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
        );
        variations.push(compact.uri);
        console.log('✅ Created variation 3: Compact');

    } catch (error) {
        console.error('❌ [Preprocessing] Error creating variations:', error);
        variations.push(imageUri); // Fallback to original
    }

    return variations;
}

/**
 * Try QRServer.com API (good for QR codes and some barcodes)
 */
async function tryQRServer(imageUri: string): Promise<BarcodeDecodeResult | null> {
    try {
        console.log('📡 [QRServer] Sending request...');

        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'barcode.jpg',
        } as any);

        const response = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        console.log('📥 [QRServer] Response received');

        if (data?.[0]?.symbol?.[0]?.data) {
            const result = data[0].symbol[0].data;
            console.log(`🎉 [QRServer] SUCCESS: ${result}`);
            return { success: true, data: result, source: 'qrserver' };
        }

        console.log('⚠️  [QRServer] No code found in response');
        return null;
    } catch (error) {
        console.error('❌ [QRServer] Error:', error);
        return null;
    }
}

/**
 * Try ZXing API (supports many barcode types)
 */
async function tryZXing(base64Image: string): Promise<BarcodeDecodeResult | null> {
    try {
        console.log('📡 [ZXing] Sending request...');

        // Create data URL
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        const response = await fetch('https://zxing.org/w/decode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `f=${encodeURIComponent(dataUrl)}`,
        });

        const htmlText = await response.text();
        console.log(`📥 [ZXing] Response received (${htmlText.length} chars)`);
        console.log(`📜 [ZXing] Raw HTML (first 500 chars): ${htmlText.substring(0, 500)}`);

        // Multiple parsing strategies
        const strategies = [
            // Strategy 1: Parsed Result in table
            {
                regex: /Parsed\s+Result:?[\s\S]*?<td[^>]*>(.*?)<\/td>/i,
                name: 'Parsed Result'
            },
            // Strategy 2: Raw text in <pre> tag
            {
                regex: /Raw\s+text:?[\s\S]*?<pre[^>]*>(.*?)<\/pre>/i,
                name: 'Raw Text'
            },
            // Strategy 3: Format followed by result
            {
                regex: /format:[\s\S]*?<td[^>]*>([A-Z0-9\-_]{3,})<\/td>/i,
                name: 'Format Result'
            },
            // Strategy 4: Any substantial alphanumeric in table cell
            {
                regex: /<td[^>]*>([A-Z0-9\-_]{5,})<\/td>/i,
                name: 'Table Cell'
            },
        ];

        for (const strategy of strategies) {
            const match = htmlText.match(strategy.regex);
            if (match && match[1]) {
                const cleanText = match[1]
                    .replace(/<[^>]+>/g, '')
                    .replace(/&[a-z]+;/gi, ' ')
                    .trim();

                if (cleanText &&
                    cleanText.length >= 3 &&
                    !cleanText.toLowerCase().includes('error') &&
                    !cleanText.toLowerCase().includes('not found') &&
                    !cleanText.toLowerCase().includes('could not')) {

                    console.log(`🎉 [ZXing] SUCCESS via ${strategy.name}: ${cleanText}`);
                    return { success: true, data: cleanText, source: 'zxing' };
                }
            }
        }

        // Check for explicit error messages
        if (htmlText.toLowerCase().includes('could not find') ||
            htmlText.toLowerCase().includes('no barcode found')) {
            console.log('⚠️  [ZXing] Explicitly reported no barcode');
        } else {
            console.log('⚠️  [ZXing] Could not parse result from HTML');
        }

        return null;
    } catch (error) {
        console.error('❌ [ZXing] Error:', error);
        return null;
    }
}

/**
 * Main decoder function with multi-version, multi-API approach
 */
export async function decodeBarcodeImage(
    base64Image: string,
    imageUri: string
): Promise<BarcodeDecodeResult> {
    console.log('🚀 [BarcodeDecoder] Starting enhanced detection process');
    console.log(`📊 Base64 length: ${base64Image.length} chars`);

    // Step 1: Create multiple optimized variations
    const variations = await createImageVariations(imageUri);
    console.log(`✅ Created ${variations.length} image variations\n`);

    // Step 2: Try each variation with both APIs
    for (let i = 0; i < variations.length; i++) {
        console.log(`\n🔄 [BarcodeDecoder] Trying variation ${i + 1}/${variations.length}`);

        // Try QRServer first (usually faster for QR)
        const qrServerResult = await tryQRServer(variations[i]);
        if (qrServerResult?.success) {
            console.log('✅ [BarcodeDecoder] Decode successful (QRServer)!');
            return qrServerResult;
        }

        // If QRServer fails, try ZXing with this variation (it supports Barcodes)
        // Need to read the file as base64 again because tryZXing needs base64 string
        // and variations[i] contains a file URI.
        try {
            const variatioBase64 = await import('expo-file-system/legacy').then(fs =>
                fs.readAsStringAsync(variations[i], { encoding: 'base64' })
            );

            const zxingResult = await tryZXing(variatioBase64);
            if (zxingResult?.success) {
                console.log('✅ [BarcodeDecoder] Decode successful (ZXing)!');
                return zxingResult;
            }
        } catch (e) {
            console.log('⚠️ Failed to read variation for ZXing', e);
        }

        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // All attempts failed
    console.log('\n❌ [BarcodeDecoder] All decode attempts failed');
    return {
        success: false,
        error: 'Non ho trovato nessun codice nell\'immagine. Suggerimenti:\n• Usa un\'immagine più chiara\n• Assicurati che il codice sia ben visibile\n• Prova la scansione diretta con la fotocamera',
    };
}
