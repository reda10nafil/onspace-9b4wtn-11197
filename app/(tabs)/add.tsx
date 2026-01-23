// FurInventory Pro - Add Product Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { theme, typography, borderRadius, spacing, shadows } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';
import { FUR_TYPES, LOCATIONS } from '../../constants/config';

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addProduct, products } = useInventory();

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
  });

  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { width: screenWidth } = Dimensions.get('window');

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

  const handleSubmit = () => {
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

  const submitProduct = () => {
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
      customFields: {},
    });

    Alert.alert(
      'Prodotto Aggiunto',
      `${formData.sku} è stato aggiunto all'inventario`,
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
            });
            setImages([]);
            router.push('/(tabs)');
          },
        },
      ]
    );
  };

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

          {/* Images Section */}
          <Text style={styles.sectionTitle}>FOTO PRODOTTO ({images.length}/10)</Text>
          
          {images.length > 0 && (
            <View style={styles.mainImageContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 32));
                  setCurrentImageIndex(Math.min(index, images.length - 1));
                }}
                scrollEventThrottle={16}
              >
                {images.map((uri, index) => (
                  <View key={index} style={styles.mainImageWrapper}>
                    <Image 
                      source={{ uri }} 
                      style={[styles.mainImage, { width: screenWidth - 32 }]} 
                      contentFit="cover" 
                    />
                    <Pressable 
                      style={styles.removeMainImageButton} 
                      onPress={() => removeImage(index)}
                    >
                      <MaterialIcons name="delete" size={20} color="#FFF" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
              
              {images.length > 1 && (
                <View style={styles.imageIndicator}>
                  <Text style={styles.imageIndicatorText}>
                    {currentImageIndex + 1} / {images.length}
                  </Text>
                </View>
              )}
              
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
            {images.map((uri, index) => (
              <Pressable 
                key={index} 
                style={styles.imageContainer}
                onPress={() => setCurrentImageIndex(index)}
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
              <>
                <Pressable style={styles.addImageButton} onPress={pickImages}>
                  <MaterialIcons name="add-photo-alternate" size={32} color={theme.primary} />
                  <Text style={styles.addImageText}>Galleria</Text>
                </Pressable>
                <Pressable style={styles.addImageButton} onPress={takePhoto}>
                  <MaterialIcons name="camera-alt" size={32} color={theme.primary} />
                  <Text style={styles.addImageText}>Fotocamera</Text>
                </Pressable>
              </>
            )}
          </ScrollView>

          {/* Form Sections */}
          <Text style={styles.sectionTitle}>INFORMAZIONI BASE *</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SKU / Codice Prodotto (opzionale - generato automaticamente)</Text>
            <TextInput
              style={styles.input}
              placeholder={`Lascia vuoto per auto-generare (es: ${generateSKU()})`}
              placeholderTextColor={theme.textSecondary}
              value={formData.sku}
              onChangeText={(value) => updateField('sku', value)}
            />
            {!formData.sku && (
              <Text style={styles.helperText}>
                💡 Verrà generato automaticamente: {generateSKU()}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo di Pelle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {FUR_TYPES.map((type) => (
                  <Pressable
                    key={type.id}
                    style={[
                      styles.chip,
                      formData.furType === type.id && styles.chipActive,
                    ]}
                    onPress={() => updateField('furType', type.id)}
                  >
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Posizione</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {LOCATIONS.map((location) => (
                  <Pressable
                    key={location.id}
                    style={[
                      styles.chip,
                      formData.location === location.id && styles.chipActive,
                    ]}
                    onPress={() => updateField('location', location.id)}
                  >
                    <View style={[styles.chipDot, { backgroundColor: location.color }]} />
                    <Text
                      style={[
                        styles.chipText,
                        formData.location === location.id && styles.chipTextActive,
                      ]}
                    >
                      {location.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <Text style={styles.sectionTitle}>PREZZI</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Prezzo Acquisto (€)</Text>
              <TextInput
                style={styles.input}
                placeholder="2500"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={formData.purchasePrice}
                onChangeText={(value) => updateField('purchasePrice', value)}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Prezzo Vendita (€)</Text>
              <TextInput
                style={styles.input}
                placeholder="4200"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={formData.sellPrice}
                onChangeText={(value) => updateField('sellPrice', value)}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>MISURE</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.thirdWidth]}>
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
            <View style={[styles.inputGroup, styles.thirdWidth]}>
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
            <View style={[styles.inputGroup, styles.thirdWidth]}>
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
          </View>

          <Text style={styles.sectionTitle}>NOTE TECNICHE</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Inserisci dettagli tecnici, tipo di cucitura, caratteristiche speciali..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.technicalNotes}
              onChangeText={(value) => updateField('technicalNotes', value)}
            />
          </View>

          {/* Submit Button */}
          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <MaterialIcons name="check-circle" size={24} color="#000" />
            <Text style={styles.submitButtonText}>Aggiungi all'Inventario</Text>
          </Pressable>

          <Text style={styles.footNote}>
            * Campi obbligatori: Tipo di Pelle, Posizione (SKU auto-generato se vuoto)
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
});
