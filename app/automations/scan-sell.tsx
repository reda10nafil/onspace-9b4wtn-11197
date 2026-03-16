// FurInventory Pro - Scan to Sell Automation
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Vibration, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme, typography, borderRadius, spacing } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';
import BarcodeScanner from '../../components/BarcodeScanner';
import { soundService } from '../../services/SoundService';

export default function ScanSellScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { products, sellProduct, getProductBySku } = useInventory();

    const [scannedCount, setScannedCount] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [lastSoldProduct, setLastSoldProduct] = useState<string | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [pendingProduct, setPendingProduct] = useState<any>(null);
    const [priceInput, setPriceInput] = useState('');

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        setShowScanner(false);

        // Find product
        let product = products.find(p => p.id === data);
        if (!product) {
            product = getProductBySku(data);
        }

        if (product) {
            if (product.status === 'sold') {
                Alert.alert('Info', 'Questo prodotto risulta già venduto.');
                return;
            }

            // Open price confirmation modal
            setPendingProduct(product);
            setPriceInput(product.sellPrice ? product.sellPrice.toString() : '');
            setShowPriceModal(true);
        } else {
            soundService.playError();
            Alert.alert('Errore', 'Prodotto non trovato.');
        }
    };

    const confirmSale = () => {
        if (!pendingProduct) return;

        const finalPrice = priceInput ? parseFloat(priceInput) : undefined;

        sellProduct(pendingProduct.id, finalPrice);

        setScannedCount(c => c + 1);
        setTotalRevenue(r => r + (finalPrice || 0));
        setLastSoldProduct(`${pendingProduct.sku} - €${finalPrice || 0}`);

        soundService.playSuccess();

        setShowPriceModal(false);
        setPendingProduct(null);
        setPriceInput('');

        // Auto-reopen scanner for next sale
        setTimeout(() => setShowScanner(true), 500);
    };

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="close" size={24} color={theme.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>Vendita Flash</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{scannedCount}</Text>
                        <Text style={styles.statLabel}>Capi Venduti</Text>
                    </View>
                    <View style={[styles.statBox, { borderColor: theme.primary }]}>
                        <Text style={[styles.statValue, { color: theme.primary }]}>
                            €{totalRevenue.toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}>Totale</Text>
                    </View>
                </View>

                {lastSoldProduct && (
                    <View style={styles.lastActionCard}>
                        <MaterialIcons name="check-circle" size={24} color={theme.success} />
                        <Text style={styles.lastActionText}>
                            Venduto: <Text style={{ fontWeight: 'bold' }}>{lastSoldProduct}</Text>
                        </Text>
                    </View>
                )}

                <View style={styles.actionContainer}>
                    <MaterialIcons name="shopping-cart-checkout" size={64} color={theme.success} style={{ marginBottom: 16 }} />
                    <Text style={styles.instructions}>
                        Scansiona i prodotti in uscita per segnarli come VENDUTI e registrare il prezzo finale.
                    </Text>

                    <Pressable style={styles.scanButton} onPress={() => setShowScanner(true)}>
                        <MaterialIcons name="qr-code-scanner" size={32} color="#FFF" />
                        <Text style={styles.scanButtonText}>Scansiona Prodotto</Text>
                    </Pressable>
                </View>

            </ScrollView>

            {/* Price Confirmation Modal */}
            <Modal
                visible={showPriceModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPriceModal(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowPriceModal(false)}>
                    <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Conferma Vendita</Text>

                        {pendingProduct && (
                            <View style={styles.productInfo}>
                                <Text style={styles.productSku}>{pendingProduct.sku}</Text>
                                <Text style={styles.productType}>{pendingProduct.furType}</Text>
                            </View>
                        )}

                        <Text style={styles.inputLabel}>Prezzo Finale (€)</Text>
                        <TextInput
                            style={styles.priceInput}
                            keyboardType="numeric"
                            value={priceInput}
                            onChangeText={setPriceInput}
                            placeholder="0.00"
                            placeholderTextColor={theme.textSecondary}
                            autoFocus
                        />

                        <Pressable style={styles.confirmButton} onPress={confirmSale}>
                            <Text style={styles.confirmButtonText}>CONFERMA VENDITA</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Code Scanner Modal */}
            {showScanner && (
                <View style={StyleSheet.absoluteFill}>
                    <BarcodeScanner
                        onScan={handleBarCodeScanned}
                        onClose={() => setShowScanner(false)}
                    />
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
    statsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
        marginTop: 16,
    },
    statBox: {
        alignItems: 'center',
        backgroundColor: theme.surface,
        padding: 16,
        borderRadius: borderRadius.medium,
        minWidth: 140,
        borderWidth: 1,
        borderColor: theme.success,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.success,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        textTransform: 'uppercase',
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
    actionContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    instructions: {
        ...typography.body,
        textAlign: 'center',
        color: theme.textSecondary,
        marginBottom: 32,
        maxWidth: '80%',
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.success,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: borderRadius.full,
        elevation: 4,
        shadowColor: theme.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    scanButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: theme.surface,
        borderRadius: borderRadius.large,
        padding: 24,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.textPrimary,
        marginBottom: 20,
    },
    productInfo: {
        alignItems: 'center',
        marginBottom: 24,
    },
    productSku: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.primary,
    },
    productType: {
        fontSize: 16,
        color: theme.textSecondary,
    },
    inputLabel: {
        fontSize: 14,
        color: theme.textSecondary,
        alignSelf: 'flex-start',
        marginBottom: 8,
        marginLeft: 4,
    },
    priceInput: {
        width: '100%',
        backgroundColor: theme.backgroundSecondary,
        borderRadius: borderRadius.medium,
        padding: 16,
        fontSize: 24,
        color: theme.textPrimary,
        textAlign: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.border,
    },
    confirmButton: {
        width: '100%',
        backgroundColor: theme.success,
        borderRadius: borderRadius.medium,
        padding: 16,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
