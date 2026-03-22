// FurInventory Pro - Add Product Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, useWindowDimensions, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ActionSheetIOS } from 'react-native';
import { Image } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme, typography, borderRadius, spacing, shadows } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';
import { FUR_TYPES } from '../../constants/config';
import { useLocations } from '../../contexts/LocationsContext';
import { useCustomFields, FIELD_TYPE_INFO, CustomField } from '../../contexts/CustomFieldsContext';
import { useLayout, LayoutField } from '../../contexts/LayoutContext';

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addProduct, products, libraries } = useInventory();
  const { locations } = useLocations();
  const { customFields } = useCustomFields();
  const { layout, getVisibleFields, loading: layoutLoading } = useLayout();

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [showDatePickerMap, setShowDatePickerMap] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    sku: '',
    furType: '',
    location: '',
    purchasePrice: '',
    sellPrice: '',
    length: '',
    width: '',
    weight: '',
    technicalNotes: '',
    libraryId: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const imageWidth = Math.max(1, screenWidth - 32);

  // Auto-generate SKU if empty
  const generateSKU = (): string => {
    const year = new Date().getFullYear();
    const existingSKUs = products
      .map((p) => p.sku)
      .filter((sku) => sku.startsWith(`FUR-${year}-`));

    let nextNumber = 1;
    if (existingSKUs.length > 0) {
      const numbers = existingSKUs.map((sku) => {
        const match = sku.match(/FUR-\d{4}-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
      nextNumber = Math.max(...numbers) + 1;
    }

    return `FUR-${year}-${String(nextNumber).padStart(3, '0')}`;
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const showImageSourcePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annulla', 'Galleria Foto', 'Scatta Foto', 'Sfoglia File'],
          cancelButtonIndex: 0,
          title: 'Seleziona Origine Immagine',
          message: 'Scegli da dove importare le immagini',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickImages();
          else if (buttonIndex === 2) takePhoto();
          else if (buttonIndex === 3) pickFromFiles();
        }
      );
    } else {
      // Android - use Alert as ActionSheet
      Alert.alert(
        'Seleziona Origine Immagine',
        'Scegli da dove importare le immagini',
        [
          { text: 'Galleria Foto', onPress: pickImages },
          { text: 'Scatta Foto', onPress: takePhoto },
          { text: 'Sfoglia File', onPress: pickFromFiles },
          { text: 'Annulla', style: 'cancel' },
        ]
      );
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso Negato', 'Abilita accesso alla galleria nelle impostazioni');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - images.length,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...newImages].slice(0, 10));
    }
  };

  const pickFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages((prev) => [...prev, ...newImages].slice(0, 10));
      }
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert('Errore', 'Impossibile selezionare i file');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso Negato', 'Abilita accesso alla fotocamera nelle impostazioni');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const pickDocument = async (fieldId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const file = result.assets[0];
        setCustomFieldValues(prev => ({ ...prev, [fieldId]: file.name })); // Store name or URI based on preference
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Errore', 'Impossibile selezionare il documento');
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectModalConfig, setSelectModalConfig] = useState<{ fieldId: string; name: string; options: any[]; isMulti: boolean } | null>(null);

  const handleSubmit = () => {
    if (isSubmitting) return;

    if (!formData.sku || !formData.furType || !formData.location) {
      Alert.alert('Campi Obbligatori', 'Compila almeno SKU, Tipo di Pelle e Posizione');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Attenzione', 'Aggiungi almeno una foto del prodotto', [
        { text: 'Continua Senza Foto', onPress: () => submitProduct() },
        { text: 'Aggiungi Foto', style: 'cancel' },
      ]);
      return;
    }

    submitProduct();
  };

  const submitProduct = async () => {
    setIsSubmitting(true);
    try {
      const finalSKU = formData.sku.trim() || generateSKU();

      addProduct({
        sku: finalSKU,
        furType: formData.furType,
        location: formData.location,
        status: 'available',
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop'],
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        sellPrice: formData.sellPrice ? parseFloat(formData.sellPrice) : undefined,
        length: formData.length ? parseFloat(formData.length) : undefined,
        width: formData.width ? parseFloat(formData.width) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        technicalNotes: formData.technicalNotes || undefined,
        libraryId: formData.libraryId || undefined,
        customData: Object.keys(customFieldValues)
          .map(fieldId => {
            const field = customFields.find(f => f.id === fieldId);
            return field ? { value: customFieldValues[fieldId], fieldSnapshot: field } : null;
          }).filter(Boolean) as any,
      });

      // Small delay to prevent double tapping and allow UI update
      await new Promise(resolve => setTimeout(resolve, 500));

      Alert.alert(
        'Prodotto Aggiunto',
        `${formData.sku || finalSKU} Ã¨ stato aggiunto all'inventario`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                sku: '',
                furType: '',
                location: '',
                purchasePrice: '',
                sellPrice: '',
                length: '',
                width: '',
                weight: '',
                technicalNotes: '',
                libraryId: '',
              });
              setImages([]);
              setIsSubmitting(false);
              router.push('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert('Errore', 'Si Ã¨ verificato un errore durante il salvataggio');
    }
  };

  // Size to flex style mapping for dynamic fields
  const getSizeStyle = (size: 'small' | 'medium' | 'full') => {
    switch (size) {
      case 'small': return { width: '30%' as const }; // ~1/3 minus gap (16px)
      case 'medium': return { width: '47%' as const }; // ~1/2 minus gap (16px)
      case 'full': return { width: '100%' as const };
    }
  };

  // Map location IDs to display objects
  const locationOptions = locations.map(loc => ({
    id: loc.id,
    label: loc.label,
    color: loc.color,
  }));

  // Render a dynamic field based on LayoutContext configuration
  const renderDynamicField = (field: LayoutField) => {
    const sizeStyle = getSizeStyle(field.size);

    // Section Header
    if (field.type === 'section') {
      return (
        <View key={field.id} style={{ width: '100%', marginTop: 24, marginBottom: 8 }}>
          <Text style={{ ...typography.overline, color: theme.textSecondary, letterSpacing: 1 }}>
            {field.label?.toUpperCase() || 'SEZIONE'}
          </Text>
          <View style={{ height: 1, backgroundColor: theme.border, marginTop: 4, opacity: 0.5 }} />
        </View>
      );
    }

    const getFieldLabel = (fId: string) => {
      const fItem = layout.fields.find(f => f.id === fId);
      if (fItem?.label) return fItem.label;
      const cf = customFields.find(c => c.id === fId);
      return cf?.name || fId;
    };

    const getFieldIcon = (fId: string) => {
      const fItem = layout.fields.find(f => f.id === fId);
      if (fItem?.icon) return fItem.icon;
      const cf = customFields.find(c => c.id === fId);
      return cf?.icon || 'tune';
    };

    // Helper to render label only (icon is now inside the field)
    const renderLabel = (labelOverride?: string, required?: boolean) => {
      const label = labelOverride || getFieldLabel(field.id);
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ ...typography.caption, fontSize: 13, fontWeight: '600', color: theme.textPrimary }}>
            {label}{required && <Text style={{ color: theme.error }}> *</Text>}
          </Text>
        </View>
      );
    };

    // Helper to render input with icon inside
    const renderInputWithIcon = (inputProps: {
      placeholder: string;
      value: string;
      onChangeText: (v: string) => void;
      keyboardType?: 'default' | 'numeric';
      multiline?: boolean;
      numberOfLines?: number;
    }) => {
      const icon = getFieldIcon(field.id);
      return (
        <View style={[styles.inputWithIcon, inputProps.multiline && { alignItems: 'flex-start', paddingTop: 14 }]}>
          <MaterialIcons name={icon as any} size={20} color={theme.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.inputInner, inputProps.multiline && styles.textAreaInner]}
            placeholder={inputProps.placeholder}
            placeholderTextColor={theme.textSecondary}
            keyboardType={inputProps.keyboardType || 'default'}
            multiline={inputProps.multiline}
            numberOfLines={inputProps.numberOfLines}
            textAlignVertical={inputProps.multiline ? 'top' : 'center'}
            value={inputProps.value}
            onChangeText={inputProps.onChangeText}
          />
        </View>
      );
    };

    // If it's a custom field
    if (field.type === 'custom') {
      const customField = customFields.find(cf => cf.id === field.id);
      if (!customField) return null;



      const getDynamicOptionsList = (cf: CustomField) => {
        if (cf.linkTo === 'locations') return locations.map(l => ({ id: l.id, label: l.label }));
        if (cf.linkTo === 'libraries') return libraries.map(l => ({ id: l.id, label: l.name }));
        if (cf.linkTo === 'furType') return FUR_TYPES.map(f => ({ id: f.id, label: f.label }));

        return cf.dataset && Array.isArray(cf.dataset)
          ? cf.dataset.map((val: string, i: number) => ({ id: `ds_${i}`, label: String(val) }))
          : cf.options || [];
      };

      // === Modals and Pickers ===
      if (customField.uiType === 'picker' || customField.uiType === 'modal_list') {
        const optionsList = getDynamicOptionsList(customField);

        const isMulti = customField.type === 'multi_choice';
        const val = customFieldValues[field.id];
        const displayValue = isMulti
          ? (val?.length ? `${val.length} selezionati` : 'Seleziona...')
          : (val || 'Seleziona...');

        return (
          <View key={field.id} style={[styles.dynamicField, sizeStyle]}>
            {renderLabel(customField.name, customField.required)}
            <Pressable
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => setSelectModalConfig({ fieldId: field.id, name: customField.name, options: optionsList, isMulti })}
            >
              <Text style={{ color: val && (!isMulti || val.length > 0) ? theme.textPrimary : theme.textSecondary, fontSize: 16 }}>
                {displayValue}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>
        );
      }

      // === Grids and Segmented ===
      if (customField.uiType === 'grid' || customField.uiType === 'segmented' || customField.type === 'single_choice' || customField.type === 'multi_choice') {
        const optionsList = getDynamicOptionsList(customField);

        return (
          <View key={field.id} style={[styles.dynamicField, { width: '100%' }]}>
            {renderLabel(customField.name, customField.required)}
            <View style={styles.quickSettingsGrid}>
              {optionsList.map((option: any) => {
                const isSingle = customField.uiType === 'grid' || customField.uiType === 'segmented' || customField.type === 'single_choice';
                const isSelected = isSingle
                  ? customFieldValues[field.id] === option.label || customFieldValues[field.id] === option.id
                  : (customFieldValues[field.id] || []).includes(option.label) || (customFieldValues[field.id] || []).includes(option.id);

                return (
                  <Pressable
                    key={option.id}
                    style={[styles.quickSettingsTile, isSelected && styles.quickSettingsTileActive]}
                    onPress={() => {
                      const valToSave = option.label || option.id; // prefer label from dataset
                      if (isSingle) {
                        setCustomFieldValues(prev => ({ ...prev, [field.id]: isSelected ? null : valToSave }));
                      } else {
                        const current = customFieldValues[field.id] || [];
                        const updated = isSelected
                          ? current.filter((v: string) => v !== valToSave && v !== option.id)
                          : [...current, valToSave];
                        setCustomFieldValues(prev => ({ ...prev, [field.id]: updated }));
                      }
                    }}
                  >
                    <View style={[styles.quickSettingsIconContainer, isSelected && styles.quickSettingsIconContainerActive]}>
                      <MaterialIcons
                        name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                        size={28}
                        color={isSelected ? '#000' : theme.textSecondary}
                      />
                    </View>
                    <Text style={[styles.quickSettingsTileText, isSelected && styles.quickSettingsTileTextActive]} numberOfLines={2}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      }

      // Get field icon precedence:
      // 1. Layout configuration (user override in Layout Builder)
      // 2. Custom Field definition (user definition in Fields)
      // 3. Type-based default
      const getCustomFieldIcon = () => {
        // Check layout override first
        const layoutField = layout.fields.find(f => f.id === field.id);
        if (layoutField?.icon) return layoutField.icon;

        // Then Custom Field definition
        if (customField.icon) return customField.icon;

        // Then Type defaults
        switch (customField.type) {
          case 'number': return 'tag';
          case 'currency': return 'euro';
          case 'date': return 'event';
          case 'text_long': return 'notes';
          default: return 'text-fields';
        }
      };

      if (customField.uiType === 'stepper') {
        const stepMap = customField.dataset || { min: 0, max: 100, step: 1 };
        const val = parseFloat(customFieldValues[field.id]) || stepMap.min;
        return (
          <View key={field.id} style={[styles.dynamicField, sizeStyle]}>
            {renderLabel(customField.name, customField.required)}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: borderRadius.medium, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
              <Pressable style={{ padding: 16, backgroundColor: `${theme.primary}10` }} onPress={() => setCustomFieldValues(prev => ({ ...prev, [field.id]: Math.max(stepMap.min, val - stepMap.step) }))}>
                <MaterialIcons name="remove" size={24} color={val <= stepMap.min ? theme.textMuted : theme.primary} />
              </Pressable>
              <Text style={{ flex: 1, textAlign: 'center', ...typography.cardTitle }}>{val}</Text>
              <Pressable style={{ padding: 16, backgroundColor: `${theme.primary}10` }} onPress={() => setCustomFieldValues(prev => ({ ...prev, [field.id]: Math.min(stepMap.max, val + stepMap.step) }))}>
                <MaterialIcons name="add" size={24} color={val >= stepMap.max ? theme.textMuted : theme.primary} />
              </Pressable>
            </View>
          </View>
        );
      }

      // === Images ===
      if (customField.type === 'images') {
        const customImages = customFieldValues[field.id] || [];
        return (
          <View key={field.id} style={[styles.dynamicField, { width: '100%' }]}>
            {renderLabel(customField.name, customField.required)}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
              {customImages.map((uri: string, index: number) => (
                <View key={index} style={{ marginRight: 8, position: 'relative' }}>
                  <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 12 }} contentFit="cover" />
                  <Pressable
                    style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 }}
                    onPress={() => {
                      const newImages = [...customImages];
                      newImages.splice(index, 1);
                      setCustomFieldValues(prev => ({ ...prev, [field.id]: newImages }));
                    }}
                  >
                    <MaterialIcons name="close" size={16} color="#FFF" />
                  </Pressable>
                </View>
              ))}
              {customImages.length < 10 && (
                <Pressable
                  style={[styles.addImageButton, { width: 80, height: 80, borderWidth: 1, borderColor: theme.border, borderRadius: 12, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }]}
                  onPress={async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsMultipleSelection: true,
                      quality: 0.8,
                    });
                    if (!result.canceled) {
                      const newUris = result.assets.map(a => a.uri);
                      setCustomFieldValues(prev => ({ ...prev, [field.id]: [...(prev[field.id] || []), ...newUris].slice(0, 10) }));
                    }
                  }}
                >
                  <MaterialIcons name="add-a-photo" size={24} color={theme.primary} />
                </Pressable>
              )}
            </ScrollView>
          </View>
        );
      }

      // === Date ===
      if (customField.type === 'date') {
        const val = customFieldValues[field.id];
        return (
          <View key={field.id} style={[styles.dynamicField, sizeStyle]}>
            {renderLabel(customField.name, customField.required)}
            <Pressable
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => setShowDatePickerMap(prev => ({ ...prev, [field.id]: true }))}
            >
              <Text style={{ color: val ? theme.textPrimary : theme.textSecondary, fontSize: 16 }}>
                {val ? new Date(val).toLocaleDateString('it-IT') : `Seleziona Data`}
              </Text>
              <MaterialIcons name="calendar-today" size={24} color={theme.textSecondary} />
            </Pressable>
            {showDatePickerMap[field.id] && (
              <DateTimePicker
                value={val ? new Date(val) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selectedDate) => {
                  setShowDatePickerMap(prev => ({ ...prev, [field.id]: false }));
                  if (selectedDate) setCustomFieldValues(prev => ({ ...prev, [field.id]: selectedDate.toISOString() }));
                }}
              />
            )}
          </View>
        );
      }

      // === Document ===
      if (customField.type === 'document') {
        const docs = customFieldValues[field.id] || [];
        return (
          <View key={field.id} style={[styles.dynamicField, { width: '100%' }]}>
            {renderLabel(customField.name, customField.required)}
            <View style={{ gap: 8 }}>
              {docs.map((docUri: string, index: number) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                  <MaterialIcons name="insert-drive-file" size={24} color={theme.primary} />
                  <Text style={{ flex: 1, marginLeft: 12, fontSize: 14, color: theme.textPrimary }} numberOfLines={1}>{docUri.split('/').pop() || 'Documento'}</Text>
                  <Pressable onPress={() => {
                    const newDocs = [...docs];
                    newDocs.splice(index, 1);
                    setCustomFieldValues(prev => ({ ...prev, [field.id]: newDocs }));
                  }}>
                    <MaterialIcons name="delete" size={24} color={theme.error} />
                  </Pressable>
                </View>
              ))}
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.primary, backgroundColor: `${theme.primary}10`, marginTop: 4 }}
                onPress={async () => {
                  try {
                    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
                    if (!result.canceled && result.assets && result.assets.length > 0) {
                      setCustomFieldValues(prev => ({ ...prev, [field.id]: [...(customFieldValues[field.id] || []), result.assets[0].uri] }));
                    }
                  } catch (e) { console.error('Doc Picker err', e); }
                }}
              >
                <MaterialIcons name="upload-file" size={20} color={theme.primary} />
                <Text style={{ marginLeft: 8, color: theme.primary, fontWeight: 'bold' }}>Allega Documento</Text>
              </Pressable>
            </View>
          </View>
        );
      }

      // === Short Text w/ Barcode Scanner ===
      if (customField.type === 'text_short' && customField.isBarcode) {
        return (
          <View key={field.id} style={[styles.dynamicField, sizeStyle]}>
            {renderLabel(customField.name, customField.required)}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={[styles.inputWithIcon, { flex: 1 }]}>
                <MaterialIcons name={getCustomFieldIcon() as any} size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder={`Scan or enter ${customField.name.toLowerCase()}`}
                  placeholderTextColor={theme.textSecondary}
                  value={customFieldValues[field.id]?.toString() || ''}
                  onChangeText={(value) => setCustomFieldValues(prev => ({ ...prev, [field.id]: value }))}
                />
              </View>
              <Pressable
                style={styles.qrButton}
                onPress={() => setCustomFieldValues(prev => ({ ...prev, [field.id]: `SCAN-${Math.floor(Math.random() * 10000)}` }))} // Simulated scanner
              >
                <MaterialIcons name="qr-code-scanner" size={24} color={theme.primary} />
              </Pressable>
            </View>
          </View>
        );
      }

      return (
        <View key={field.id} style={[styles.dynamicField, sizeStyle]}>
          {renderLabel(customField.name, customField.required)}
          <View style={[styles.inputWithIcon, customField.type === 'text_long' && { alignItems: 'flex-start', paddingTop: 14 }]}>
            <MaterialIcons name={getCustomFieldIcon() as any} size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.inputInner, customField.type === 'text_long' && styles.textAreaInner]}
              placeholder={`Inserisci ${customField.name.toLowerCase()}`}
              placeholderTextColor={theme.textSecondary}
              keyboardType={customField.type === 'number' || customField.type === 'currency' ? 'numeric' : 'default'}
              multiline={customField.type === 'text_long'}
              numberOfLines={customField.type === 'text_long' ? 3 : 1}
              textAlignVertical={customField.type === 'text_long' ? 'top' : 'center'}
              value={customFieldValues[field.id]?.toString() || ''}
              onChangeText={(value) => setCustomFieldValues(prev => ({ ...prev, [field.id]: value }))}
            />
          </View>
        </View>
      );
    }

    // Base fields
    switch (field.id) {
      case 'images':
        return (
          <View key="images" style={[styles.dynamicField, { width: '100%' }]}>
            <Text style={styles.sectionTitle}>FOTO PRODOTTO ({images.length}/10)</Text>
            {images.length > 0 && (
              <View style={styles.mainImageContainer}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / imageWidth);
                    setCurrentImageIndex(Math.min(index, images.length - 1));
                  }}
                  scrollEventThrottle={16}
                >
                  {images.map((uri, index) => (
                    <View key={index} style={styles.mainImageWrapper}>
                      <Image source={{ uri }} style={[styles.mainImage, { width: imageWidth }]} contentFit="cover" />
                      <Pressable style={styles.removeMainImageButton} onPress={() => removeImage(index)}>
                        <MaterialIcons name="delete" size={20} color="#FFF" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
                {images.length > 1 && (
                  <View style={styles.dotsContainer}>
                    {images.map((_, index) => (
                      <View key={index} style={[styles.dotIndicator, index === currentImageIndex && styles.dotIndicatorActive]} />
                    ))}
                  </View>
                )}
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {images.map((uri, index) => (
                <Pressable key={index} style={styles.imageContainer} onPress={() => setCurrentImageIndex(index)}>
                  <Image source={{ uri }} style={[styles.imageThumb, index === currentImageIndex && styles.imageThumbActive]} contentFit="cover" />
                </Pressable>
              ))}
              {images.length < 10 && (
                <Pressable style={styles.addImageButton} onPress={showImageSourcePicker}>
                  <MaterialIcons name="add-a-photo" size={32} color={theme.primary} />
                  <Text style={styles.addImageText}>Importa</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        );

      case 'sku':
        return (
          <View key="sku" style={[styles.dynamicField, sizeStyle]}>
            {renderLabel()}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={`Auto: ${generateSKU()}`}
                placeholderTextColor={theme.textSecondary}
                value={formData.sku}
                onChangeText={(value) => updateField('sku', value)}
              />
              <Pressable
                style={styles.qrButton}
                onPress={() => updateField('sku', generateSKU())}
              >
                <MaterialIcons name="qr-code-2" size={24} color={theme.primary} />
              </Pressable>
            </View>
            {!formData.sku && (
              <Text style={styles.helperText}>
                💡 Generato automaticamente se vuoto
              </Text>
            )}
          </View>
        );

      case 'furType':
        return (
          <View key="furType" style={[styles.dynamicField, { width: '100%' }]}>
            {renderLabel(undefined, true)}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {FUR_TYPES.map((type) => (
                  <Pressable
                    key={type.id}
                    style={[styles.chip, formData.furType === type.id && styles.chipActive]}
                    onPress={() => updateField('furType', type.id)}
                  >
                    <Text style={[styles.chipText, formData.furType === type.id && styles.chipTextActive]}>{type.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        );

      case 'location':
        return (
          <View key="location" style={[styles.dynamicField, sizeStyle]}>
            {renderLabel(undefined, true)}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {locationOptions.map((loc) => (
                  <Pressable
                    key={loc.id}
                    style={[styles.chip, formData.location === loc.id && styles.chipActive]}
                    onPress={() => updateField('location', loc.id)}
                  >
                    <View style={[styles.chipDot, { backgroundColor: loc.color }]} />
                    <Text style={[styles.chipText, formData.location === loc.id && styles.chipTextActive]}>{loc.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        );

      case 'folder':
        return (
          <View key="folder" style={[styles.dynamicField, sizeStyle]}>
            {renderLabel()}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {libraries.length === 0 ? (
                  <Text style={{ ...typography.caption, color: theme.textSecondary, fontStyle: 'italic' }}>Nessuna cartella</Text>
                ) : (
                  libraries.map((lib) => (
                    <Pressable
                      key={lib.id}
                      style={[styles.chip, formData.libraryId === lib.id && styles.chipActive]}
                      onPress={() => updateField('libraryId', formData.libraryId === lib.id ? '' : lib.id)}
                    >
                      <MaterialIcons name={lib.icon as any} size={16} color={formData.libraryId === lib.id ? '#000' : theme.textSecondary} />
                      <Text style={[styles.chipText, formData.libraryId === lib.id && styles.chipTextActive]}>{lib.name}</Text>
                    </Pressable>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        );

      case 'purchasePrice':
        return (
          <View key="purchasePrice" style={[styles.dynamicField, sizeStyle]}>
            {renderLabel()}
            {renderInputWithIcon({
              placeholder: '€ 2500',
              value: formData.purchasePrice,
              onChangeText: (value) => updateField('purchasePrice', value),
              keyboardType: 'numeric',
            })}
          </View>
        );

      case 'sellPrice':
        return (
          <View key="sellPrice" style={[styles.dynamicField, sizeStyle]}>
            {renderLabel()}
            {renderInputWithIcon({
              placeholder: '€ 4200',
              value: formData.sellPrice,
              onChangeText: (value) => updateField('sellPrice', value),
              keyboardType: 'numeric',
            })}
          </View>
        );

      case 'length':
        return (
          <View key="length" style={[styles.dynamicField, sizeStyle]}>
            {renderLabel()}
            {renderInputWithIcon({
              placeholder: '85 cm',
              value: formData.length,
              onChangeText: (value) => updateField('length', value),
              keyboardType: 'numeric',
            })}
          </View>
        );

      case 'width':
        return (
          <View key="width" style={[styles.dynamicField, sizeStyle]}>
            {renderLabel()}
            {renderInputWithIcon({
              placeholder: '120 cm',
              value: formData.width,
              onChangeText: (value) => updateField('width', value),
              keyboardType: 'numeric',
            })}
          </View>
        );

      case 'weight':
        return (
          <View key="weight" style={[styles.dynamicField, sizeStyle]}>
            {renderLabel()}
            {renderInputWithIcon({
              placeholder: '1.2 kg',
              value: formData.weight,
              onChangeText: (value) => updateField('weight', value),
              keyboardType: 'numeric',
            })}
          </View>
        );

      case 'technicalNotes':
        return (
          <View key="technicalNotes" style={[styles.dynamicField, { width: '100%' }]}>
            {renderLabel()}
            {renderInputWithIcon({
              placeholder: 'Inserisci dettagli tecnici...',
              value: formData.technicalNotes,
              onChangeText: (value) => updateField('technicalNotes', value),
              multiline: true,
              numberOfLines: 4,
            })}
          </View>
        );

      default:
        return null;
    }
  };

  // Get visible fields from layout
  const visibleFields = getVisibleFields();

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.screenPadding,
            paddingBottom: insets.bottom + 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Aggiungi Prodotto</Text>
            <MaterialIcons name="add-photo-alternate" size={32} color={theme.primary} />
          </View>

          {/* Dynamic Form Fields - Rendered based on Layout Configuration */}
          <View style={styles.dynamicFieldsRow}>
            {visibleFields.map(renderDynamicField)}
          </View>

          {/* Submit Button */}
          <Pressable
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <MaterialIcons name="check-circle" size={24} color={isSubmitting ? theme.textSecondary : "#000"} />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Salvataggio...' : "Aggiungi all'Inventario"}
            </Text>
          </Pressable>

          <Text style={styles.footNote}>
            * Campi obbligatori: Tipo di Pelle, Posizione (SKU auto-generato se vuoto)
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Select Modal */}
      {selectModalConfig && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setSelectModalConfig(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ ...typography.h3 }}>{selectModalConfig.name}</Text>
                <Pressable onPress={() => setSelectModalConfig(null)}>
                  <MaterialIcons name="close" size={24} color={theme.textPrimary} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectModalConfig.options.map(opt => {
                  const valToSave = opt.label || opt.id;
                  const isSelected = selectModalConfig.isMulti
                    ? (customFieldValues[selectModalConfig.fieldId] || []).includes(valToSave)
                    : customFieldValues[selectModalConfig.fieldId] === valToSave;

                  return (
                    <Pressable
                      key={opt.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border
                      }}
                      onPress={() => {
                        if (selectModalConfig.isMulti) {
                          const current = customFieldValues[selectModalConfig.fieldId] || [];
                          const updated = isSelected
                            ? current.filter((v: string) => v !== valToSave)
                            : [...current, valToSave];
                          setCustomFieldValues(prev => ({ ...prev, [selectModalConfig.fieldId]: updated }));
                        } else {
                          setCustomFieldValues(prev => ({ ...prev, [selectModalConfig.fieldId]: isSelected ? null : valToSave }));
                          setSelectModalConfig(null);
                        }
                      }}
                    >
                      <Text style={{ fontSize: 16, color: isSelected ? theme.primary : theme.textPrimary, fontWeight: isSelected ? '600' : '400' }}>
                        {opt.label}
                      </Text>
                      {isSelected && <MaterialIcons name="check" size={24} color={theme.primary} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
              {selectModalConfig.isMulti && (
                <Pressable
                  style={{ backgroundColor: theme.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 }}
                  onPress={() => setSelectModalConfig(null)}
                >
                  <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>Conferma Selezione</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboardView: {
    flex: 1,
  },
  dynamicField: {
    // marginBottom removed, handled by gap
  },
  dynamicFieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16, // Increased gap to replace marginBottom
    marginBottom: 24,
  },
  qrButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerTitle: {
    ...typography.cardTitle,
    fontSize: 24,
  },
  sectionTitle: {
    ...typography.sectionHeader,
    marginTop: 24,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
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
    height: 100,
    paddingTop: 14,
  },
  // Input with icon inside
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.textPrimary,
  },
  textAreaInner: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
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
    color: '#000000',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  thirdWidth: {
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    borderRadius: borderRadius.medium,
    padding: 16,
    marginTop: 24,
  },
  submitButtonText: {
    ...typography.buttonPrimary,
    fontSize: 16,
  },
  submitButtonDisabled: {
    backgroundColor: theme.border,
    opacity: 0.7,
  },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  generateButton: {
    height: 50,
    width: 50,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  footNote: {
    ...typography.caption,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  mainImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  mainImageWrapper: {
    position: 'relative',
  },
  mainImage: {
    height: 280,
    borderRadius: borderRadius.large,
    backgroundColor: theme.surface,
  },
  removeMainImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.medium,
  },
  imageIndicatorText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotIndicatorActive: {
    backgroundColor: theme.primary,
    width: 24,
  },
  imagesScroll: {
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.medium,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageThumbActive: {
    borderColor: theme.primary,
  },
  helperText: {
    ...typography.caption,
    fontSize: 12,
    marginTop: -8,
    color: theme.primary,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.medium,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addImageText: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 4,
    color: theme.primary,
  },
  // Quick Settings Style - Custom Fields
  quickSettingsContainer: {
    marginBottom: 16,
  },
  quickSettingsGroup: {
    marginBottom: 20,
  },
  quickSettingsLabel: {
    ...typography.sectionHeader,
    fontSize: 13,
    marginBottom: 12,
    color: theme.textSecondary,
  },
  quickSettingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickSettingsTile: {
    width: '30%',
    minWidth: 100,
    aspectRatio: 1,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.large,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickSettingsTileActive: {
    backgroundColor: `${theme.primary}25`,
    borderColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  quickSettingsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickSettingsIconContainerActive: {
    backgroundColor: theme.primary,
  },
  quickSettingsTileText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    textAlign: 'center',
  },
  quickSettingsTileTextActive: {
    color: theme.primary,
  },
  quickSettingsInputCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 16,
    marginBottom: 12,
  },
  quickSettingsInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  quickSettingsInputIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: `${theme.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSettingsInputLabel: {
    ...typography.cardTitle,
    fontSize: 14,
    flex: 1,
  },
  unitBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unitBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  quickSettingsInput: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: borderRadius.medium,
    padding: 14,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  quickSettingsTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
