// FurInventory Pro - Scanner Screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme, typography, borderRadius } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';

export default function ScannerScreen() {
  const router = useRouter();
  const { products, scanProduct } = useInventory();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialIcons name="qr-code-scanner" size={80} color={theme.primary} />
          <Text style={styles.permissionTitle}>Accesso Fotocamera</Text>
          <Text style={styles.permissionText}>
            Permetti l'accesso alla fotocamera per scansionare codici QR e barcode
          </Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Abilita Fotocamera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);

    // Find product by SKU (simulating barcode match)
    const product = products.find((p) => p.sku === data || p.id === data);

    if (product) {
      scanProduct(product.id);
      // Navigate to quick action modal with product ID
      router.push({
        pathname: '/scanner-action',
        params: { productId: product.id },
      });
    } else {
      Alert.alert(
        'Prodotto Non Trovato',
        `Codice scansionato: ${data}\n\nNessun prodotto corrisponde a questo codice.`,
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      );
    }

    // Reset scanner after 2 seconds
    setTimeout(() => setScanned(false), 2000);
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

      {/* Manual Entry Button */}
      <Pressable
        style={styles.manualButton}
        onPress={() => {
          Alert.alert(
            'Inserimento Manuale',
            'Funzionalità disponibile nella prossima versione',
            [{ text: 'OK' }]
          );
        }}
      >
        <MaterialIcons name="keyboard" size={20} color={theme.primary} />
        <Text style={styles.manualButtonText}>Inserisci Codice Manualmente</Text>
      </Pressable>
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
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.border,
  },
  manualButtonText: {
    ...typography.cardTitle,
    fontSize: 15,
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
});
