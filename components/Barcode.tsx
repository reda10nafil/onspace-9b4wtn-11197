import React, { useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

// Code 128 Patterns (B set mostly used for alphanumeric)
// Each pattern is 11 modules wide (except Stop which is 13)
// Represented as widths of bars and spaces: B S B S B S ...
const CODE128_PATTERNS: { [key: number]: string } = {
    0: '212222', 1: '222122', 2: '222221', 3: '121223', 4: '121322',
    5: '131222', 6: '122213', 7: '122312', 8: '132212', 9: '221213',
    10: '221312', 11: '231212', 12: '112232', 13: '122132', 14: '122231',
    15: '113222', 16: '123122', 17: '123221', 18: '223211', 19: '221132',
    20: '221231', 21: '213212', 22: '223112', 23: '312131', 24: '311222',
    25: '321122', 26: '321221', 27: '312212', 28: '322112', 29: '322211',
    30: '212123', 31: '212321', 32: '232121', 33: '111323', 34: '131123',
    35: '131321', 36: '112313', 37: '132113', 38: '132311', 39: '211313',
    40: '231113', 41: '231311', 42: '112133', 43: '112331', 44: '132131',
    45: '113123', 46: '113321', 47: '133121', 48: '313121', 49: '211331',
    50: '231131', 51: '213113', 52: '213311', 53: '213131', 54: '311123',
    55: '311321', 56: '331121', 57: '312113', 58: '312311', 59: '332111',
    60: '314111', 61: '221411', 62: '431111', 63: '111224', 64: '111422',
    65: '121124', 66: '121421', 67: '141122', 68: '141221', 69: '112214',
    70: '112412', 71: '122114', 72: '122411', 73: '142112', 74: '142211',
    75: '241211', 76: '221114', 77: '413111', 78: '241112', 79: '134111',
    80: '111242', 81: '121142', 82: '121241', 83: '114212', 84: '124112',
    85: '124211', 86: '411212', 87: '421112', 88: '421211', 89: '212141',
    90: '214121', 91: '412121', 92: '111143', 93: '111341', 94: '131141',
    95: '114113', 96: '114311', 97: '411113', 98: '411311', 99: '113141',
    100: '114131', 101: '311141', 102: '411131',
    103: '211412', // Start A
    104: '211214', // Start B
    105: '211232', // Start C
    106: '2331112' // Stop
};

interface BarcodeProps {
    value: string;
    width?: number;
    height?: number;
    color?: string;
    backgroundColor?: string;
    style?: ViewStyle;
}

export default function Barcode({
    value,
    width = 300,
    height = 100,
    color = '#000000',
    backgroundColor = 'transparent',
    style
}: BarcodeProps) {

    const bars = useMemo(() => {
        // Default to Code 128B implementation (good for alphanumeric)
        // 1. Start Code B (104)
        let checksum = 104;
        const encoded = [CODE128_PATTERNS[104]];

        for (let i = 0; i < value.length; i++) {
            // ASCII mapping for Code 128B: Value = ASCII - 32
            const charCode = value.charCodeAt(i);
            let code128Value = charCode - 32;

            // Sanity check
            if (code128Value < 0) code128Value = 0;
            if (code128Value > 102) code128Value = 0; // Fallback for unsupported chars

            encoded.push(CODE128_PATTERNS[code128Value]);
            checksum += code128Value * (i + 1);
        }

        // 2. Checksum
        const checksumValue = checksum % 103;
        encoded.push(CODE128_PATTERNS[checksumValue]);

        // 3. Stop Code
        encoded.push(CODE128_PATTERNS[106]);

        // Convert patterns to bars
        // Pattern "212222" means: Bar 2, Space 1, Bar 2, Space 2, Bar 2, Space 2
        const rects: React.JSX.Element[] = [];
        let x = 0;

        // Calculate total units width
        const totalUnits = encoded.reduce((acc, pattern) => {
            return acc + pattern.split('').reduce((sum, char) => sum + parseInt(char), 0);
        }, 0);

        // Module width
        const unitWidth = width / totalUnits;

        encoded.forEach((pattern) => {
            for (let j = 0; j < pattern.length; j++) {
                const barWidth = parseInt(pattern[j]) * unitWidth;

                // Even indices are Bars, Odd indices are Spaces
                if (j % 2 === 0) {
                    rects.push(
                        <Rect
                            key={`${x}-${j}`}
                            x={x}
                            y={0}
                            width={barWidth}
                            height={height}
                            fill={color}
                        />
                    );
                }
                x += barWidth;
            }
        });

        return rects;
    }, [value, width, height, color]);

    return (
        <View style={[{ width, height, backgroundColor }, style]}>
            <Svg width={width} height={height}>
                {bars}
            </Svg>
        </View>
    );
}
