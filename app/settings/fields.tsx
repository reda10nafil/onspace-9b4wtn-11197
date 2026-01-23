// FurInventory Pro - Custom Fields Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme, typography, borderRadius, spacing } from '../../constants/theme';

const FIELD_TYPES = [
  { id: 'number', label: 'Numero/Decimale', icon: 'pin', description: 'Con unità di misura personalizzabile' },
  { id: 'currency', label: 'Valuta', icon: 'euro', description: 'Per prezzi e costi' },
  { id: 'date', label: 'Data', icon: 'calendar-today', description: 'Con calendario picker' },
  { id: 'text_short', label: 'Testo Breve', icon: 'short-text', description: 'Max 100 caratteri' },
  { id: 'text_long', label: 'Testo Lungo', icon: 'notes', description: 'Note espandibili' },
  { id: 'images', label: 'Immagini Multiple', icon: 'collections', description: 'Fino a 10 foto' },
  { id: 'single_choice', label: 'Scelta Singola', icon: 'radio-button-checked', description: 'Dropdown menu' },
  { id: 'multi_choice', label: 'Scelta Multipla', icon: 'check-box', description: 'Checkbox multipli' },
];

export default function CustomFieldsScreen() {
  const insets = useSafeAreaInsets();

  const handleAddField = (fieldType: any) => {
    Alert.alert(
      `Aggiungi Campo: ${fieldType.label}`,
      'Funzionalità completa disponibile nella prossima versione.\n\nPotrai:\n• Nominare il campo\n• Impostare unità di misura\n• Definire opzioni dropdown\n• Riordinare tramite drag & drop',
      [{ text: 'OK' }]
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tipi di Campo Disponibili</Text>
          <Text style={styles.headerDescription}>
            Seleziona il tipo di campo da aggiungere alle schede prodotto
          </Text>
        </View>

        {FIELD_TYPES.map((fieldType) => (
          <Pressable
            key={fieldType.id}
            style={styles.fieldTypeCard}
            onPress={() => handleAddField(fieldType)}
          >
            <View style={styles.fieldTypeIcon}>
              <MaterialIcons name={fieldType.icon as any} size={28} color={theme.primary} />
            </View>
            <View style={styles.fieldTypeContent}>
              <Text style={styles.fieldTypeLabel}>{fieldType.label}</Text>
              <Text style={styles.fieldTypeDescription}>{fieldType.description}</Text>
            </View>
            <MaterialIcons name="add-circle" size={24} color={theme.primary} />
          </Pressable>
        ))}

        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>📝 Esempi di Utilizzo</Text>
          
          <View style={styles.exampleItem}>
            <Text style={styles.exampleBullet}>•</Text>
            <Text style={styles.exampleText}>
              <Text style={styles.exampleBold}>Numero:</Text> Spessore pelo (mm), Numero pelli utilizzate
            </Text>
          </View>

          <View style={styles.exampleItem}>
            <Text style={styles.exampleBullet}>•</Text>
            <Text style={styles.exampleText}>
              <Text style={styles.exampleBold}>Scelta Singola:</Text> Tipo cucitura (Tradizionale, Moderna, Doppia)
            </Text>
          </View>

          <View style={styles.exampleItem}>
            <Text style={styles.exampleBullet}>•</Text>
            <Text style={styles.exampleText}>
              <Text style={styles.exampleBold}>Scelta Multipla:</Text> Caratteristiche speciali (Fodera seta, Bottoni gioiello, Etichetta personalizzata)
            </Text>
          </View>

          <View style={styles.exampleItem}>
            <Text style={styles.exampleBullet}>•</Text>
            <Text style={styles.exampleText}>
              <Text style={styles.exampleBold}>Data:</Text> Data ultima manutenzione, Scadenza garanzia
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={24} color={theme.primary} />
          <Text style={styles.infoText}>
            I campi personalizzati verranno aggiunti a tutte le schede prodotto.
            Potrai riordinarli tramite drag & drop e renderli obbligatori o facoltativi.
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
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    ...typography.cardTitle,
    fontSize: 20,
    marginBottom: 8,
  },
  headerDescription: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
  },
  fieldTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 16,
    marginBottom: 12,
  },
  fieldTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.medium,
    backgroundColor: `${theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fieldTypeContent: {
    flex: 1,
  },
  fieldTypeLabel: {
    ...typography.cardTitle,
    fontSize: 15,
    marginBottom: 4,
  },
  fieldTypeDescription: {
    ...typography.caption,
    fontSize: 12,
  },
  exampleCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.large,
    padding: spacing.screenPadding,
    marginTop: 16,
    marginBottom: 16,
  },
  exampleTitle: {
    ...typography.cardTitle,
    fontSize: 16,
    marginBottom: 16,
  },
  exampleItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  exampleBullet: {
    ...typography.body,
    fontSize: 14,
    marginRight: 8,
    color: theme.primary,
  },
  exampleText: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  exampleBold: {
    fontWeight: '600',
    color: theme.textPrimary,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 16,
  },
  infoText: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
