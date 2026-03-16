// FurInventory Pro - Layout Builder Screen
// Simple implementation to customize Add Product layout (no Reanimated dependencies)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme, typography, borderRadius, spacing } from '../../constants/theme';
import { useLayout, LayoutField, FieldSize } from '../../contexts/LayoutContext';
import { useCustomFields } from '../../contexts/CustomFieldsContext';
import { PREDEFINED_TEMPLATES } from '../../lib/templates';

const SIZE_OPTIONS: { value: FieldSize; label: string; width: string }[] = [
    { value: 'small', label: '1/3', width: '33%' },
    { value: 'medium', label: '1/2', width: '50%' },
    { value: 'full', label: 'Intera', width: '100%' },
];

// Extended icon library organized by category
const COMMON_ICONS = [
    // Prodotti e Inventario
    'qr-code', 'qr-code-2', 'inventory', 'inventory-2', 'category', 'sell', 'local-offer',
    'shopping-cart', 'shopping-bag', 'storefront', 'store', 'warehouse',

    // Misure e Dimensioni  
    'straighten', 'square-foot', 'crop-free', 'aspect-ratio', 'height', 'timeline',
    'fitness-center', 'scale', 'monitor-weight',

    // Denaro e Prezzi
    'euro', 'euro-symbol', 'attach-money', 'money', 'paid', 'price-check',
    'account-balance-wallet', 'credit-card', 'receipt', 'receipt-long',

    // Posizione e Luoghi
    'place', 'location-on', 'my-location', 'map', 'pin-drop', 'room',
    'folder', 'folder-open', 'create-new-folder',

    // Note e Documenti
    'notes', 'description', 'article', 'text-fields', 'edit-note', 'sticky-note-2',
    'comment', 'chat', 'format-quote',

    // Immagini e Media
    'image', 'photo', 'add-photo-alternate', 'photo-library', 'camera-alt',
    'collections', 'panorama', 'filter',

    // Spedizione e Logistica
    'local-shipping', 'airport-shuttle', 'flight', 'directions-car',

    // Tempo e Date
    'timer', 'schedule', 'history', 'today', 'event', 'calendar-today', 'access-time',

    // Stato e Azioni
    'check-circle', 'verified', 'new-releases', 'star', 'favorite', 'bookmark',
    'flag', 'label', 'tag', 'loyalty',

    // Persone e Contatti
    'person', 'people', 'contacts', 'badge', 'work', 'business',

    // UI e Navigazione
    'menu', 'dashboard', 'grid-view', 'view-list', 'format-list-bulleted',
    'layers', 'widgets', 'apps', 'extension', 'tune', 'settings',

    // Altro
    'info', 'help', 'lightbulb', 'highlight', 'palette', 'brush',
    'diamond', 'workspace-premium', 'eco', 'spa', 'ac-unit',
];

export default function LayoutBuilderScreen() {
    const router = useRouter();
    const {
        layout,
        updateFieldOrder,
        updateFieldSize,
        toggleFieldVisibility,
        addFieldToLayout,
        removeFieldFromLayout,
        addSectionHeader,
        removeSectionHeader,
        updateSectionLabel,
        updateFieldIcon,
        saveLayout,
        applyTemplate,
    } = useLayout();
    const { customFields, addField } = useCustomFields();

    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [localFields, setLocalFields] = useState<LayoutField[]>([]);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [showAddFieldModal, setShowAddFieldModal] = useState(false);

    // Initialize local fields from layout
    useEffect(() => {
        setLocalFields([...layout.fields]);
    }, [layout.fields]);

    const moveField = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === localFields.length - 1) return;

        const newFields = [...localFields];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];

        setLocalFields(newFields);
        updateFieldOrder(newFields);
        setHasChanges(true);
    };

    const handleSizeChange = (fieldId: string, size: FieldSize) => {
        const newFields = localFields.map(f =>
            f.id === fieldId ? { ...f, size } : f
        );
        setLocalFields(newFields);
        updateFieldSize(fieldId, size);
        setHasChanges(true);
    };

    const handleToggleVisibility = (fieldId: string) => {
        const newFields = localFields.map(f =>
            f.id === fieldId ? { ...f, visible: !f.visible } : f
        );
        setLocalFields(newFields);
        toggleFieldVisibility(fieldId);
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await saveLayout();
            setHasChanges(false);
            Alert.alert('Salvato', 'Il layout è stato applicato alla pagina Aggiungi Prodotto');
        } catch (error) {
            Alert.alert('Errore', 'Impossibile salvare il layout');
        }
    };

    const loadTemplate = (templateId: string) => {
        const template = PREDEFINED_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        Alert.alert(
            'Carica Modello',
            `Inietto il modello "${template.name}"? Verranno aggiunti i campi personalizzati (se non esistono già).`,
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Applica Modello',
                    onPress: async () => {
                        try {
                            for (const f of template.customFields) {
                                if (!customFields.some(existing => existing.name === f.name)) {
                                    await addField(f);
                                }
                            }
                            // Construct new layout fields for the template
                            let templateFields: LayoutField[] = [];
                            if (template.layoutFields && template.layoutFields.length > 0) {
                                templateFields = template.layoutFields.map((lf: any) => ({
                                    ...lf,
                                    id: lf.id || lf._tempId || 'temp'
                                })) as LayoutField[];
                            } else {
                                // Fallback: just add the template custom fields to the bottom of the current layout
                                const currentLayout = [...localFields];
                                for (const f of template.customFields) {
                                    const matchingCustomField = customFields.find(cf => cf.name === f.name);
                                    if (matchingCustomField && !currentLayout.some(lf => lf.id === matchingCustomField.id)) {
                                        currentLayout.push({
                                            id: matchingCustomField.id,
                                            type: 'custom',
                                            size: 'medium',
                                            visible: true
                                        });
                                    }
                                }
                                templateFields = currentLayout;
                            }

                            applyTemplate(templateFields);
                            setLocalFields(templateFields);
                            setShowTemplatesModal(false);
                            setHasChanges(true);
                            Alert.alert('Modello Caricato', 'Layout sostituito con successo!');
                        } catch (e) {
                            Alert.alert('Errore', 'Impossibile applicare il modello');
                        }
                    }
                }
            ]
        );
    };

    const getFieldLabelForItem = (field: LayoutField): string => {
        if (field.label) return field.label; // section or override
        const customField = customFields.find(cf => cf.id === field.id);
        return customField?.name || field.id;
    };

    const getFieldIconForItem = (field: LayoutField): string => {
        if (field.icon) return field.icon; // override
        const customField = customFields.find(cf => cf.id === field.id);
        return customField?.icon || 'tune';
    };

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            {/* Instructions */}
            <View style={styles.instructionsContainer}>
                <MaterialIcons name="info-outline" size={20} color={theme.primary} />
                <Text style={styles.instructionsText}>
                    Usa le frecce per riordinare. Tocca per modificare dimensione.
                </Text>
            </View>

            <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>CONFIGURA CAMPI</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    <Pressable onPress={() => setShowTemplatesModal(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${theme.primary}20`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                        <MaterialIcons name="auto-awesome" size={18} color={theme.primary} />
                        <Text style={{ ...typography.caption, color: theme.primary, fontWeight: '600' }}>MODELLI</Text>
                    </Pressable>
                    <Pressable onPress={() => {
                        addSectionHeader('NUOVA SEZIONE');
                        setHasChanges(true);
                    }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
                        <MaterialIcons name="playlist-add" size={18} color={theme.primary} />
                        <Text style={{ ...typography.caption, color: theme.primary, fontWeight: '600' }}>SEZIONE</Text>
                    </Pressable>
                    <Pressable onPress={() => setShowAddFieldModal(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
                        <MaterialIcons name="add" size={18} color={theme.primary} />
                        <Text style={{ ...typography.caption, color: theme.primary, fontWeight: '600' }}>CAMPO</Text>
                    </Pressable>
                </ScrollView>
            </View>

            {/* Field List */}
            <ScrollView
                style={styles.listContainer}
                contentContainerStyle={styles.listContent}
            >
                {localFields.map((item, index) => {
                    const isSelected = selectedFieldId === item.id;
                    const isSection = item.type === 'section';

                    return (
                        <View key={item.id}>
                            <Pressable
                                onPress={() => setSelectedFieldId(isSelected ? null : item.id)}
                                style={[
                                    styles.fieldCard,
                                    !item.visible && styles.fieldCardHidden,
                                    isSelected && styles.fieldCardSelected,
                                    isSection && { borderColor: theme.border, borderStyle: 'dashed' }
                                ]}
                            >
                                <View style={styles.fieldCardHeader}>
                                    {/* Move Buttons */}
                                    <View style={styles.moveButtons}>
                                        <Pressable
                                            style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                                            onPress={() => moveField(index, 'up')}
                                            disabled={index === 0}
                                        >
                                            <MaterialIcons
                                                name="keyboard-arrow-up"
                                                size={20}
                                                color={index === 0 ? theme.border : theme.textSecondary}
                                            />
                                        </Pressable>
                                        <Pressable
                                            style={[styles.moveButton, index === localFields.length - 1 && styles.moveButtonDisabled]}
                                            onPress={() => moveField(index, 'down')}
                                            disabled={index === localFields.length - 1}
                                        >
                                            <MaterialIcons
                                                name="keyboard-arrow-down"
                                                size={20}
                                                color={index === localFields.length - 1 ? theme.border : theme.textSecondary}
                                            />
                                        </Pressable>
                                    </View>

                                    {isSection ? (
                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <MaterialIcons name="menu" size={20} color={theme.textSecondary} />
                                            <TextInput
                                                style={{ flex: 1, ...typography.cardTitle, fontSize: 15, paddingVertical: 0 }}
                                                value={item.label}
                                                onChangeText={(text) => {
                                                    const newFields = localFields.map(f => f.id === item.id ? { ...f, label: text } : f);
                                                    setLocalFields(newFields);
                                                    updateSectionLabel(item.id, text);
                                                    setHasChanges(true);
                                                }}
                                                placeholder="Nome Sezione"
                                                placeholderTextColor={theme.textSecondary}
                                            />
                                            <Pressable onPress={() => {
                                                Alert.alert('Elimina Sezione', 'Sei sicuro?', [
                                                    { text: 'Annulla', style: 'cancel' },
                                                    {
                                                        text: 'Elimina', style: 'destructive', onPress: () => {
                                                            removeSectionHeader(item.id);
                                                            setHasChanges(true); // Sync will happen via effect
                                                        }
                                                    }
                                                ])
                                            }}>
                                                <MaterialIcons name="delete-outline" size={20} color={theme.error} />
                                            </Pressable>
                                        </View>
                                    ) : (
                                        <>
                                            <MaterialIcons
                                                name={getFieldIconForItem(item) as any}
                                                size={20}
                                                color={item.visible ? theme.primary : theme.textSecondary}
                                            />
                                            <Text style={[
                                                styles.fieldCardTitle,
                                                !item.visible && styles.fieldCardTitleHidden,
                                            ]}>
                                                {getFieldLabelForItem(item)}
                                            </Text>

                                            <View style={styles.sizeIndicatorContainer}>
                                                <View style={[
                                                    styles.sizeIndicator,
                                                    item.size === 'small' && styles.sizeIndicatorSmall,
                                                    item.size === 'medium' && styles.sizeIndicatorMedium,
                                                    item.size === 'full' && styles.sizeIndicatorFull,
                                                ]} />
                                            </View>

                                            <Pressable
                                                style={styles.visibilityButton}
                                                onPress={() => handleToggleVisibility(item.id)}
                                            >
                                                <MaterialIcons
                                                    name={item.visible ? 'visibility' : 'visibility-off'}
                                                    size={20}
                                                    color={item.visible ? theme.primary : theme.textSecondary}
                                                />
                                            </Pressable>

                                            <Pressable
                                                style={[styles.visibilityButton, { marginLeft: 4 }]}
                                                onPress={() => {
                                                    Alert.alert('Rimuovi Campo', 'Rimuovere questo campo dal layout?', [
                                                        { text: 'Annulla', style: 'cancel' },
                                                        {
                                                            text: 'Rimuovi', style: 'destructive', onPress: () => {
                                                                const newFields = localFields.filter(f => f.id !== item.id);
                                                                setLocalFields(newFields);
                                                                removeFieldFromLayout(item.id);
                                                                setHasChanges(true);
                                                            }
                                                        }
                                                    ]);
                                                }}
                                            >
                                                <MaterialIcons name="close" size={20} color={theme.error} />
                                            </Pressable>
                                        </>
                                    )}
                                </View>

                                {/* Extended Controls */}
                                {isSelected && !isSection && (
                                    <View style={styles.sizeSelectorContainer}>
                                        <Text style={styles.sizeSelectorLabel}>Dimensione:</Text>
                                        <View style={styles.sizeOptions}>
                                            {SIZE_OPTIONS.map((option) => (
                                                <Pressable
                                                    key={option.value}
                                                    style={[
                                                        styles.sizeOption,
                                                        item.size === option.value && styles.sizeOptionActive,
                                                    ]}
                                                    onPress={() => handleSizeChange(item.id, option.value)}
                                                >
                                                    <Text style={[
                                                        styles.sizeOptionText,
                                                        item.size === option.value && styles.sizeOptionTextActive,
                                                    ]}>
                                                        {option.label}
                                                    </Text>
                                                    <Text style={[
                                                        styles.sizeOptionSubtext,
                                                        item.size === option.value && styles.sizeOptionSubtextActive,
                                                    ]}>
                                                        {option.width}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>

                                        <Text style={[styles.sizeSelectorLabel, { marginTop: 16 }]}>Icona:</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                            {COMMON_ICONS.map(icon => (
                                                <Pressable
                                                    key={icon}
                                                    onPress={() => {
                                                        const newFields = localFields.map(f => f.id === item.id ? { ...f, icon } : f);
                                                        setLocalFields(newFields);
                                                        updateFieldIcon(item.id, icon);
                                                        setHasChanges(true);
                                                    }}
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 8,
                                                        backgroundColor: getFieldIconForItem(item) === icon ? theme.primary : theme.backgroundSecondary,
                                                        justifyContent: 'center',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <MaterialIcons name={icon as any} size={20} color={getFieldIconForItem(item) === icon ? '#000' : theme.textSecondary} />
                                                </Pressable>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </Pressable>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Save Button */}
            <View style={styles.bottomBar}>
                <Pressable
                    style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={!hasChanges}
                >
                    <MaterialIcons name="save" size={24} color={hasChanges ? '#000' : theme.textSecondary} />
                    <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
                        {hasChanges ? 'Salva Layout' : 'Nessuna Modifica'}
                    </Text>
                </Pressable>
            </View>

            {/* Templates Selector Modal */}
            <Modal visible={showTemplatesModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTemplatesModal(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={styles.modalHeader}>
                        <Pressable onPress={() => setShowTemplatesModal(false)}>
                            <MaterialIcons name="close" size={24} color={theme.textPrimary} />
                        </Pressable>
                        <Text style={{ ...typography.cardTitle, fontSize: 18 }}>Modelli di Settore</Text>
                        <View style={{ width: 24 }} />
                    </View>
                    <ScrollView style={{ flex: 1, padding: spacing.screenPadding }}>
                        <Text style={{ ...typography.caption, color: theme.textSecondary, marginBottom: 24, fontSize: 13, lineHeight: 18 }}>
                            Carica un modello predefinito per iniettare automaticamente nel tuo database i campi più comuni usati nel tuo settore.
                            Questa azione SOSTITUIRÀ l'intero layout attuale con una configurazione pulita per il settore scelto.
                        </Text>
                        {PREDEFINED_TEMPLATES.map(template => (
                            <Pressable
                                key={template.id}
                                style={{ backgroundColor: theme.surface, padding: 16, borderRadius: borderRadius.medium, marginBottom: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 16 }}
                                onPress={() => loadTemplate(template.id)}
                            >
                                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: `${theme.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
                                    <MaterialIcons name={template.icon as any} size={24} color={theme.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ ...typography.cardTitle, fontSize: 16, marginBottom: 4 }}>{template.name}</Text>
                                    <Text style={{ ...typography.caption, color: theme.textSecondary }}>{template.description}</Text>
                                </View>
                                <MaterialIcons name="arrow-forward-ios" size={16} color={theme.textSecondary} />
                            </Pressable>
                        ))}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Add Field Modal */}
            <Modal visible={showAddFieldModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddFieldModal(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={styles.modalHeader}>
                        <Pressable onPress={() => setShowAddFieldModal(false)}>
                            <MaterialIcons name="close" size={24} color={theme.textPrimary} />
                        </Pressable>
                        <Text style={{ ...typography.cardTitle, fontSize: 18 }}>Aggiungi Campo</Text>
                        <View style={{ width: 24 }} />
                    </View>
                    <ScrollView style={{ flex: 1, padding: spacing.screenPadding }}>
                        <Text style={{ ...typography.caption, color: theme.textSecondary, marginBottom: 24, fontSize: 13, lineHeight: 18 }}>
                            Seleziona un campo dal registro per aggiungerlo al tuo layout.
                        </Text>
                        {customFields.filter(cf => !localFields.some(lf => lf.id === cf.id)).map(cf => (
                            <Pressable
                                key={cf.id}
                                style={{ backgroundColor: theme.surface, padding: 16, borderRadius: borderRadius.medium, marginBottom: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 16 }}
                                onPress={() => {
                                    const newField: LayoutField = {
                                        id: cf.id,
                                        type: cf.isSystem ? 'base' : 'custom',
                                        size: 'medium',
                                        visible: true
                                    };
                                    const newFields = [...localFields, newField];
                                    setLocalFields(newFields);
                                    addFieldToLayout(newField);
                                    setHasChanges(true);
                                    setShowAddFieldModal(false);
                                }}
                            >
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${theme.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
                                    <MaterialIcons name={(cf.icon as any) || 'text-fields'} size={20} color={theme.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ ...typography.cardTitle, fontSize: 16, marginBottom: 2 }}>{cf.name}</Text>
                                    <Text style={{ ...typography.caption, color: theme.textSecondary }}>{cf.isSystem ? 'Campo Originale di Sistema' : 'Campo Personalizzato'}</Text>
                                </View>
                                <MaterialIcons name="add-circle-outline" size={24} color={theme.primary} />
                            </Pressable>
                        ))}
                        {customFields.filter(cf => !localFields.some(lf => lf.id === cf.id)).length === 0 && (
                            <View style={{ padding: 24, alignItems: 'center', opacity: 0.5 }}>
                                <MaterialIcons name="check-circle" size={48} color={theme.textSecondary} />
                                <Text style={{ ...typography.cardTitle, marginTop: 16, textAlign: 'center' }}>Tutti i campi sono già nel layout</Text>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    instructionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: spacing.screenPadding,
        paddingVertical: 12,
        backgroundColor: theme.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    instructionsText: {
        ...typography.caption,
        fontSize: 13,
        color: theme.textSecondary,
        flex: 1,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.screenPadding,
        paddingVertical: 12,
    },
    previewTitle: {
        ...typography.sectionHeader,
        fontSize: 12,
        color: theme.textSecondary,
    },
    previewLegend: {
        flexDirection: 'row',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendBox: {
        height: 12,
        borderRadius: 3,
        backgroundColor: theme.primary,
    },
    legendText: {
        ...typography.caption,
        fontSize: 11,
        color: theme.textSecondary,
    },
    listContainer: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: spacing.screenPadding,
        paddingBottom: 100,
    },
    fieldCard: {
        backgroundColor: theme.surface,
        borderRadius: borderRadius.medium,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    fieldCardHidden: {
        opacity: 0.5,
    },
    fieldCardSelected: {
        borderColor: theme.primary,
    },
    fieldCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
    },
    moveButtons: {
        flexDirection: 'column',
        marginRight: 4,
    },
    moveButton: {
        padding: 2,
    },
    moveButtonDisabled: {
        opacity: 0.3,
    },
    fieldCardTitle: {
        ...typography.cardTitle,
        fontSize: 15,
        flex: 1,
    },
    fieldCardTitleHidden: {
        color: theme.textSecondary,
    },
    sizeIndicatorContainer: {
        width: 40,
        height: 8,
        backgroundColor: theme.backgroundSecondary,
        borderRadius: 4,
        overflow: 'hidden',
    },
    sizeIndicator: {
        height: '100%',
        borderRadius: 4,
    },
    sizeIndicatorSmall: {
        width: '33%',
        backgroundColor: `${theme.primary}60`,
    },
    sizeIndicatorMedium: {
        width: '50%',
        backgroundColor: `${theme.primary}80`,
    },
    sizeIndicatorFull: {
        width: '100%',
        backgroundColor: theme.primary,
    },
    visibilityButton: {
        padding: 4,
    },
    sizeSelectorContainer: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingTop: 12,
    },
    sizeSelectorLabel: {
        ...typography.caption,
        fontSize: 12,
        color: theme.textSecondary,
        marginBottom: 8,
    },
    sizeOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    sizeOption: {
        flex: 1,
        backgroundColor: theme.backgroundSecondary,
        borderRadius: borderRadius.medium,
        padding: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    sizeOptionActive: {
        backgroundColor: `${theme.primary}20`,
        borderColor: theme.primary,
    },
    sizeOptionText: {
        ...typography.cardTitle,
        fontSize: 14,
        color: theme.textSecondary,
    },
    sizeOptionTextActive: {
        color: theme.primary,
    },
    sizeOptionSubtext: {
        ...typography.caption,
        fontSize: 11,
        color: theme.textMuted,
        marginTop: 2,
    },
    sizeOptionSubtextActive: {
        color: theme.primary,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.background,
        paddingHorizontal: spacing.screenPadding,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.primary,
        borderRadius: borderRadius.medium,
        paddingVertical: 14,
    },
    saveButtonDisabled: {
        backgroundColor: theme.surface,
    },
    saveButtonText: {
        ...typography.buttonPrimary,
        fontSize: 16,
    },
    saveButtonTextDisabled: {
        color: theme.textSecondary,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screenPadding,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
});
