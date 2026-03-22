// FurInventory Pro - Share Settings Screen
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme, typography, borderRadius, spacing } from '../../constants/theme';

export default function ShareSettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>Configurazione Condivisione</Text>
            </View>

            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: spacing.screenPadding,
                    paddingBottom: insets.bottom + 16,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <MaterialIcons name="info-outline" size={24} color={theme.primary} />
                    <Text style={styles.infoText}>
                        Questa funzionalità verrà completata nella prossima versione.{'\n\n'}
                        Potrai personalizzare quali informazioni condividere nelle modalità Cliente e Professionista.
                    </Text>
                </View>

                {/* Preview Card - Cliente */}
                <Text style={styles.sectionTitle}>MODALITÀ CLIENTE</Text>
                <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>Informazioni condivise:</Text>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.success} />
                        <Text style={styles.previewText}>Tipo di pelliccia</Text>
                    </View>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.success} />
                        <Text style={styles.previewText}>Stato (Disponibile/Venduto)</Text>
                    </View>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.success} />
                        <Text style={styles.previewText}>Posizione</Text>
                    </View>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.success} />
                        <Text style={styles.previewText}>Misure (lunghezza, larghezza, peso)</Text>
                    </View>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.success} />
                        <Text style={styles.previewText}>Prezzo di vendita</Text>
                    </View>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.success} />
                        <Text style={styles.previewText}>Descrizione/Note tecniche</Text>
                    </View>
                    <View style={styles.divider} />
                    <Text style={styles.excludedTitle}>Non condiviso:</Text>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="cancel" size={20} color={theme.textSecondary} />
                        <Text style={[styles.previewText, { color: theme.textSecondary }]}>Prezzo di acquisto</Text>
                    </View>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="cancel" size={20} color={theme.textSecondary} />
                        <Text style={[styles.previewText, { color: theme.textSecondary }]}>Margini</Text>
                    </View>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="cancel" size={20} color={theme.textSecondary} />
                        <Text style={[styles.previewText, { color: theme.textSecondary }]}>Fornitori</Text>
                    </View>
                </View>

                {/* Preview Card - Professionista */}
                <Text style={styles.sectionTitle}>MODALITÀ PROFESSIONISTA</Text>
                <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>Informazioni condivise:</Text>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.success} />
                        <Text style={styles.previewText}>Tutte le informazioni Cliente</Text>
                    </View>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.success} />
                        <Text style={styles.previewText}>Prezzo di acquisto</Text>
                    </View>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.success} />
                        <Text style={styles.previewText}>Margine e percentuale</Text>
                    </View>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.success} />
                        <Text style={styles.previewText}>Date (produzione, creazione, aggiornamento, scans ione, vendita)</Text>
                    </View>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.success} />
                        <Text style={styles.previewText}>Cronologia movimenti</Text>
                    </View>
                    <View style={styles.previewItem}>
                        <MaterialIcons name="check-circle" size={20} color={theme.success} />
                        <Text style={styles.previewText}>Note tecniche complete</Text>
                    </View>
                </View>

                {/* Note */}
                <View style={styles.noteCard}>
                    <Text style={styles.noteText}>
                        💡 <Text style={{ fontWeight: '600' }}>Nota:</Text> Le foto NON sono attualmente condivise a causa di limitazioni tecniche con file locali.
                        Questa funzionalità sarà aggiunta in una prossima versione.
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.screenPadding,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    backButton: {
        marginRight: 12,
        padding: 8,
    },
    headerTitle: {
        ...typography.cardTitle,
        fontSize: 18,
    },
    infoCard: {
        backgroundColor: `${theme.primary}15`,
        borderRadius: borderRadius.large,
        padding: 16,
        marginTop: 16,
        marginBottom: 24,
        flexDirection: 'row',
        gap: 12,
    },
    infoText: {
        ...typography.body,
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
        color: theme.textPrimary,
    },
    sectionTitle: {
        ...typography.sectionHeader,
        marginTop: 8,
        marginBottom: 12,
    },
    previewCard: {
        backgroundColor: theme.surface,
        borderRadius: borderRadius.large,
        padding: 16,
        marginBottom: 16,
    },
    previewTitle: {
        ...typography.cardTitle,
        fontSize: 15,
        marginBottom: 12,
    },
    excludedTitle: {
        ...typography.caption,
        fontSize: 13,
        marginBottom: 8,
        marginTop: 4,
    },
    previewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    previewText: {
        ...typography.body,
        fontSize: 14,
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: theme.border,
        marginVertical: 12,
    },
    noteCard: {
        backgroundColor: theme.surface,
        borderRadius: borderRadius.large,
        padding: 16,
        marginBottom: 16,
    },
    noteText: {
        ...typography.caption,
        fontSize: 13,
        lineHeight: 19,
    },
});
