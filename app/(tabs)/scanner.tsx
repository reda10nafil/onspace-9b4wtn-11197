// FurInventory Pro - Scanner Screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { decodeBarcodeImage } from '../../utils/barcodeDecoder';
import { theme, typography, borderRadius } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';
import { useLocations } from '../../contexts/LocationsContext';
import { soundService } from '../../services/SoundService';
import { useAutomations } from '../../contexts/AutomationsContext';

export default function ScannerScreen() {
  const router = useRouter();
  const { products, scanProduct, libraries } = useInventory();
  const { locations } = useLocations();
  const { getAutomationByQR } = useAutomations();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // ... (rest of state)

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);

    // 1. Try Product
    const product = products.find((p) => p.sku === data || p.id === data);
    if (product) {
      scanProduct(product.id);
      soundService.playSuccess();
      router.push({
        pathname: '/scanner-action',
        params: { type: 'product', id: product.id },
      });
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    // 2. Try Location
    const location = locations.find((l) => l.barcode === data || l.id === data);
    if (location) {
      soundService.playSuccess();
      router.push({
        pathname: '/scanner-action',
        params: { type: 'location', id: location.id },
      });
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    // 3. Try Library (Folder)
    const library = libraries.find((l) => l.barcode === data || l.id === data);
    if (library) {
      soundService.playSuccess();
      router.push({
        pathname: '/scanner-action',
        params: { type: 'library', id: library.id },
      });
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    // 4. Try Custom Automation (AUTO:xxx)
    if (data.startsWith('AUTO:')) {
      const automation = getAutomationByQR(data);
      if (automation) {
        soundService.playSuccess();
        router.push({ pathname: '/automations/custom-runner', params: { id: automation.id } } as any);
        setTimeout(() => setScanned(false), 2000);
        return;
      }
    }

    // 5. Not Found
    soundService.playError();
    Alert.alert(
      'Codice Non Riconosciuto',
      `Codice scansionato: ${data}\n\nNessun prodotto, posizione o cartella corrisponde a questo codice.`,
      [
        {
          text: 'OK',
          onPress: () => setScanned(false),
        },
      ]
    );
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) {
      Alert.alert('Errore', 'Inserisci un codice valido');
      return;
    }

    // Find product by SKU or ID
    const product = products.find((p) =>
      p.sku.toLowerCase() === manualCode.trim().toLowerCase() ||
      p.id === manualCode.trim()
    );

    setShowManualInput(false);
    setManualCode('');

    if (product) {
      scanProduct(product.id);
      router.push({
        pathname: '/scanner-action',
        params: { productId: product.id },
      });
    } else {
      Alert.alert(
        'Prodotto Non Trovato',
        `Codice inserito: ${manualCode}\n\nNessun prodotto corrisponde a questo codice.`,
        [{ text: 'OK' }]
      );
    }
  };

  const pickQRImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permesso Negato', 'Abilita accesso alla galleria nelle impostazioni');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;

        // Start loading state
        setIsAnalyzing(true);

        try {
          console.log('🔍 Starting barcode detection from gallery image');

          // Convert original image to base64 (decoder will handle optimization)
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
          });

          console.log('✅ Image converted to base64, length:', base64.length);

          // Use enhanced multi-API decoder with automatic preprocessing
          const decodeResult = await decodeBarcodeImage(base64, imageUri);

          if (decodeResult.success && decodeResult.data) {
            const scannedCode = decodeResult.data;
            console.log(`🎉 Barcode decoded successfully (${decodeResult.source}):`, scannedCode);

            // Find product by code
            const product = products.find((p) =>
              p.sku.toLowerCase() === scannedCode.toLowerCase() ||
              p.id === scannedCode
            );

            if (product) {
              scanProduct(product.id);
              router.push({
                pathname: '/scanner-action',
                params: { productId: product.id },
              });
            } else {
              console.log('⚠️  No product matches the scanned code');
              Alert.alert(
                'Prodotto Non Trovato',
                `Codice scansionato: ${scannedCode}\n\nNessun prodotto corrisponde a questo codice.`,
                [
                  {
                    text: 'Inserisci Manualmente',
                    onPress: () => {
                      setManualCode(scannedCode);
                      setShowManualInput(true);
                    },
                  },
                  {
                    text: 'OK',
                    onPress: () => setScanned(false),
                  },
                ]
              );
            }
          } else {
            console.log('❌ Failed to decode any barcode/QR code from image');
            Alert.alert(
              'Nessun Codice Trovato',
              decodeResult.error || 'Non ho trovato nessun QR code o barcode nell\'immagine.',
              [
                { text: 'Riprova', onPress: () => pickQRImage() },
                { text: 'Inserisci Manualmente', onPress: () => setShowManualInput(true) },
                { text: 'Annulla', style: 'cancel' },
              ]
            );
          }
        } catch (error) {
          console.error('💥 FATAL ERROR in pickQRImage:', error);
          Alert.alert(
            'Errore di Analisi',
            `Si è verificato un errore durante l\'analisi dell\'immagine.\n\n${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
            [
              { text: 'Riprova', onPress: () => pickQRImage() },
              { text: 'Inserisci Manualmente', onPress: () => setShowManualInput(true) },
            ]
          );
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      setIsAnalyzing(false);
    }
  };


  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scanner QR/Barcode</Text>
        <Pressable
          style={styles.flashButton}
          onPress={() => setFlashOn(!flashOn)}
        >
          <MaterialIcons
            name={flashOn ? 'flash-on' : 'flash-off'}
            size={24}
            color={theme.primary}
          />
        </Pressable>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={flashOn}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
          }}
        >
          {/* Scanning Frame */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
        </CameraView>
      </View>

      <View style={styles.instructionsContainer}>
        <MaterialIcons name="center-focus-strong" size={48} color={theme.primary} />
        <Text style={styles.instructionsTitle}>
          Inquadra il codice QR o barcode
        </Text>
        <Text style={styles.instructionsText}>
          Posiziona il codice all'interno del riquadro{'\n'}
          La scansione avviene automaticamente
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Pressable
          style={styles.actionButton}
          onPress={pickQRImage}
        >
          <MaterialIcons name="photo-library" size={20} color={theme.primary} />
          <Text style={styles.actionButtonText}>Importa da Galleria</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => setShowManualInput(true)}
        >
          <MaterialIcons name="keyboard" size={20} color={theme.primary} />
          <Text style={styles.actionButtonText}>Inserisci Manualmente</Text>
        </Pressable>
      </View>

      {/* Loading Modal */}
      <Modal
        visible={isAnalyzing}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={theme.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>Analisi Immagine</Text>
            <Text style={styles.modalSubtitle}>
              Sto analizzando il QR/Barcode...
            </Text>
          </View>
        </View>
      </Modal>

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowManualInput(false);
          setManualCode('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Inserisci Codice</Text>
            <Text style={styles.modalSubtitle}>
              Digita il codice SKU o barcode del prodotto
            </Text>

            <TextInput
              style={styles.modalInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Es: SKU-001, 1234567890123"
              placeholderTextColor={theme.textSecondary}
              autoFocus
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={handleManualSearch}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowManualInput(false);
                  setManualCode('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Annulla</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalButtonSearch]}
                onPress={handleManualSearch}
              >
                <MaterialIcons name="search" size={20} color="#fff" />
                <Text style={styles.modalButtonTextSearch}>Cerca</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    ...typography.cardTitle,
    fontSize: 20,
  },
  flashButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
    margin: 16,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    backgroundColor: theme.backgroundSecondary,
  },
  camera: {
    flex: 1,
  },
  scanFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: theme.primary,
  },
  cornerTopLeft: {
    top: '25%',
    left: '15%',
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: '25%',
    right: '15%',
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: '25%',
    left: '15%',
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: '25%',
    right: '15%',
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  instructionsTitle: {
    ...typography.cardTitle,
    fontSize: 18,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionButtonText: {
    ...typography.cardTitle,
    fontSize: 14,
    color: theme.primary,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    ...typography.cardTitle,
    fontSize: 24,
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: borderRadius.medium,
  },
  permissionButtonText: {
    ...typography.buttonPrimary,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.large,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalTitle: {
    ...typography.cardTitle,
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.medium,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: borderRadius.medium,
  },
  modalButtonCancel: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalButtonSearch: {
    backgroundColor: theme.primary,
  },
  modalButtonTextCancel: {
    ...typography.cardTitle,
    fontSize: 15,
    color: theme.textPrimary,
  },
  modalButtonTextSearch: {
    ...typography.buttonPrimary,
    fontSize: 15,
  },
});
