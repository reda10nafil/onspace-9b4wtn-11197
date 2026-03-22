// FurInventory Pro - Dynamic Field Renderer
// Renders form fields based on layout configuration
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { theme, typography, borderRadius, spacing } from '../constants/theme';
import { LayoutField, FieldSize } from '../contexts/LayoutContext';
import { CustomField } from '../contexts/CustomFieldsContext';
import { FUR_TYPES } from '../constants/config';
import { Library } from '../contexts/InventoryContext';

type FurType = { id: string; label: string; color?: string; };

// Helper to safely format dates
const formatDateToInput = (dateStr: any) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.toLocaleDateString('it-IT');
    } catch {
        return String(dateStr);
    }
};

// Props for the renderer
interface DynamicFieldRendererProps {
    field: LayoutField;
    formData: any;
    updateField: (field: string, value: string) => void;
    // Image related
    images?: string[];
    currentImageIndex?: number;
    setCurrentImageIndex?: (index: number) => void;
    showImageSourcePicker?: () => void;
    removeImage?: (index: number) => void;
    imageWidth?: number;
    // Location/Folder/FurType selectors
    locations?: { id: string; name: string }[];
    libraries?: Library[];
    // Custom fields
    customField?: CustomField;
    customFieldValues?: Record<string, any>;
    setCustomFieldValues?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

// Size to flex style mapping
const SIZE_FLEX: Record<FieldSize, number | string> = {
    'small': 0.32,
    'medium': 0.48,
    'full': 1,
};

export function DynamicFieldRenderer({
    field,
    formData,
    updateField,
    images = [],
    currentImageIndex = 0,
    setCurrentImageIndex,
    showImageSourcePicker,
    removeImage,
    imageWidth = 300,
    locations = [],
    libraries = [],
    customField,
    customFieldValues = {},
    setCustomFieldValues,
}: DynamicFieldRendererProps) {
    const [showDatePickerMap, setShowDatePickerMap] = useState<{ [key: string]: boolean }>({});

    const getContainerStyle = () => {
        if (field.size === 'full') {
            return styles.fieldContainerFull;
        }
        return {
            ...styles.fieldContainer,
            flex: Number(SIZE_FLEX[field.size]),
        };
    };

    // Render based on field ID
    switch (field.id) {
        case 'images':
            return (
                <View style={styles.fieldContainerFull}>
                    <Text style={styles.sectionTitle}>FOTO PRODOTTO ({images.length}/10)</Text>
                    {images.length > 0 && (
                        <View style={styles.mainImageContainer}>
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onScroll={(event) => {
                                    const index = Math.round(event.nativeEvent.contentOffset.x / imageWidth);
                                    setCurrentImageIndex?.(Math.min(index, images.length - 1));
                                }}
                                scrollEventThrottle={16}
                            >
                                {images.map((uri, index) => (
                                    <View key={index} style={styles.mainImageWrapper}>
                                        <Image
                                            source={{ uri }}
                                            style={[styles.mainImage, { width: imageWidth }]}
                                            contentFit="cover"
                                        />
                                        <Pressable
                                            style={styles.removeMainImageButton}
                                            onPress={() => removeImage?.(index)}
                                        >
                                            <MaterialIcons name="delete" size={20} color="#FFF" />
                                        </Pressable>
                                    </View>
                                ))}
                            </ScrollView>
                            {images.length > 1 && (
                                <View style={styles.dotsContainer}>
                                    {images.map((_, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.dotIndicator,
                                                index === currentImageIndex && styles.dotIndicatorActive,
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                    <View style={styles.thumbnailRow}>
                        {images.map((uri, index) => (
                            <Pressable
                                key={index}
                                style={styles.imageContainer}
                                onPress={() => setCurrentImageIndex?.(index)}
                            >
                                <Image
                                    source={{ uri }}
                                    style={[
                                        styles.imageThumb,
                                        index === currentImageIndex && styles.imageThumbActive,
                                    ]}
                                    contentFit="cover"
                                />
                            </Pressable>
                        ))}
                        {images.length < 10 && (
                            <Pressable style={styles.addImageButton} onPress={showImageSourcePicker}>
                                <MaterialIcons name="add-a-photo" size={28} color={theme.primary} />
                            </Pressable>
                        )}
                    </View>
                </View>
            );

        case 'sku':
            return (
                <View style={getContainerStyle()}>
                    <Text style={styles.label}>SKU / Codice</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="FUR-2024-001"
                        placeholderTextColor={theme.textSecondary}
                        value={formData.sku}
                        onChangeText={(value) => updateField('sku', value)}
                    />
                </View>
            );

        case 'furType':
            return (
                <View style={styles.fieldContainerFull}>
                    <Text style={styles.label}>Tipo di Pelle *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chipContainer}>
                            {FUR_TYPES.map((type: FurType) => (
                                <Pressable
                                    key={type.id}
                                    style={[
                                        styles.chip,
                                        formData.furType === type.id && styles.chipActive,
                                    ]}
                                    onPress={() => updateField('furType', type.id)}
                                >
                                    <View style={[styles.chipDot, { backgroundColor: type.color }]} />
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.furType === type.id && styles.chipTextActive,
                                        ]}
                                    >
                                        {type.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            );

        case 'location':
            return (
                <View style={getContainerStyle()}>
                    <Text style={styles.label}>Posizione *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chipContainer}>
                            {locations.map((loc) => (
                                <Pressable
                                    key={loc.id}
                                    style={[
                                        styles.chip,
                                        formData.location === loc.id && styles.chipActive,
                                    ]}
                                    onPress={() => updateField('location', loc.id)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.location === loc.id && styles.chipTextActive,
                                        ]}
                                    >
                                        {loc.name}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            );

        case 'folder':
            return (
                <View style={getContainerStyle()}>
                    <Text style={styles.label}>Cartella</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chipContainer}>
                            <Pressable
                                style={[
                                    styles.chip,
                                    !formData.libraryId && styles.chipActive,
                                ]}
                                onPress={() => updateField('libraryId', '')}
                            >
                                <Text style={[styles.chipText, !formData.libraryId && styles.chipTextActive]}>
                                    Nessuna
                                </Text>
                            </Pressable>
                            {libraries.map((lib) => (
                                <Pressable
                                    key={lib.id}
                                    style={[
                                        styles.chip,
                                        formData.libraryId === lib.id && styles.chipActive,
                                    ]}
                                    onPress={() => updateField('libraryId', lib.id)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.libraryId === lib.id && styles.chipTextActive,
                                        ]}
                                    >
                                        {lib.name}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            );

        case 'purchasePrice':
            return (
                <View style={getContainerStyle()}>
                    <Text style={styles.label}>Prezzo Acquisto (€)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        value={formData.purchasePrice}
                        onChangeText={(value) => updateField('purchasePrice', value)}
                    />
                </View>
            );

        case 'sellPrice':
            return (
                <View style={getContainerStyle()}>
                    <Text style={styles.label}>Prezzo Vendita (€)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        value={formData.sellPrice}
                        onChangeText={(value) => updateField('sellPrice', value)}
                    />
                </View>
            );

        case 'length':
            return (
                <View style={getContainerStyle()}>
                    <Text style={styles.label}>Lunghezza (cm)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="85"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        value={formData.length}
                        onChangeText={(value) => updateField('length', value)}
                    />
                </View>
            );

        case 'width':
            return (
                <View style={getContainerStyle()}>
                    <Text style={styles.label}>Larghezza (cm)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="120"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        value={formData.width}
                        onChangeText={(value) => updateField('width', value)}
                    />
                </View>
            );

        case 'weight':
            return (
                <View style={getContainerStyle()}>
                    <Text style={styles.label}>Peso (kg)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="1.2"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        value={formData.weight}
                        onChangeText={(value) => updateField('weight', value)}
                    />
                </View>
            );

        case 'technicalNotes':
            return (
                <View style={styles.fieldContainerFull}>
                    <Text style={styles.label}>Note Tecniche</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Inserisci dettagli tecnici..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={formData.technicalNotes}
                        onChangeText={(value) => updateField('technicalNotes', value)}
                    />
                </View>
            );

        default:
            // Custom field rendering
            if (field.type === 'custom' && customField && setCustomFieldValues) {
                return (
                    <View style={getContainerStyle()}>
                        <Text style={styles.label}>
                            {customField.name}
                            {customField.required && ' *'}
                            {customField.unit && ` (${customField.unit})`}
                        </Text>
                        {(customField.type === 'text_short' || customField.type === 'number' || customField.type === 'currency') && (
                            <TextInput
                                style={styles.input}
                                placeholder={`Inserisci ${customField.name.toLowerCase()}`}
                                placeholderTextColor={theme.textSecondary}
                                keyboardType={customField.type === 'number' || customField.type === 'currency' ? 'numeric' : 'default'}
                                value={customFieldValues[field.id]?.toString() || ''}
                                onChangeText={(value) => setCustomFieldValues(prev => ({ ...prev, [field.id]: value }))}
                            />
                        )}
                        {customField.type === 'text_long' && (
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder={`Inserisci ${customField.name.toLowerCase()}`}
                                placeholderTextColor={theme.textSecondary}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                value={customFieldValues[field.id] || ''}
                                onChangeText={(value) => setCustomFieldValues(prev => ({ ...prev, [field.id]: value }))}
                            />
                        )}
                        {customField.type === 'single_choice' && customField.options && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.chipContainer}>
                                    {customField.options.map((option) => (
                                        <Pressable
                                            key={option.id}
                                            style={[
                                                styles.chip,
                                                customFieldValues[field.id] === option.id && styles.chipActive,
                                            ]}
                                            onPress={() => setCustomFieldValues(prev => ({ ...prev, [field.id]: option.id }))}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    customFieldValues[field.id] === option.id && styles.chipTextActive,
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </ScrollView>
                        )}
                        {customField.type === 'multi_choice' && customField.options && (
                            <View style={styles.chipContainer}>
                                {customField.options.map((option) => {
                                    const selected = (customFieldValues[field.id] || []).includes(option.id);
                                    return (
                                        <Pressable
                                            key={option.id}
                                            style={[styles.chip, selected && styles.chipActive]}
                                            onPress={() => {
                                                const current = customFieldValues[field.id] || [];
                                                const updated = selected
                                                    ? current.filter((id: string) => id !== option.id)
                                                    : [...current, option.id];
                                                setCustomFieldValues(prev => ({ ...prev, [field.id]: updated }));
                                            }}
                                        >
                                            <MaterialIcons
                                                name={selected ? 'check-box' : 'check-box-outline-blank'}
                                                size={16}
                                                color={selected ? theme.primary : theme.textSecondary}
                                            />
                                            <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                                                {option.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                        {customField.type === 'single_choice' && customField.uiType === 'picker' && customField.options && (
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={customFieldValues[field.id] || customField.options[0]?.id}
                                    onValueChange={(itemValue) => setCustomFieldValues(prev => ({ ...prev, [field.id]: itemValue }))}
                                    style={styles.picker}
                                >
                                    {customField.options.map((option) => (
                                        <Picker.Item key={option.id} label={option.label} value={option.id} />
                                    ))}
                                </Picker>
                            </View>
                        )}
                        {customField.type === 'date' && (
                            <View>
                                <Pressable
                                    style={[styles.input, { justifyContent: 'center' }]}
                                    onPress={() => setShowDatePickerMap(prev => ({ ...prev, [field.id]: true }))}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={{ color: customFieldValues[field.id] ? theme.textPrimary : theme.textSecondary }}>
                                            {customFieldValues[field.id] ? formatDateToInput(customFieldValues[field.id]) : `Seleziona ${customField.name.toLowerCase()}`}
                                        </Text>
                                        <MaterialIcons name="calendar-today" size={20} color={theme.textSecondary} />
                                    </View>
                                </Pressable>
                                {showDatePickerMap[field.id] && (
                                    <DateTimePicker
                                        value={customFieldValues[field.id] ? new Date(customFieldValues[field.id]) : new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, selectedDate) => {
                                            setShowDatePickerMap(prev => ({ ...prev, [field.id]: false }));
                                            if (selectedDate) {
                                                setCustomFieldValues(prev => ({ ...prev, [field.id]: selectedDate.toISOString() }));
                                            }
                                        }}
                                    />
                                )}
                            </View>
                        )}
                        {customField.type === 'document' && (
                            <View style={styles.documentContainer}>
                                {customFieldValues[field.id] && Array.isArray(customFieldValues[field.id]) && customFieldValues[field.id].map((docUri: string, index: number) => (
                                    <View key={index} style={styles.documentItem}>
                                        <MaterialIcons name="insert-drive-file" size={24} color={theme.primary} />
                                        <Text style={styles.documentName} numberOfLines={1}>{docUri.split('/').pop() || 'Documento Allegato'}</Text>
                                        <Pressable onPress={() => {
                                            const newDocs = [...customFieldValues[field.id]];
                                            newDocs.splice(index, 1);
                                            setCustomFieldValues(prev => ({ ...prev, [field.id]: newDocs }));
                                        }}>
                                            <MaterialIcons name="delete" size={24} color={theme.error} />
                                        </Pressable>
                                    </View>
                                ))}
                                <Pressable
                                    style={styles.uploadButton}
                                    onPress={async () => {
                                        try {
                                            const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
                                            if (!result.canceled && result.assets && result.assets.length > 0) {
                                                const newDoc = result.assets[0].uri;
                                                const currentDocs = customFieldValues[field.id] || [];
                                                setCustomFieldValues(prev => ({ ...prev, [field.id]: [...currentDocs, newDoc] }));
                                            }
                                        } catch (e) { console.error('Doc Picker err', e); }
                                    }}
                                >
                                    <MaterialIcons name="upload-file" size={20} color={theme.primary} />
                                    <Text style={styles.uploadButtonText}>Allega File / PDF</Text>
                                </Pressable>
                            </View>
                        )}
                        {customField.type === 'images' && (
                            <View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                    {customFieldValues[field.id] && Array.isArray(customFieldValues[field.id]) && customFieldValues[field.id].map((imgUri: string, index: number) => (
                                        <View key={index} style={styles.customImageWrapper}>
                                            <Image source={{ uri: imgUri }} style={styles.customFieldImage} contentFit="cover" />
                                            <Pressable style={styles.customImageDelete} onPress={() => {
                                                const newImgs = [...customFieldValues[field.id]];
                                                newImgs.splice(index, 1);
                                                setCustomFieldValues(prev => ({ ...prev, [field.id]: newImgs }));
                                            }}>
                                                <MaterialIcons name="cancel" size={20} color="#FFF" />
                                            </Pressable>
                                        </View>
                                    ))}
                                </ScrollView>
                                <Pressable
                                    style={styles.uploadButton}
                                    onPress={async () => {
                                        try {
                                            const result = await ImagePicker.launchImageLibraryAsync({
                                                mediaTypes: ['images'],
                                                allowsMultipleSelection: true,
                                                quality: 0.8,
                                            });
                                            if (!result.canceled && result.assets && result.assets.length > 0) {
                                                const newImages = result.assets.map(a => a.uri);
                                                const currentImages = customFieldValues[field.id] || [];
                                                setCustomFieldValues(prev => ({ ...prev, [field.id]: [...currentImages, ...newImages] }));
                                            }
                                        } catch (e) { console.error('Image Picker err', e); }
                                    }}
                                >
                                    <MaterialIcons name="add-photo-alternate" size={20} color={theme.primary} />
                                    <Text style={styles.uploadButtonText}>Aggiungi Foto</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                );
            }
            return null;
    }
}

const styles = StyleSheet.create({
    fieldContainer: {
        marginBottom: 16,
        minWidth: 100,
    },
    fieldContainerFull: {
        width: '100%',
        marginBottom: 16,
    },
    sectionTitle: {
        ...typography.sectionHeader,
        fontSize: 12,
        marginBottom: 12,
    },
    label: {
        ...typography.caption,
        fontSize: 13,
        marginBottom: 8,
        color: theme.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: theme.surface,
        borderRadius: borderRadius.medium,
        padding: 14,
        fontSize: 16,
        color: theme.textPrimary,
        borderWidth: 1,
        borderColor: theme.border,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: theme.surface,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: theme.border,
        gap: 6,
    },
    chipActive: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    chipDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    chipText: {
        ...typography.caption,
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    chipTextActive: {
        color: '#000',
    },
    mainImageContainer: {
        marginBottom: 12,
        borderRadius: borderRadius.large,
        overflow: 'hidden',
        backgroundColor: theme.surface,
    },
    mainImageWrapper: {
        position: 'relative',
    },
    mainImage: {
        height: 200,
        backgroundColor: theme.surface,
    },
    removeMainImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        borderRadius: 16,
        padding: 6,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 6,
    },
    dotIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.textSecondary,
    },
    dotIndicatorActive: {
        backgroundColor: theme.primary,
        width: 18,
    },
    thumbnailRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    imageContainer: {
        marginBottom: 8,
    },
    imageThumb: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.medium,
        backgroundColor: theme.surface,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    imageThumbActive: {
        borderColor: theme.primary,
    },
    addImageButton: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.medium,
        backgroundColor: theme.surface,
        borderWidth: 2,
        borderColor: theme.border,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerContainer: {
        backgroundColor: theme.backgroundSecondary,
        borderRadius: borderRadius.small,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        backgroundColor: 'transparent',
    },
    documentContainer: {
        gap: 8,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface,
        padding: 12,
        borderRadius: borderRadius.medium,
        borderWidth: 1,
        borderColor: theme.border,
        gap: 12,
    },
    documentName: {
        ...typography.body,
        fontSize: 14,
        flex: 1,
        color: theme.textPrimary,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${theme.primary}15`,
        padding: 14,
        borderRadius: borderRadius.medium,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.primary,
        gap: 8,
        marginTop: 4,
    },
    uploadButtonText: {
        ...typography.buttonPrimary,
        color: theme.primary,
        fontSize: 14,
    },
    customImageWrapper: {
        position: 'relative',
        marginRight: 10,
        borderRadius: borderRadius.medium,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border,
    },
    customFieldImage: {
        width: 100,
        height: 100,
        backgroundColor: theme.backgroundSecondary,
    },
    customImageDelete: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        padding: 4,
    },
});

export default DynamicFieldRenderer;
