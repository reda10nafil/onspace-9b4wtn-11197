// FurInventory Pro - Scanner Quick Actions Modal
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { theme, typography, shadows, borderRadius, spacing } from '../constants/theme';
import { useInventory } from '../contexts/InventoryContext';
import { useLocations } from '../contexts/LocationsContext';

type ActionType = 'moved' | 'sold' | 'details' | 'audit' | 'batch-move' | null;

export default function ScannerActionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type = 'product', id } = useLocalSearchParams();
  // Support legacy param productId
  const entityId = (id as string) || (useLocalSearchParams().productId as string);

  const { getProductById, moveProduct, sellProduct, libraries } = useInventory();
  const { locations } = useLocations();

  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [finalPrice, setFinalPrice] = useState('');

  // Resolve entity based on type
  const product = type === 'product' ? getProductById(entityId) : null;
  const location = type === 'location' ? locations.find(l => l.id === entityId) : null;
  const library = type === 'library' ? libraries.find(l => l.id === entityId) : null;

  // Render NOT FOUND states
  if (type === 'product' && !product) return <NotFoundScreen message="Prodotto non trovato" router={router} />;
  if (type === 'location' && !location) return <NotFoundScreen message="Posizione non trovata" router={router} />;
  if (type === 'library' && !library) return <NotFoundScreen message="Cartella non trovata" router={router} />;

  // --- HANDLERS ---
  const handleAction = () => {
    if (type === 'product' && product) {
      // Existing Product Logic
      if (selectedAction === 'moved') {
        if (!selectedLocation) { Alert.alert('Errore', 'Seleziona una posizione'); return; }
        moveProduct(product.id, selectedLocation);
        Alert.alert('Spostamento Registrato', `${product.sku} spostato.`, [{ text: 'OK', onPress: () => router.back() }]);
      } else if (selectedAction === 'sold') {
        sellProduct(product.id, finalPrice ? parseFloat(finalPrice) : undefined);
        Alert.alert('Vendita Registrata', `${product.sku} venduto.`, [{ text: 'OK', onPress: () => router.back() }]);
      } else if (selectedAction === 'details') {
        router.replace(`/product/${product.id}` as any);
      }
    } else if (type === 'location' && location) {
      if (selectedAction === 'audit') {
        // Navigate to audit with pre-selected location? 
        // Currently audit doesn't take params, but we can make it smart or just open it.
        // For now, let's just go to Audit screen, user can scan again or select.
        // BETTER: Pass param to audit if we modify audit to accept it.
        router.push('/automations/audit' as any);
        // Note for future: Edit audit.tsx to accept ?locationId=...
      } else if (selectedAction === 'batch-move') {
        router.push('/automations/batch-move' as any);
      }
    } else if (type === 'library' && library) {
      // Just view folder
      // We don't have a direct link to folder view yet, maybe search results filter?
      // Let's go to inventory with filter
      router.push(`/(tabs)/?library=${library.id}` as any);
    }
  };

  // --- RENDERERS ---

  if (type === 'location' && location) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.headerCard, { borderLeftColor: location.color, borderLeftWidth: 6 }]}>
            <MaterialIcons name="location-on" size={40} color={location.color} />
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.headerTitle}>POSIZIONE</Text>
              <Text style={styles.headerSubtitle}>{location.label}</Text>
              <Text style={styles.headerMeta}>Capacità: {location.capacity || 'Infinito'}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>AZIONI DISPONIBILI</Text>

          <Pressable style={styles.actionButton} onPress={() => router.push('/automations/batch-move')}>
            <View style={[styles.actionIcon, { backgroundColor: theme.primary }]}>
              <MaterialIcons name="move-to-inbox" size={24} color="#FFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>SPOSTAMENTO DI MASSA</Text>
              <Text style={styles.actionDescription}>Sposta prodotti QUI o da QUI</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => router.push('/automations/audit')}>
            <View style={[styles.actionIcon, { backgroundColor: theme.warning }]}>
              <MaterialIcons name="fact-check" size={24} color="#FFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>INVENTARIO / AUDIT</Text>
              <Text style={styles.actionDescription}>Verifica contenuto posizione</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
          </Pressable>

          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>Chiudi</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (type === 'library' && library) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.headerCard, { borderLeftColor: theme.primary, borderLeftWidth: 6 }]}>
            <MaterialIcons name={library.icon as any || 'folder'} size={40} color={theme.primary} />
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.headerTitle}>CARTELLA</Text>
              <Text style={styles.headerSubtitle}>{library.name}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>AZIONI</Text>

          <Pressable style={styles.actionButton} onPress={() => router.push('/(tabs)/inventory')}>
            <View style={[styles.actionIcon, { backgroundColor: theme.primary }]}>
              <MaterialIcons name="list" size={24} color="#FFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>VEDI PRODOTTI</Text>
              <Text style={styles.actionDescription}>Vai all'inventario filtrato</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
          </Pressable>

          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>Chiudi</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- PRODUCT RENDER (Existing logic adapted) ---
  // Explicit check for Product Render
  if (type === 'product' && product) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Preview */}
          <View style={styles.productPreview}>
            <Image
              source={{ uri: product.images[0] }}
              style={styles.productImage}
              contentFit="cover"
            />
            <View style={styles.productDetails}>
              <Text style={styles.productSku}>{product.sku}</Text>
              <Text style={styles.productType}>
                {product.furType.charAt(0).toUpperCase() + product.furType.slice(1)}
              </Text>
              <View style={styles.locationBadge}>
                <MaterialIcons name="location-on" size={14} color={theme.primary} />
                <Text style={styles.locationText}>
                  {product.location.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>AZIONE RAPIDA</Text>

          <Pressable
            style={[
              styles.actionButton,
              selectedAction === 'moved' && styles.actionButtonActive,
            ]}
            onPress={() => setSelectedAction('moved')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
              <MaterialIcons name="swap-horiz" size={24} color="#FFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>SPOSTATO</Text>
              <Text style={styles.actionDescription}>
                Registra cambio di posizione
              </Text>
            </View>
            <MaterialIcons
              name={selectedAction === 'moved' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={24}
              color={selectedAction === 'moved' ? theme.primary : theme.textSecondary}
            />
          </Pressable>

          {selectedAction === 'moved' && (
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsLabel}>Seleziona nuova posizione:</Text>
              {locations.map((location) => (
                <Pressable
                  key={location.id}
                  style={[
                    styles.optionChip,
                    selectedLocation === location.id && styles.optionChipActive,
                  ]}
                  onPress={() => setSelectedLocation(location.id)}
                >
                  <View
                    style={[styles.optionDot, { backgroundColor: location.color }]}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      selectedLocation === location.id && styles.optionTextActive,
                    ]}
                  >
                    {location.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            style={[
              styles.actionButton,
              selectedAction === 'sold' && styles.actionButtonActive,
            ]}
            onPress={() => setSelectedAction('sold')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
              <MaterialIcons name="sell" size={24} color="#FFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>VENDUTO</Text>
              <Text style={styles.actionDescription}>
                Segna come venduto e archivia
              </Text>
            </View>
            <MaterialIcons
              name={selectedAction === 'sold' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={24}
              color={selectedAction === 'sold' ? theme.primary : theme.textSecondary}
            />
          </Pressable>

          {selectedAction === 'sold' && (
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsLabel}>Prezzo di vendita finale (opzionale):</Text>
              <TextInput
                style={styles.priceInput}
                placeholder={`€${product.sellPrice || 0}`}
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={finalPrice}
                onChangeText={setFinalPrice}
              />
            </View>
          )}

          <Pressable
            style={[
              styles.actionButton,
              selectedAction === 'details' && styles.actionButtonActive,
            ]}
            onPress={() => setSelectedAction('details')}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.primary }]}>
              <MaterialIcons name="edit" size={24} color="#000" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>DETTAGLI/MODIFICA</Text>
              <Text style={styles.actionDescription}>
                Visualizza e modifica tutti i campi
              </Text>
            </View>
            <MaterialIcons
              name={selectedAction === 'details' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={24}
              color={selectedAction === 'details' ? theme.primary : theme.textSecondary}
            />
          </Pressable>

          {/* Execute Button */}
          <Pressable
            style={[
              styles.executeButton,
              !selectedAction && styles.executeButtonDisabled,
            ]}
            onPress={handleAction}
            disabled={!selectedAction}
          >
            <Text style={styles.executeButtonText}>
              {selectedAction === 'moved' && 'Conferma Spostamento'}
              {selectedAction === 'sold' && 'Conferma Vendita'}
              {selectedAction === 'details' && 'Vai ai Dettagli'}
              {!selectedAction && 'Seleziona un\'azione'}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Default fallback (should not reach here ideally)
  return <NotFoundScreen message="Elemento non riconosciuto" router={router} />;
}

function NotFoundScreen({ message, router }: { message: string, router: any }) {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={theme.error} />
        <Text style={styles.errorText}>{message}</Text>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>Chiudi</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 24,
    borderRadius: borderRadius.large,
    marginBottom: 32,
    ...shadows.card,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.textSecondary,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginVertical: 4,
  },
  headerMeta: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  productPreview: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.large,
    padding: 12,
    marginBottom: 24,
    ...shadows.card,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.medium,
    backgroundColor: theme.backgroundSecondary,
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productSku: {
    ...typography.cardTitle,
    fontSize: 18,
    marginBottom: 4,
  },
  productType: {
    ...typography.caption,
    marginBottom: 8,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...typography.caption,
    fontSize: 12,
    color: theme.primary,
  },
  sectionTitle: {
    ...typography.sectionHeader,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  actionButtonActive: {
    borderColor: theme.primary,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    ...typography.cardTitle,
    fontSize: 16,
    marginBottom: 2,
  },
  actionDescription: {
    ...typography.caption,
    fontSize: 13,
  },
  optionsContainer: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: borderRadius.medium,
    padding: 16,
    marginBottom: 12,
  },
  optionsLabel: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  optionChipActive: {
    backgroundColor: `${theme.primary}15`,
    borderColor: theme.primary,
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  optionText: {
    ...typography.body,
    fontSize: 15,
  },
  optionTextActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  priceInput: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 14,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  executeButton: {
    backgroundColor: theme.primary,
    borderRadius: borderRadius.medium,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    ...shadows.card,
  },
  executeButtonDisabled: {
    backgroundColor: theme.surface,
  },
  executeButtonText: {
    ...typography.buttonPrimary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    ...typography.cardTitle,
    fontSize: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: theme.surface,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: borderRadius.medium,
    alignItems: 'center', // Fix alignment
  },
  closeButtonText: {
    ...typography.buttonPrimary,
    fontSize: 16,
    color: theme.primary,
  },
});
