// FurInventory Pro - Manage Locations Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { theme, typography, borderRadius, spacing } from '../../constants/theme';
import { useLocations, Location } from '../../contexts/LocationsContext';
import BarcodeScanner from '../../components/BarcodeScanner';

const COLOR_OPTIONS = [
  '#3B82F6', // Blue
  '#D4AF37', // Gold
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#111827', // Black
];

export default function ManageLocationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locations, loading, addLocation, updateLocation, deleteLocation } = useLocations();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [barcode, setBarcode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showScanner, setShowScanner] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false); // To show large QR

  const resetForm = () => {
    setName('');
    setSelectedColor(COLOR_OPTIONS[0]);
    setBarcode('');
    setEditingId(null);
  };

  const handleEdit = (loc: Location) => {
    setName(loc.label);
    setSelectedColor(loc.color);
    setBarcode(loc.barcode || '');
    setEditingId(loc.id);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per la posizione');
      return;
    }

    if (editingId) {
      // Update existing
      await updateLocation(editingId, {
        label: name,
        color: selectedColor,
        barcode: barcode || undefined,
      });
      Alert.alert('Successo', 'Posizione aggiornata');
      resetForm();
    } else {
      // Create new
      const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

      if (locations.some((l) => l.id === newId)) {
        Alert.alert('Errore', 'Esiste già una posizione con questo ID (basato sul nome)');
        return;
      }

      await addLocation({
        id: newId,
        label: name,
        color: selectedColor,
        barcode: barcode || undefined,
      });
      Alert.alert('Successo', 'Posizione creata');
      resetForm();
    }
  };

  const handleDeleteLocation = (id: string) => {
    if (locations.length <= 1) {
      Alert.alert('Attenzione', 'Devi avere almeno una posizione');
      return;
    }
    Alert.alert(
      'Conferma Eliminazione',
      'Eliminare questa posizione?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => await deleteLocation(id),
        },
      ]
    );
  };

  const generateBarcode = () => {
    // If editing, use ID. If new, use name to generate temp ID
    const baseId = editingId || name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (!baseId) {
      Alert.alert('Errore', 'Inserisci prima un nome per generare il codice.');
      return;
    }
    setBarcode(`LOC-${baseId.toUpperCase()}`);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    setBarcode(data);
    setShowScanner(false);
    Alert.alert('Scansionato', `Codice acquisito: ${data}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Form Section */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingId ? 'MODIFICA POSIZIONE' : 'AGGIUNGI POSIZIONE'}
          </Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Es. Magazzino A, Scaffale 1"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Colore</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
            {COLOR_OPTIONS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && <MaterialIcons name="check" size={20} color="#FFF" />}
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Barcode / NFC (Opzionale)</Text>
          <View style={styles.barcodeRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Scansiona o Genera..."
              placeholderTextColor={theme.textSecondary}
              value={barcode}
              onChangeText={setBarcode}
            />
            <Pressable style={styles.iconButton} onPress={() => setShowScanner(true)}>
              <MaterialIcons name="qr-code-scanner" size={24} color={theme.primary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={generateBarcode}>
              <MaterialIcons name="autorenew" size={24} color={theme.primary} />
            </Pressable>
          </View>

          {/* QR Preview if barcode exists */}
          {barcode ? (
            <View style={styles.qrPreview}>
              <QRCode value={barcode} size={60} />
              <Text style={styles.qrText}>{barcode}</Text>
            </View>
          ) : null}

          <View style={styles.actionButtons}>
            {editingId && (
              <Pressable style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </Pressable>
            )}
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {editingId ? 'Salva Modifiche' : 'Crea Posizione'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* List Section */}
        <Text style={styles.listTitle}>POSIZIONI ({locations.length})</Text>
        {locations.map((loc) => (
          <Pressable key={loc.id} style={styles.locationItem} onPress={() => handleEdit(loc)}>
            <View style={[styles.locationColor, { backgroundColor: loc.color }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>{loc.label}</Text>
              <Text style={styles.locationMeta}>
                ID: {loc.id}
                {loc.barcode ? ` • 🏷️ ${loc.barcode}` : ''}
              </Text>
            </View>

            <View style={styles.itemActions}>
              {loc.barcode && (
                <Pressable onPress={() => { setBarcode(loc.barcode!); setShowQRModal(true); }} style={{ marginRight: 8 }}>
                  <MaterialIcons name="qr-code" size={20} color={theme.textPrimary} />
                </Pressable>
              )}
              <Pressable onPress={() => handleDeleteLocation(loc.id)}>
                <MaterialIcons name="delete" size={20} color={theme.error} />
              </Pressable>
            </View>
          </Pressable>
        ))}

      </ScrollView>

      {/* Scanner Modal */}
      {showScanner && (
        <View style={StyleSheet.absoluteFill}>
          <BarcodeScanner onScan={handleBarCodeScanned} onClose={() => setShowScanner(false)} />
        </View>
      )}

      {/* Large QR Modal */}
      <Modal visible={showQRModal} transparent animationType="fade" onRequestClose={() => setShowQRModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowQRModal(false)}>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Codice Posizione</Text>
            <QRCode value={barcode || 'empty'} size={200} />
            <Text style={styles.qrBigText}>{barcode}</Text>
            <Text style={styles.qrHint}>Scansiona per spostare prodotti qui</Text>
          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: borderRadius.large,
    marginBottom: 24,
  },
  formTitle: {
    ...typography.cardTitle,
    fontSize: 16,
    marginBottom: 16,
    textTransform: 'uppercase',
    color: theme.textSecondary,
  },
  label: {
    ...typography.caption,
    marginBottom: 8,
    color: theme.textSecondary,
  },
  input: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: borderRadius.medium,
    padding: 12,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  colorRow: {
    flexDirection: 'row',
    marginBottom: 16,
    height: 50,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: theme.textPrimary,
  },
  barcodeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    padding: 10,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.border,
  },
  qrPreview: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: borderRadius.medium,
    marginBottom: 16,
    alignSelf: 'center',
  },
  qrText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.buttonPrimary,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    padding: 14,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    color: theme.textPrimary,
    fontWeight: '600',
  },
  listTitle: {
    ...typography.sectionHeader,
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: borderRadius.medium,
    marginBottom: 8,
  },
  locationColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    ...typography.cardTitle,
    fontSize: 16,
  },
  locationMeta: {
    ...typography.caption,
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrCard: {
    backgroundColor: '#FFF',
    padding: 32,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000',
  },
  qrBigText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  qrHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});
