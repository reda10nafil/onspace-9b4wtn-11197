// FurInventory Pro - Manage Locations Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme, typography, borderRadius, spacing } from '../../constants/theme';

interface Location {
  id: string;
  label: string;
  color: string;
}

const COLOR_OPTIONS = [
  '#3B82F6', // Blue
  '#D4AF37', // Gold
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#EC4899', // Pink
];

export default function ManageLocationsScreen() {
  const insets = useSafeAreaInsets();
  const [locations, setLocations] = useState<Location[]>([
    { id: 'magazzino', label: 'Magazzino', color: '#3B82F6' },
    { id: 'vetrina', label: 'Vetrina', color: '#D4AF37' },
    { id: 'stand_a', label: 'Stand A', color: '#10B981' },
    { id: 'stand_b', label: 'Stand B', color: '#10B981' },
    { id: 'stand_c', label: 'Stand C', color: '#10B981' },
    { id: 'sartoria', label: 'Sartoria', color: '#8B5CF6' },
  ]);

  const [newLocationName, setNewLocationName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  const addLocation = () => {
    if (!newLocationName.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per la posizione');
      return;
    }

    const newId = newLocationName.toLowerCase().replace(/ /g, '_');
    
    if (locations.some((l) => l.id === newId)) {
      Alert.alert('Errore', 'Esiste già una posizione con questo nome');
      return;
    }

    const newLocation: Location = {
      id: newId,
      label: newLocationName,
      color: selectedColor,
    };

    setLocations([...locations, newLocation]);
    setNewLocationName('');
    Alert.alert('Successo', `Posizione "${newLocationName}" aggiunta`);
  };

  const deleteLocation = (id: string) => {
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
          onPress: () => setLocations(locations.filter((l) => l.id !== id)),
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.screenPadding,
          paddingBottom: insets.bottom + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add New Location */}
        <View style={styles.addSection}>
          <Text style={styles.sectionTitle}>AGGIUNGI NUOVA POSIZIONE</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nome posizione (es: Stand D)"
            placeholderTextColor={theme.textSecondary}
            value={newLocationName}
            onChangeText={setNewLocationName}
          />

          <Text style={styles.label}>Colore:</Text>
          <View style={styles.colorPicker}>
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
                {selectedColor === color && (
                  <MaterialIcons name="check" size={20} color="#FFF" />
                )}
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.addButton} onPress={addLocation}>
            <MaterialIcons name="add-circle" size={20} color="#000" />
            <Text style={styles.addButtonText}>Aggiungi Posizione</Text>
          </Pressable>
        </View>

        {/* Existing Locations */}
        <Text style={styles.sectionTitle}>POSIZIONI ESISTENTI ({locations.length})</Text>
        
        {locations.map((location) => (
          <View key={location.id} style={styles.locationItem}>
            <View style={[styles.locationColor, { backgroundColor: location.color }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>{location.label}</Text>
              <Text style={styles.locationId}>ID: {location.id}</Text>
            </View>
            <Pressable
              style={styles.deleteButton}
              onPress={() => deleteLocation(location.id)}
            >
              <MaterialIcons name="delete" size={20} color={theme.error} />
            </Pressable>
          </View>
        ))}

        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={24} color={theme.primary} />
          <Text style={styles.infoText}>
            Le posizioni vengono utilizzate per tracciare dove si trova ogni prodotto.
            Puoi aggiungere posizioni personalizzate come stand, magazzini specifici, o aree di lavorazione.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  addSection: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.large,
    padding: spacing.screenPadding,
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.sectionHeader,
    marginBottom: 16,
  },
  input: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: borderRadius.medium,
    padding: 14,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  label: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: theme.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    borderRadius: borderRadius.medium,
    padding: 14,
  },
  addButtonText: {
    ...typography.buttonPrimary,
    fontSize: 15,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 14,
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
    fontSize: 15,
    marginBottom: 2,
  },
  locationId: {
    ...typography.caption,
    fontSize: 11,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
