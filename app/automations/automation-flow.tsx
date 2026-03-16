// FurInventory Pro - Automation Flow View (Mappa Concettuale)
import React, { useRef } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView, Share, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme, borderRadius, spacing } from '../../constants/theme';
import { useAutomations, STEP_TYPE_META } from '../../contexts/AutomationsContext';
import QRCode from 'react-native-qrcode-svg';

export default function AutomationFlowScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { getAutomationById, deleteAutomation } = useAutomations();

    const automation = getAutomationById(id as string);

    if (!automation) {
        return (
            <SafeAreaView edges={['top']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialIcons name="error-outline" size={64} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 16 }}>Automazione non trovata</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: 24, padding: 12 }}>
                    <Text style={{ color: theme.primary, fontSize: 16 }}>Torna Indietro</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const handleDelete = () => {
        Alert.alert('Elimina Automazione', `Sei sicuro di voler eliminare "${automation.name}"?`, [
            { text: 'Annulla', style: 'cancel' },
            {
                text: 'Elimina', style: 'destructive',
                onPress: () => { deleteAutomation(automation.id); router.back(); },
            },
        ]);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Automazione: ${automation.name}\nQR Code: ${automation.qrValue}\n\nStep:\n${automation.steps.map((s, i) => `${i + 1}. ${s.label}`).join('\n')}`,
            });
        } catch (e) { /* ignore */ }
    };

    const handleRun = () => {
        router.push({ pathname: '/automations/custom-runner', params: { id: automation.id } } as any);
    };

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{automation.name}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable onPress={() => router.push({ pathname: '/settings/automation-builder', params: { editId: automation.id } } as any)}>
                        <MaterialIcons name="edit" size={22} color={theme.textSecondary} />
                    </Pressable>
                    <Pressable onPress={handleDelete}>
                        <MaterialIcons name="delete" size={22} color="#EF4444" />
                    </Pressable>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: insets.bottom + 100 }}>
                {/* Automation info */}
                <View style={styles.infoCard}>
                    <View style={[styles.infoIcon, { backgroundColor: `${automation.color}20` }]}>
                        <MaterialIcons name={automation.icon as any} size={36} color={automation.color} />
                    </View>
                    <Text style={styles.infoName}>{automation.name}</Text>
                    {automation.description ? <Text style={styles.infoDesc}>{automation.description}</Text> : null}
                    <View style={styles.infoStats}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{automation.steps.length}</Text>
                            <Text style={styles.statLabel}>Step</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{automation.usageCount}</Text>
                            <Text style={styles.statLabel}>Utilizzi</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>
                                {automation.lastUsedAt
                                    ? new Date(automation.lastUsedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
                                    : 'Mai'}
                            </Text>
                            <Text style={styles.statLabel}>Ultimo uso</Text>
                        </View>
                    </View>
                </View>

                {/* ── FLOW MAP ── */}
                <Text style={styles.sectionLabel}>MAPPA DEL FLUSSO</Text>
                <View style={styles.flowMap}>
                    {/* START node */}
                    <View style={styles.flowStartEnd}>
                        <MaterialIcons name="play-circle-filled" size={28} color="#10B981" />
                        <Text style={styles.flowStartEndText}>INIZIO</Text>
                    </View>
                    <View style={styles.connectorLine} />

                    {automation.steps.map((step, index) => {
                        const meta = STEP_TYPE_META[step.type];
                        const isLoop = step.type === 'scan_product' || step.type === 'scan_location';
                        return (
                            <View key={step.id}>
                                <View style={[styles.flowCard, { borderLeftColor: meta.color, borderLeftWidth: 4 }]}>
                                    <View style={styles.flowCardHeader}>
                                        <View style={[styles.stepBadge, { backgroundColor: meta.color }]}>
                                            <Text style={styles.stepBadgeText}>{index + 1}</Text>
                                        </View>
                                        <MaterialIcons name={meta.icon as any} size={20} color={meta.color} />
                                        <Text style={styles.flowCardType}>{meta.label}</Text>
                                    </View>
                                    <Text style={styles.flowCardLabel}>{step.label}</Text>
                                    {isLoop && <Text style={styles.flowCardLoop}>🔄 Ripetibile — fino a chiusura manuale</Text>}
                                </View>
                                {index < automation.steps.length - 1 && (
                                    <View style={styles.connectorArrow}>
                                        <View style={styles.connectorLine} />
                                        <MaterialIcons name="arrow-downward" size={20} color={theme.textSecondary} />
                                        <View style={styles.connectorLine} />
                                    </View>
                                )}
                            </View>
                        );
                    })}

                    <View style={styles.connectorLine} />
                    {/* END node */}
                    <View style={styles.flowStartEnd}>
                        <MaterialIcons name="stop-circle" size={28} color="#EF4444" />
                        <Text style={styles.flowStartEndText}>FINE</Text>
                    </View>
                </View>

                {/* ── QR CODE ── */}
                <Text style={styles.sectionLabel}>QR CODE DELL'AUTOMAZIONE</Text>
                <View style={styles.qrContainer}>
                    <View style={styles.qrWrapper}>
                        <QRCode value={automation.qrValue} size={180} backgroundColor="#FFF" color="#000" />
                    </View>
                    <Text style={styles.qrValue}>{automation.qrValue}</Text>
                    <Text style={styles.qrHint}>Stampa o salva questo QR. Scansionalo per avviare l'automazione.</Text>
                    <Pressable onPress={handleShare} style={styles.shareButton}>
                        <MaterialIcons name="share" size={20} color="#FFF" />
                        <Text style={styles.shareButtonText}>Condividi</Text>
                    </Pressable>
                </View>
            </ScrollView>

            {/* ── Floating Run Button ── */}
            <View style={[styles.floatingBar, { paddingBottom: insets.bottom + 16 }]}>
                <Pressable style={[styles.runButton, { backgroundColor: automation.color }]} onPress={handleRun}>
                    <MaterialIcons name="play-arrow" size={28} color="#FFF" />
                    <Text style={styles.runButtonText}>Avvia Automazione</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    backButton: { marginRight: 12 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, flex: 1 },
    infoCard: {
        backgroundColor: theme.surface, borderRadius: borderRadius.large,
        padding: 24, alignItems: 'center', marginBottom: 24,
        borderWidth: 1, borderColor: theme.border,
    },
    infoIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    infoName: { fontSize: 22, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 4 },
    infoDesc: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 16 },
    infoStats: { flexDirection: 'row', gap: 24, marginTop: 12 },
    stat: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: theme.textPrimary },
    statLabel: { fontSize: 11, color: theme.textSecondary, marginTop: 2, textTransform: 'uppercase' },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 12, letterSpacing: 1 },
    flowMap: { alignItems: 'center', marginBottom: 32 },
    flowStartEnd: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    flowStartEndText: { fontSize: 12, fontWeight: '700', color: theme.textSecondary, letterSpacing: 1 },
    connectorLine: { width: 2, height: 16, backgroundColor: theme.border },
    connectorArrow: { alignItems: 'center', paddingVertical: 2 },
    flowCard: {
        width: '100%', backgroundColor: theme.surface, borderRadius: borderRadius.medium,
        padding: 16, borderWidth: 1, borderColor: theme.border,
    },
    flowCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    stepBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    stepBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    flowCardType: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
    flowCardLabel: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
    flowCardLoop: { fontSize: 12, color: '#F59E0B', marginTop: 6 },
    qrContainer: {
        backgroundColor: theme.surface, borderRadius: borderRadius.large,
        padding: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.border,
    },
    qrWrapper: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16 },
    qrValue: { fontSize: 13, color: theme.textSecondary, fontFamily: 'monospace', marginBottom: 8 },
    qrHint: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginBottom: 16 },
    shareButton: {
        flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.info,
        paddingVertical: 10, paddingHorizontal: 20, borderRadius: borderRadius.full,
    },
    shareButtonText: { color: '#FFF', fontWeight: '600' },
    floatingBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: spacing.screenPadding, paddingTop: 12,
        backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.border,
    },
    runButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, borderRadius: borderRadius.full, gap: 8,
    },
    runButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
