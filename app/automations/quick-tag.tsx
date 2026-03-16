// FurInventory Pro - Quick Tag Automation
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Vibration, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme, typography, borderRadius, spacing, shadows } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';
import BarcodeScanner from '../../components/BarcodeScanner';
import { soundService } from '../../services/SoundService';

const COMMON_TAGS = [
    { label: 'Da Pulire', icon: 'cleaning-services', color: '#3B82F6' },
    { label: 'Riparare', icon: 'build', color: '#F59E0B' },
    { label: 'Riservato', icon: 'lock', color: '#EF4444' },
    { label: 'Vetrina', icon: 'star', color: '#D4AF37' },
];

export default function QuickTagScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { products, getProductBySku, updateProduct } = useInventory();

    const [step, setStep] = useState<'select_tag' | 'scan_loop'>('select_tag');
    const [activeTag, setActiveTag] = useState('');
    const [taggedCount, setTaggedCount] = useState(0);
    const [lastTaggedProduct, setLastTaggedProduct] = useState<string | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [customTag, setCustomTag] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const handleStartTagging = (tag: string) => {
        if (!tag.trim()) {
            Alert.alert('Errore', 'Inserisci un tag valido.');
            return;
        }
        setActiveTag(tag);
        setStep('scan_loop');
    };

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        // Continuous scanning — do NOT close scanner

        let product = products.find((p) => p.id === data);
        if (!product) {
            product = getProductBySku(data);
        }

        if (product) {
            // Append tag to technical notes
            const currentNotes = product.technicalNotes || '';
            // Avoid duplicates
            if (currentNotes.includes(`[${activeTag}]`)) {
                setFeedbackMessage(`${product.sku} già taggato`);
                setTimeout(() => setFeedbackMessage(null), 1000);
                return;
            }

            const newNotes = currentNotes ? `${currentNotes}\n[${activeTag}]` : `[${activeTag}]`;

            updateProduct(product.id, { technicalNotes: newNotes });

            setTaggedCount(c => c + 1);
            setLastTaggedProduct(`${product.sku}`);
            soundService.playSuccess();

            // Overlay feedback
            setFeedbackMessage(`${product.sku} Taggato!`);
            setTimeout(() => setFeedbackMessage(null), 1000);

        } else {
            soundService.playError();
            setFeedbackMessage(`Non trovato: ${data}`);
            setTimeout(() => setFeedbackMessage(null), 2000);
        }
    };

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="close" size={24} color={theme.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>Tagging Rapido</Text>
            </View>

            {step === 'select_tag' ? (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.centerHeader}>
                        <MaterialIcons name="label" size={64} color={theme.info} style={{ marginBottom: 16 }} />
                        <Text style={styles.stepTitle}>Scegli un Tag</Text>
                        <Text style={styles.stepDescription}>
                            Seleziona un'etichetta da applicare a tutti i prodotti che scannerizzerai.
                        </Text>
                    </View>

                    <Text style={styles.sectionLabel}>TAG COMUNI</Text>
                    <View style={styles.tagsGrid}>
                        {COMMON_TAGS.map(tag => (
                            <Pressable
                                key={tag.label}
                                style={[styles.tagCard, { borderColor: tag.color }]}
                                onPress={() => handleStartTagging(tag.label)}
                            >
                                <MaterialIcons name={tag.icon as any} size={32} color={tag.color} />
                                <Text style={[styles.tagLabel, { color: tag.color }]}>{tag.label}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.sectionLabel}>O SCRIVI UN TAG PERSONALIZZATO</Text>
                    <View style={styles.customTagContainer}>
                        <TextInput
                            style={styles.customInput}
                            placeholder="Es. Collezione 2024"
                            placeholderTextColor={theme.textSecondary}
                            value={customTag}
                            onChangeText={setCustomTag}
                        />
                        <Pressable
                            style={[styles.goButton, !customTag && { opacity: 0.5 }]}
                            onPress={() => handleStartTagging(customTag)}
                            disabled={!customTag}
                        >
                            <MaterialIcons name="arrow-forward" size={24} color="#000" />
                        </Pressable>
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.content}>
                    <View style={styles.statusCard}>
                        <Text style={styles.statusLabel}>MODALITÀ TAGGING ATTIVA</Text>
                        <View style={styles.activeTagBadge}>
                            <MaterialIcons name="label" size={20} color="#FFF" />
                            <Text style={styles.activeTagText}>{activeTag}</Text>
                        </View>
                        <Text style={styles.countText}>{taggedCount} prodotti taggati</Text>
                    </View>

                    {lastTaggedProduct && (
                        <View style={styles.lastActionCard}>
                            <MaterialIcons name="check-circle" size={24} color={theme.success} />
                            <Text style={styles.lastActionText}>
                                Taggato: <Text style={{ fontWeight: 'bold' }}>{lastTaggedProduct}</Text>
                            </Text>
                        </View>
                    )}

                    <Pressable style={styles.scanButton} onPress={() => setShowScanner(true)}>
                        <MaterialIcons name="qr-code-scanner" size={32} color="#FFF" />
                        <Text style={styles.scanButtonText}>Scansiona Prodotto</Text>
                    </Pressable>

                    <Pressable style={styles.stopButton} onPress={() => setStep('select_tag')}>
                        <Text style={styles.stopButtonText}>Termina Sessione</Text>
                    </Pressable>
                </View>
            )}

            {/* Continuous Scanner Modal */}
            {showScanner && (
                <View style={StyleSheet.absoluteFill}>
                    <BarcodeScanner
                        onScan={handleBarCodeScanned}
                        onClose={() => setShowScanner(false)}
                        delay={500}
                    />
                    {feedbackMessage && (
                        <View style={styles.feedbackOverlay}>
                            <MaterialIcons
                                name={feedbackMessage.includes('Non trovato') || feedbackMessage.includes('già') ? 'info-outline' : 'check-circle'}
                                size={48}
                                color="#FFF"
                            />
                            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
                        </View>
                    )}
                </View>
            )}
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.textPrimary,
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    centerHeader: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.textPrimary,
        marginBottom: 8,
    },
    stepDescription: {
        fontSize: 16,
        color: theme.textSecondary,
        textAlign: 'center',
    },
    sectionLabel: {
        alignSelf: 'flex-start',
        fontSize: 12,
        fontWeight: '700',
        color: theme.textSecondary,
        marginBottom: 12,
        marginTop: 12,
    },
    tagsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        width: '100%',
        marginBottom: 24,
    },
    tagCard: {
        width: '48%',
        backgroundColor: theme.surface,
        padding: 20,
        borderRadius: borderRadius.medium,
        alignItems: 'center',
        borderWidth: 1,
        ...shadows.card,
    },
    tagLabel: {
        marginTop: 8,
        fontWeight: '600',
        fontSize: 14,
    },
    customTagContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    customInput: {
        flex: 1,
        height: 56,
        backgroundColor: theme.surface,
        borderRadius: borderRadius.medium,
        paddingHorizontal: 16,
        fontSize: 16,
        color: theme.textPrimary,
        borderWidth: 1,
        borderColor: theme.border,
    },
    goButton: {
        width: 56,
        height: 56,
        backgroundColor: theme.primary,
        borderRadius: borderRadius.medium,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusCard: {
        width: '100%',
        backgroundColor: theme.surface,
        borderRadius: borderRadius.large,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },
    statusLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        marginBottom: 16,
        letterSpacing: 1,
    },
    activeTagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.info,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: borderRadius.full,
        gap: 8,
        marginBottom: 16,
    },
    activeTagText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    countText: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.info,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: borderRadius.full,
        ...shadows.cardElevated,
        marginBottom: 24,
    },
    scanButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    lastActionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderRadius: borderRadius.medium,
        marginBottom: 24,
        width: '100%',
    },
    lastActionText: {
        marginLeft: 8,
        color: '#065F46',
        flex: 1,
    },
    stopButton: {
        padding: 16,
    },
    stopButtonText: {
        color: theme.textSecondary,
        textDecorationLine: 'underline',
    },
    feedbackOverlay: {
        position: 'absolute',
        top: '50%',
        left: '20%',
        right: '20%',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    feedbackText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 8,
        textAlign: 'center',
    },
});
