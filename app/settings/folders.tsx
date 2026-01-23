// FurInventory Pro - Manage Folders Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme, typography, borderRadius, spacing } from '../../constants/theme';

interface Library {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}

const ICON_OPTIONS = [
  'folder',
  'inventory',
  'warehouse',
  'store',
  'shopping-bag',
  'category',
  'collections',
  'layers',
];

export default function ManageFoldersScreen() {
  const insets = useSafeAreaInsets();
  const [libraries, setLibraries] = useState<Library[]>([
    { id: '1', name: 'Pellicce', icon: 'inventory', itemCount: 22 },
    { id: '2', name: 'Accessori', icon: 'shopping-bag', itemCount: 0 },
  ]);

  const [newLibraryName, setNewLibraryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');

  const addLibrary = () => {
    if (!newLibraryName.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per la cartella');
      return;
    }

    const newLibrary: Library = {
      id: Date.now().toString(),
      name: newLibraryName,
      icon: selectedIcon,
      itemCount: 0,
    };

    setLibraries([...libraries, newLibrary]);
    setNewLibraryName('');
    Alert.alert('Successo', `Cartella "${newLibraryName}" creata`);
  };

  const deleteLibrary = (id: string) => {
    const library = libraries.find((l) => l.id === id);
    if (library && library.itemCount > 0) {
      Alert.alert(
        'Attenzione',
        `La cartella "${library.name}" contiene ${library.itemCount} prodotti. Spostarli prima di eliminare.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Conferma Eliminazione',
      `Eliminare la cartella "${library?.name}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => setLibraries(libraries.filter((l) => l.id !== id)),
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
        {/* Add New Library */}
        <View style={styles.addSection}>
          <Text style={styles.sectionTitle}>CREA NUOVA CARTELLA</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nome cartella (es: Giacche, Cappotti)"
            placeholderTextColor={theme.textSecondary}
            value={newLibraryName}
            onChangeText={setNewLibraryName}
          />

          <Text style={styles.label}>Icona:</Text>
          <View style={styles.iconPicker}>
            {ICON_OPTIONS.map((icon) => (
              <Pressable
                key={icon}
                style={[
                  styles.iconOption,
                  selectedIcon === icon && styles.iconOptionSelected,
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <MaterialIcons
                  name={icon as any}
                  size={28}
                  color={selectedIcon === icon ? '#000' : theme.textSecondary}
                />
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.addButton} onPress={addLibrary}>
            <MaterialIcons name="create-new-folder" size={20} color="#000" />
            <Text style={styles.addButtonText}>Crea Cartella</Text>
          </Pressable>
        </View>

        {/* Existing Libraries */}
        <Text style={styles.sectionTitle}>CARTELLE ESISTENTI ({libraries.length})</Text>
        
        {libraries.map((library) => (
          <View key={library.id} style={styles.libraryItem}>
            <View style={styles.libraryIcon}>
              <MaterialIcons name={library.icon as any} size={28} color={theme.primary} />
            </View>
            <View style={styles.libraryInfo}>
              <Text style={styles.libraryName}>{library.name}</Text>
              <Text style={styles.libraryCount}>{library.itemCount} prodotti</Text>
            </View>
            <Pressable
              style={styles.deleteButton}
              onPress={() => deleteLibrary(library.id)}
            >
              <MaterialIcons name="delete" size={20} color={theme.error} />
            </Pressable>
          </View>
        ))}

        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={24} color={theme.primary} />
          <Text style={styles.infoText}>
            Le cartelle ti permettono di organizzare prodotti in categorie personalizzate.
            Ogni cartella può avere campi specifici diversi dalle altre.
          </Text>
        </View>

        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>💡 Esempi di Utilizzo</Text>
          <Text style={styles.exampleText}>
            • Cartella "Pellicce" con campi: Tipo pelle, Misure, Prezzi{'\n'}
            • Cartella "Accessori" con campi: Materiale, Colore, Taglia{'\n'}
            • Cartella "Riparazioni" con campi: Cliente, Stato lavoro, Scadenza
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
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.medium,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
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
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 14,
    marginBottom: 8,
  },
  libraryIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.medium,
    backgroundColor: `${theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  libraryInfo: {
    flex: 1,
  },
  libraryName: {
    ...typography.cardTitle,
    fontSize: 15,
    marginBottom: 2,
  },
  libraryCount: {
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
    marginBottom: 16,
  },
  infoText: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  exampleCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 16,
  },
  exampleTitle: {
    ...typography.cardTitle,
    fontSize: 14,
    marginBottom: 8,
  },
  exampleText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 18,
  },
});
