// FurInventory Pro - Batch Move Automation
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Vibration, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { soundService } from '../../services/SoundService';
// import { Audio } from 'expo-av'; // Removed for now to simplify dependencies
import { theme, typography, borderRadius, spacing } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';
import { useLocations, Location } from '../../contexts/LocationsContext';
import BarcodeScanner from '../../components/BarcodeScanner';

type Step = 'scan_location' | 'scan_products';

export default function BatchMoveScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { products, updateProduct, getProductBySku } = useInventory();
    const { locations, getLocation, getNextLocation } = useLocations();

    const [step, setStep] = useState<Step>('scan_location');
    const [targetLocation, setTargetLocation] = useState<Location | null>(null);
    const [scannedCount, setScannedCount] = useState(0);
    const [lastScannedProduct, setLastScannedProduct] = useState<string | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    // Sound effects - use global service
    async function playSuccessSound() {
        soundService.playSuccess();
    }

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        // Only close scanner if we are scanning location (Step 1)
        if (step === 'scan_location') {
            setShowScanner(false);
            handleLocationScan(data);
        } else {
            // Continuous scanning for products
            handleProductScan(data);
        }
    };

    const handleLocationScan = (data: string) => {
        // Try to find location by ID, Label or Barcode
        const loc = locations.find(l => l.id === data || l.label === data || l.barcode === data);

        if (loc) {
            checkCapacityAndSetLocation(loc);
        } else {
            Alert.alert('Errore', 'Posizione non trovata nel database.');
        }
    };

    const checkCapacityAndSetLocation = (loc: Location) => {
        // Calculate current occupancy
        const currentItems = products.filter(p => p.location === loc.id).length;
        const capacity = loc.capacity || 9999; // Default infinite if not set

        if (currentItems >= capacity) {
            // Logic for Smart Suggestion
            const nextLoc = getNextLocation(loc.id);

            Alert.alert(
                '⚠️ Posizione Piena!',
                `La posizione "${loc.label}" ha raggiunto la capacità (${currentItems}/${capacity}).\n\nVuoi usare invece "${nextLoc?.label}" che è la più vicina?`,
                [
                    {
                        text: `Usa ${loc.label} comunque`,
                        style: 'cancel',
                        onPress: () => confirmLocation(loc)
                    },
                    nextLoc ? {
                        text: `Sì, usa ${nextLoc.label}`,
                        onPress: () => {
                            confirmLocation(nextLoc);
                        }
                    } : { text: 'OK', style: 'cancel' }
                ]
            );
        } else {
            confirmLocation(loc);
        }
    };

    const confirmLocation = (loc: Location) => {
        setTargetLocation(loc);
        setStep('scan_products');
        playSuccessSound();
    };

    const handleProductScan = async (data: string) => {
        // Check if scanned code is actually a Location (to switch target)
        const potentialLoc = locations.find(l => l.id === data || l.barcode === data);
        if (potentialLoc) {
            setShowScanner(false); // Pause scanner immediately to avoid spam
            Vibration.vibrate(100);
            Alert.alert(
                'Cambio Destinazione',
                `Vuoi cambiare la destinazione a "${potentialLoc.label}"?`,
                [
                    { text: 'No', style: 'cancel', onPress: () => setShowScanner(true) },
                    {
                        text: 'Sì',
                        onPress: () => {
                            checkCapacityAndSetLocation(potentialLoc);
                        }
                    }
                ]
            );
            return;
        }

        if (!targetLocation) return;

        // Find product - try ID first, then SKU
        let product = products.find(p => p.id === data);
        if (!product) {
            product = getProductBySku(data);
        }

        if (product) {
            if (product.location === targetLocation.id) {
                setFeedbackMessage(`${product.sku} già qui!`);
                setTimeout(() => setFeedbackMessage(null), 1000);
                return;
            }

            // Move product
            updateProduct(product.id, {
                location: targetLocation.id,
            });

            setScannedCount(c => c + 1);
            setLastScannedProduct(`${product.sku} (${product.furType})`);
            playSuccessSound();

            // Show overlay feedback
            setFeedbackMessage(`${product.sku} Spostato!`);
            setTimeout(() => setFeedbackMessage(null), 1000);

        } else {
            // Error feedback
            Vibration.vibrate(500);
            setFeedbackMessage(`Prodotto non trovato: ${data}`);
            setTimeout(() => setFeedbackMessage(null), 2000);
        }
    };

    const resetFlow = () => {
        setStep('scan_location');
        setTargetLocation(null);
        setScannedCount(0);
        setLastScannedProduct(null);
    };

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="close" size={24} color={theme.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>Spostamento Rapido</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {step === 'scan_location' ? (
                    <View style={styles.stepContainer}>
                        <MaterialIcons name="location-on" size={64} color={theme.primary} style={{ marginBottom: 16 }} />
                        <Text style={styles.stepTitle}>Fase 1: Scannerizza Posizione</Text>
                        <Text style={styles.stepDescription}>
                            Inquadra il QR della posizione o scaffale dove vuoi spostare la merce.
                        </Text>

                        <Pressable style={styles.scanButton} onPress={() => setShowScanner(true)}>
                            <MaterialIcons name="qr-code-scanner" size={32} color="#FFF" />
                            <Text style={styles.scanButtonText}>Scansiona Posizione</Text>
                        </Pressable>

                        {/* Manual Selection Fallback */}
                        <Text style={styles.divider}>OPPURE SELEZIONA</Text>
                        <View style={styles.locationsGrid}>
                            {locations.map(loc => (
                                <Pressable
                                    key={loc.id}
                                    style={[styles.locationChip, { borderColor: loc.color }]}
                                    onPress={() => checkCapacityAndSetLocation(loc)}
                                >
                                    <Text style={[styles.locationChipText, { color: loc.color }]}>{loc.label}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={styles.stepContainer}>
                        <View style={styles.targetCard}>
                            <Text style={styles.targetLabel}>Destinazione Attuale:</Text>
                            <Text style={styles.targetValue}>{targetLocation?.label}</Text>
                            <Pressable onPress={resetFlow} style={styles.changeTargetButton}>
                                <Text style={styles.changeTargetText}>Cambia</Text>
                            </Pressable>
                        </View>

                        <View style={styles.statsContainer}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{scannedCount}</Text>
                                <Text style={styles.statLabel}>Spostati</Text>
                            </View>
                        </View>

                        {lastScannedProduct && (
                            <View style={styles.lastActionCard}>
                                <MaterialIcons name="check-circle" size={24} color={theme.success} />
                                <Text style={styles.lastActionText}>
                                    Spostato: <Text style={{ fontWeight: 'bold' }}>{lastScannedProduct}</Text>
                                </Text>
                            </View>
                        )}

                        <Pressable style={[styles.scanButton, { backgroundColor: theme.info }]} onPress={() => setShowScanner(true)}>
                            <MaterialIcons name="qr-code-scanner" size={32} color="#FFF" />
                            <Text style={styles.scanButtonText}>Scansiona Prodotto</Text>
                        </Pressable>
                    </View>
                )}

            </ScrollView>

            {/* Code Scanner Modal */}
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
                                name={feedbackMessage.includes('non trovato') ? 'error-outline' : 'check-circle'}
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
        ...typography.cardTitle, // Fallback
        fontSize: 18,
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    stepContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
    },
    stepTitle: {
        ...typography.cardTitle, // Fallback
        fontSize: 24,
        marginBottom: 8,
        textAlign: 'center',
    },
    stepDescription: {
        ...typography.body,
        textAlign: 'center',
        color: theme.textSecondary,
        marginBottom: 32,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: borderRadius.full, // Fixed
        elevation: 4,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        marginBottom: 24,
    },
    scanButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    divider: {
        ...typography.caption,
        color: theme.textSecondary,
        marginBottom: 16,
    },
    locationsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    locationChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: borderRadius.full, // Fixed
        borderWidth: 1,
        backgroundColor: theme.surface,
    },
    locationChipText: {
        fontWeight: '600',
        fontSize: 14,
    },
    targetCard: {
        width: '100%',
        backgroundColor: theme.surface,
        padding: 16,
        borderRadius: borderRadius.large, // Fixed
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 24,
    },
    targetLabel: {
        ...typography.caption,
        color: theme.textSecondary,
        marginBottom: 4,
    },
    targetValue: {
        ...typography.cardValue, // Fallback
        fontSize: 32,
        color: theme.primary,
        marginBottom: 8,
    },
    changeTargetButton: {
        padding: 4,
    },
    changeTargetText: {
        color: theme.textSecondary,
        textDecorationLine: 'underline',
    },
    statsContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    statBox: {
        alignItems: 'center',
        backgroundColor: theme.surface,
        padding: 20,
        borderRadius: borderRadius.full, // Fixed
        width: 120,
        height: 120,
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: theme.success,
    },
    statValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: theme.textPrimary,
    },
    statLabel: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    lastActionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderRadius: borderRadius.medium, // Fixed
        marginBottom: 24,
        width: '100%',
    },
    lastActionText: {
        marginLeft: 8,
        color: '#065F46',
        flex: 1,
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
    }
});
