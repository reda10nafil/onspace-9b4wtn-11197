// FurInventory Pro - Settings Screen
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { theme, typography, borderRadius, spacing } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { products } = useInventory();

  const showComingSoon = (feature: string) => {
    Alert.alert('Prossimamente', `${feature} sarà disponibile nella prossima versione`);
  };

  const exportToCSV = async () => {
    try {
      // Generate CSV content
      let csvContent = 'SKU,Tipo Pelle,Posizione,Status,Prezzo Acquisto,Prezzo Vendita,Lunghezza,Larghezza,Peso,Note\n';

      products.forEach((product) => {
        csvContent += `"${product.sku}",`;
        csvContent += `"${product.furType}",`;
        csvContent += `"${product.location}",`;
        csvContent += `"${product.status}",`;
        csvContent += `${product.purchasePrice || ''},`;
        csvContent += `${product.sellPrice || ''},`;
        csvContent += `${product.length || ''},`;
        csvContent += `${product.width || ''},`;
        csvContent += `${product.weight || ''},`;
        csvContent += `"${product.technicalNotes?.replace(/"/g, '""') || ''}"\n`;
      });

      const fileUri = FileSystem.documentDirectory + `inventario_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Successo', `File salvato in: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile esportare i dati');
    }
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Impostazioni</Text>
        </View>

        {/* Automazioni Smart - NEW */}
        <Text style={styles.sectionTitle}>AUTOMAZIONI SMART</Text>

        <Pressable
          style={styles.settingRow}
          onPress={() => router.push('/settings/automations')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
              <MaterialIcons name="auto-fix-high" size={24} color="#000" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Centro Automazioni</Text>
              <Text style={styles.settingDescription}>
                Spostamenti, Vendite e Audit rapidi
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>

        {/* GESTIONE INVENTARIO */}
        <Text style={styles.sectionTitle}>GESTIONE INVENTARIO</Text>

        <Pressable
          style={styles.settingRow}
          onPress={() => router.push('/settings/folders')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' }]}>
              <MaterialIcons name="folder" size={24} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Gestisci Cartelle</Text>
              <Text style={styles.settingDescription}>
                Crea e organizza librerie personalizzate
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={styles.settingRow}
          onPress={() => router.push('/settings/fields')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <MaterialIcons name="tune" size={24} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Campi Personalizzati</Text>
              <Text style={styles.settingDescription}>
                Aggiungi e riordina campi prodotto
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={styles.settingRow}
          onPress={() => router.push('/settings/layout-builder')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
              <MaterialIcons name="dashboard-customize" size={24} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Configura Layout Aggiungi</Text>
              <Text style={styles.settingDescription}>
                Personalizza ordine e dimensione campi
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={styles.settingRow}
          onPress={() => router.push('/settings/trash')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.error }]}>
              <MaterialIcons name="delete" size={24} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Cestino</Text>
              <Text style={styles.settingDescription}>
                Recupera o elimina prodotti cancellati
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={styles.settingRow}
          onPress={() => router.push('/settings/locations')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
              <MaterialIcons name="location-on" size={24} color="#000" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Gestisci Posizioni</Text>
              <Text style={styles.settingDescription}>
                Modifica locazioni disponibili
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>


        {/* CONDIVISIONE */}
        <Text style={styles.sectionTitle}>CONDIVISIONE</Text>

        <Pressable
          style={styles.settingRow}
          onPress={() => router.push('/settings/share')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#06B6D4' }]}>
              <MaterialIcons name="share" size={24} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Configurazione Condivisione</Text>
              <Text style={styles.settingDescription}>
                Personalizza info condivise Cliente/Professionista
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>

        {/* ALERT E NOTIFICHE */}
        <Text style={styles.sectionTitle}>ALERT E NOTIFICHE</Text>

        <Pressable
          style={styles.settingRow}
          onPress={() => showComingSoon('Configurazione alert manutenzione')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' }]}>
              <MaterialIcons name="notifications" size={24} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Alert Prodotti Dormienti</Text>
              <Text style={styles.settingDescription}>
                Soglia: 6 mesi senza movimenti
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={styles.settingRow}
          onPress={() => showComingSoon('Configurazione suggerimenti AI')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
              <MaterialIcons name="auto-awesome" size={24} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Suggerimenti AI</Text>
              <Text style={styles.settingDescription}>
                Consigli automatici per prodotti in magazzino
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>

        {/* DATI E BACKUP */}
        <Text style={styles.sectionTitle}>DATI E BACKUP</Text>

        <Pressable
          style={styles.settingRow}
          onPress={exportToCSV}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <MaterialIcons name="file-download" size={24} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Esporta Inventario</Text>
              <Text style={styles.settingDescription}>
                Scarica CSV o Excel completo
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={styles.settingRow}
          onPress={() => showComingSoon('Backup automatico cloud')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' }]}>
              <MaterialIcons name="cloud-upload" size={24} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Backup Cloud</Text>
              <Text style={styles.settingDescription}>
                Sincronizzazione automatica (richiede Supabase)
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>

        {/* TEAM E ACCESSO */}
        <Text style={styles.sectionTitle}>TEAM E ACCESSO</Text>

        <Pressable
          style={styles.settingRow}
          onPress={() => showComingSoon('Gestione multi-utente')}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
              <MaterialIcons name="people" size={24} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Accesso Multi-Utente</Text>
              <Text style={styles.settingDescription}>
                Gestisci permessi team (Pro)
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>

        {/* INFO */}
        <Text style={styles.sectionTitle}>INFO</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>FurInventory Pro</Text>
          <Text style={styles.infoVersion}>Versione 1.0.0</Text>
          <Text style={styles.infoDescription}>
            Sistema di gestione inventario professionale per pellicce di lusso
          </Text>
          <View style={styles.infoDivider} />
          <Text style={styles.infoLabel}>DATABASE LOCALE</Text>
          <Text style={styles.infoText}>
            I dati sono salvati localmente sul dispositivo. Abilita il backup cloud per sincronizzare tra dispositivi.
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 14,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...typography.cardTitle,
    fontSize: 15,
    marginBottom: 2,
  },
  settingDescription: {
    ...typography.caption,
    fontSize: 12,
  },
  infoCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.large,
    padding: 20,
    marginBottom: 16,
  },
  infoTitle: {
    ...typography.cardTitle,
    fontSize: 20,
    marginBottom: 4,
  },
  infoVersion: {
    ...typography.caption,
    fontSize: 13,
    marginBottom: 12,
  },
  infoDescription: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 16,
  },
  infoLabel: {
    ...typography.sectionHeader,
    fontSize: 11,
    marginBottom: 8,
  },
  infoText: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
  },
});
