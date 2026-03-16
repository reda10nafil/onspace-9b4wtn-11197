// FurInventory Pro - Automation Builder
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView, Alert,
    TextInput, Modal, FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme, borderRadius, spacing } from '../../constants/theme';
import {
    useAutomations,
    AutomationStep,
    StepType,
    STEP_TYPE_META,
    CustomAutomation,
} from '../../contexts/AutomationsContext';
import { useLocations } from '../../contexts/LocationsContext';

// ── Available step types for the picker ────────────────────
const AVAILABLE_STEPS: { type: StepType; description: string }[] = [
    { type: 'scan_product', description: 'Attendi la scansione di un prodotto' },
    { type: 'scan_location', description: 'Attendi la scansione di una posizione' },
    { type: 'move_to', description: 'Sposta il prodotto nella posizione' },
    { type: 'mark_sold', description: 'Segna il prodotto come venduto' },
    { type: 'add_tag', description: 'Aggiungi un tag al prodotto' },
    { type: 'set_field', description: 'Imposta un campo personalizzato' },
];

const ICON_OPTIONS = [
    'flash-on', 'local-shipping', 'inventory', 'sell', 'label',
    'qr-code-scanner', 'star', 'build', 'cleaning-services', 'category',
];

const COLOR_OPTIONS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#D4AF37', '#6366F1', '#14B8A6',
];

export default function AutomationBuilderScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { addAutomation, updateAutomation, getAutomationById } = useAutomations();
    const { locations } = useLocations();

    // Edit mode
    const editId = params.editId as string | undefined;
    const existing = editId ? getAutomationById(editId) : undefined;

    const [name, setName] = useState(existing?.name || '');
    const [description, setDescription] = useState(existing?.description || '');
    const [icon, setIcon] = useState(existing?.icon || 'flash-on');
    const [color, setColor] = useState(existing?.color || '#3B82F6');
    const [steps, setSteps] = useState<AutomationStep[]>(existing?.steps || []);

    const [showStepPicker, setShowStepPicker] = useState(false);
    const [configStep, setConfigStep] = useState<AutomationStep | null>(null);
    const [showConfigModal, setShowConfigModal] = useState(false);

    // Config modal temps
    const [configTag, setConfigTag] = useState('');
    const [configFieldName, setConfigFieldName] = useState('');
    const [configFieldValue, setConfigFieldValue] = useState('');
    const [configLocationId, setConfigLocationId] = useState('');
    const [configPricePrompt, setConfigPricePrompt] = useState(true);
    const [configUseLastScanned, setConfigUseLastScanned] = useState(true);

    // ── Add Step ──────────────────────────────────────────────
    const handleAddStep = (type: StepType) => {
        setShowStepPicker(false);
        const meta = STEP_TYPE_META[type];
        const newStep: AutomationStep = {
            id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            order: steps.length,
            type,
            config: {},
            label: meta.label,
        };

        // Steps needing config
        if (['move_to', 'add_tag', 'set_field', 'mark_sold'].includes(type)) {
            setConfigStep(newStep);
            // Pre-fill config defaults
            setConfigTag('');
            setConfigFieldName('');
            setConfigFieldValue('');
            setConfigLocationId('');
            setConfigPricePrompt(true);
            setConfigUseLastScanned(true);
            setShowConfigModal(true);
        } else {
            setSteps(prev => [...prev, newStep]);
        }
    };

    const handleSaveConfig = () => {
        if (!configStep) return;
        const updated = { ...configStep };

        if (configStep.type === 'add_tag') {
            if (!configTag.trim()) { Alert.alert('Errore', 'Inserisci un tag.'); return; }
            updated.config.tag = configTag.trim();
            updated.label = `Aggiungi Tag: ${configTag.trim()}`;
        } else if (configStep.type === 'set_field') {
            if (!configFieldName.trim()) { Alert.alert('Errore', 'Inserisci il nome del campo.'); return; }
            updated.config.fieldName = configFieldName.trim();
            updated.config.fieldValue = configFieldValue.trim();
            updated.label = `Imposta ${configFieldName.trim()} = ${configFieldValue.trim()}`;
        } else if (configStep.type === 'move_to') {
            updated.config.useLastScannedLocation = configUseLastScanned;
            if (!configUseLastScanned) {
                if (!configLocationId) { Alert.alert('Errore', 'Seleziona una posizione.'); return; }
                updated.config.locationId = configLocationId;
                const loc = locations.find(l => l.id === configLocationId);
                updated.config.locationName = loc?.label || configLocationId;
                updated.label = `Sposta in: ${loc?.label || configLocationId}`;
            } else {
                updated.label = 'Sposta nella Posizione Scansionata';
            }
        } else if (configStep.type === 'mark_sold') {
            updated.config.pricePrompt = configPricePrompt;
            updated.label = configPricePrompt ? 'Vendi (con conferma prezzo)' : 'Vendi (prezzo catalogo)';
        }

        setSteps(prev => [...prev, updated]);
        setShowConfigModal(false);
        setConfigStep(null);
    };

    // ── Remove Step ───────────────────────────────────────────
    const removeStep = (id: string) => {
        setSteps(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })));
    };

    // ── Save Automation ───────────────────────────────────────
    const handleSave = () => {
        if (!name.trim()) { Alert.alert('Errore', 'Dai un nome all\'automazione.'); return; }
        if (steps.length === 0) { Alert.alert('Errore', 'Aggiungi almeno uno step.'); return; }

        if (existing) {
            updateAutomation(existing.id, { name, description, icon, color, steps });
            Alert.alert('Salvato!', `"${name}" aggiornata.`, [{ text: 'OK', onPress: () => router.back() }]);
        } else {
            const created = addAutomation({ name, description, icon, color, steps });
            Alert.alert('Creato!', `"${name}" creata. Puoi trovarla nel Centro Automazioni.`, [
                { text: 'OK', onPress: () => router.back() },
            ]);
        }
    };

    // ── Render ────────────────────────────────────────────────
    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="close" size={24} color={theme.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>{existing ? 'Modifica Automazione' : 'Nuova Automazione'}</Text>
                <Pressable onPress={handleSave} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Salva</Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                {/* ── Name & Description ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>NOME</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Es. Scarico Merci"
                        placeholderTextColor={theme.textSecondary}
                    />

                    <Text style={[styles.sectionLabel, { marginTop: 16 }]}>DESCRIZIONE (opzionale)</Text>
                    <TextInput
                        style={[styles.input, { height: 60 }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Cosa fa questa automazione?"
                        placeholderTextColor={theme.textSecondary}
                        multiline
                    />
                </View>

                {/* ── Icon & Color ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ICONA & COLORE</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {ICON_OPTIONS.map(ic => (
                            <Pressable
                                key={ic}
                                onPress={() => setIcon(ic)}
                                style={[styles.iconChip, icon === ic && { backgroundColor: `${color}30`, borderColor: color }]}
                            >
                                <MaterialIcons name={ic as any} size={24} color={icon === ic ? color : theme.textSecondary} />
                            </Pressable>
                        ))}
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {COLOR_OPTIONS.map(c => (
                            <Pressable
                                key={c}
                                onPress={() => setColor(c)}
                                style={[styles.colorChip, { backgroundColor: c }, color === c && styles.colorChipActive]}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* ── Flow Map ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>FLUSSO DI LAVORO</Text>

                    {steps.length === 0 ? (
                        <View style={styles.emptyFlow}>
                            <MaterialIcons name="account-tree" size={48} color={theme.textSecondary} />
                            <Text style={styles.emptyFlowText}>Nessuno step aggiunto</Text>
                            <Text style={styles.emptyFlowHint}>Premi "+" per costruire il flusso</Text>
                        </View>
                    ) : (
                        <View style={styles.flowContainer}>
                            {steps.map((step, index) => {
                                const meta = STEP_TYPE_META[step.type];
                                return (
                                    <View key={step.id}>
                                        {/* Step node */}
                                        <View style={styles.flowNode}>
                                            <View style={[styles.flowNodeIcon, { backgroundColor: `${meta.color}20` }]}>
                                                <MaterialIcons name={meta.icon as any} size={24} color={meta.color} />
                                            </View>
                                            <View style={styles.flowNodeContent}>
                                                <Text style={styles.flowNodeLabel}>{step.label}</Text>
                                                <Text style={styles.flowNodeMeta}>Step {index + 1} · {meta.label}</Text>
                                            </View>
                                            <Pressable onPress={() => removeStep(step.id)} hitSlop={8}>
                                                <MaterialIcons name="delete-outline" size={20} color={theme.textSecondary} />
                                            </Pressable>
                                        </View>
                                        {/* Arrow connector */}
                                        {index < steps.length - 1 && (
                                            <View style={styles.flowConnector}>
                                                <View style={styles.flowLine} />
                                                <MaterialIcons name="arrow-downward" size={16} color={theme.textSecondary} />
                                                <View style={styles.flowLine} />
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Add step button */}
                    <Pressable style={[styles.addStepButton, { borderColor: color }]} onPress={() => setShowStepPicker(true)}>
                        <MaterialIcons name="add" size={24} color={color} />
                        <Text style={[styles.addStepText, { color }]}>Aggiungi Step</Text>
                    </Pressable>
                </View>

                {/* ── Preview badge ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ANTEPRIMA</Text>
                    <View style={styles.previewCard}>
                        <View style={[styles.previewIcon, { backgroundColor: `${color}20` }]}>
                            <MaterialIcons name={icon as any} size={32} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.previewName}>{name || 'Nome automazione'}</Text>
                            <Text style={styles.previewSteps}>{steps.length} step · QR: AUTO:...</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* ── Step Picker Modal ── */}
            <Modal visible={showStepPicker} transparent animationType="slide" onRequestClose={() => setShowStepPicker(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowStepPicker(false)}>
                    <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Scegli Tipo di Step</Text>
                        {AVAILABLE_STEPS.map(as => {
                            const meta = STEP_TYPE_META[as.type];
                            return (
                                <Pressable key={as.type} style={styles.stepOption} onPress={() => handleAddStep(as.type)}>
                                    <View style={[styles.stepOptionIcon, { backgroundColor: `${meta.color}20` }]}>
                                        <MaterialIcons name={meta.icon as any} size={24} color={meta.color} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.stepOptionTitle}>{meta.label}</Text>
                                        <Text style={styles.stepOptionDesc}>{as.description}</Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ── Config Modal ── */}
            <Modal visible={showConfigModal} transparent animationType="slide" onRequestClose={() => setShowConfigModal(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowConfigModal(false)}>
                    <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Configura Step</Text>

                        {configStep?.type === 'add_tag' && (
                            <View>
                                <Text style={styles.configLabel}>Tag da applicare:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={configTag}
                                    onChangeText={setConfigTag}
                                    placeholder="Es. Da Pulire"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        )}

                        {configStep?.type === 'set_field' && (
                            <View>
                                <Text style={styles.configLabel}>Nome Campo:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={configFieldName}
                                    onChangeText={setConfigFieldName}
                                    placeholder="Es. Stato"
                                    placeholderTextColor={theme.textSecondary}
                                />
                                <Text style={[styles.configLabel, { marginTop: 12 }]}>Valore:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={configFieldValue}
                                    onChangeText={setConfigFieldValue}
                                    placeholder="Es. Controllato"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        )}

                        {configStep?.type === 'move_to' && (
                            <View>
                                <Pressable
                                    style={styles.toggleRow}
                                    onPress={() => setConfigUseLastScanned(!configUseLastScanned)}
                                >
                                    <MaterialIcons
                                        name={configUseLastScanned ? 'check-box' : 'check-box-outline-blank'}
                                        size={24}
                                        color={color}
                                    />
                                    <Text style={styles.toggleLabel}>Usa l'ultima posizione scansionata</Text>
                                </Pressable>
                                {!configUseLastScanned && (
                                    <View style={{ marginTop: 12 }}>
                                        <Text style={styles.configLabel}>Posizione fissa:</Text>
                                        {locations.map(loc => (
                                            <Pressable
                                                key={loc.id}
                                                style={[styles.locationOption, configLocationId === loc.id && { borderColor: color, backgroundColor: `${color}15` }]}
                                                onPress={() => setConfigLocationId(loc.id)}
                                            >
                                                <MaterialIcons name="location-on" size={20} color={configLocationId === loc.id ? color : theme.textSecondary} />
                                                <Text style={[styles.locationOptionText, configLocationId === loc.id && { color }]}>{loc.label}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {configStep?.type === 'mark_sold' && (
                            <View>
                                <Pressable
                                    style={styles.toggleRow}
                                    onPress={() => setConfigPricePrompt(!configPricePrompt)}
                                >
                                    <MaterialIcons
                                        name={configPricePrompt ? 'check-box' : 'check-box-outline-blank'}
                                        size={24}
                                        color={color}
                                    />
                                    <Text style={styles.toggleLabel}>Chiedi conferma prezzo</Text>
                                </Pressable>
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                            <Pressable style={[styles.configButton, { backgroundColor: theme.surface }]} onPress={() => { setShowConfigModal(false); setConfigStep(null); }}>
                                <Text style={{ color: theme.textPrimary }}>Annulla</Text>
                            </Pressable>
                            <Pressable style={[styles.configButton, { backgroundColor: color, flex: 2 }]} onPress={handleSaveConfig}>
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Aggiungi</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary },
    saveButton: {
        backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: borderRadius.medium,
    },
    saveButtonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
    section: { padding: spacing.screenPadding, borderBottomWidth: 1, borderBottomColor: theme.border },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 12, letterSpacing: 1 },
    input: {
        backgroundColor: theme.surface, borderRadius: borderRadius.medium,
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
        color: theme.textPrimary, borderWidth: 1, borderColor: theme.border,
    },
    iconChip: {
        width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
        marginRight: 10, borderWidth: 2, borderColor: 'transparent',
        backgroundColor: theme.surface,
    },
    colorChip: {
        width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 3, borderColor: 'transparent',
    },
    colorChipActive: { borderColor: '#FFF', transform: [{ scale: 1.15 }] },
    emptyFlow: { alignItems: 'center', padding: 32 },
    emptyFlowText: { fontSize: 16, color: theme.textSecondary, marginTop: 12 },
    emptyFlowHint: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
    flowContainer: { marginBottom: 16 },
    flowNode: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface,
        padding: 14, borderRadius: borderRadius.medium, borderWidth: 1, borderColor: theme.border,
    },
    flowNodeIcon: {
        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    flowNodeContent: { flex: 1, marginRight: 8 },
    flowNodeLabel: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
    flowNodeMeta: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    flowConnector: { alignItems: 'center', paddingVertical: 4 },
    flowLine: { width: 2, height: 8, backgroundColor: theme.border },
    addStepButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        padding: 14, borderRadius: borderRadius.medium, borderWidth: 2,
        borderStyle: 'dashed',
    },
    addStepText: { fontSize: 15, fontWeight: '600', marginLeft: 8 },
    previewCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface,
        padding: 16, borderRadius: borderRadius.large, borderWidth: 1, borderColor: theme.border,
    },
    previewIcon: {
        width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 16,
    },
    previewName: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
    previewSteps: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 20, textAlign: 'center',
    },
    stepOption: {
        flexDirection: 'row', alignItems: 'center', padding: 14,
        borderRadius: borderRadius.medium, marginBottom: 10,
        backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border,
    },
    stepOptionIcon: {
        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    stepOptionTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
    stepOptionDesc: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
    configLabel: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    toggleLabel: { fontSize: 15, color: theme.textPrimary, flex: 1 },
    locationOption: {
        flexDirection: 'row', alignItems: 'center', padding: 12,
        borderRadius: borderRadius.medium, backgroundColor: theme.background,
        borderWidth: 1, borderColor: theme.border, marginBottom: 8, gap: 10,
    },
    locationOptionText: { fontSize: 15, color: theme.textPrimary },
    configButton: {
        flex: 1, padding: 14, borderRadius: borderRadius.medium, alignItems: 'center',
        borderWidth: 1, borderColor: theme.border,
    },
});
