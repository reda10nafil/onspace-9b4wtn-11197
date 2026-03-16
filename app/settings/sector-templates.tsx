// FurInventory Pro - Sector Templates Screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, typography, shadows, borderRadius, spacing } from '../../constants/theme';
import { useCustomFields } from '../../contexts/CustomFieldsContext';
import { SECTOR_TEMPLATES, SectorTemplate, USER_TEMPLATES_KEY } from '../../constants/sectorTemplates';

export default function SectorTemplatesScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { customFields, addField } = useCustomFields();
    const [selectedTemplate, setSelectedTemplate] = useState<SectorTemplate | null>(null);
    const [userTemplates, setUserTemplates] = useState<SectorTemplate[]>([]);

    useEffect(() => {
        loadUserTemplates();
    }, []);

    const loadUserTemplates = async () => {
        try {
            const stored = await AsyncStorage.getItem(USER_TEMPLATES_KEY);
            if (stored) {
                setUserTemplates(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Error loading user templates:', e);
        }
    };

    const saveUserTemplates = async (templates: SectorTemplate[]) => {
        try {
            await AsyncStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(templates));
            setUserTemplates(templates);
        } catch (e) {
            console.error('Error saving user templates:', e);
        }
    };

    const handleImportTemplate = async (template: SectorTemplate) => {
        Alert.alert(
            'Importa Modello',
            `Vuoi aggiungere i ${template.fields.length} campi del modello "${template.name}" al tuo registro?`,
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Importa',
                    onPress: async () => {
                        let imported = 0;
                        for (const field of template.fields) {
                            // Check if a field with the same name already exists
                            const exists = customFields.some(f =>
                                f.name.toLowerCase() === field.name.toLowerCase() && !f.deletedAt
                            );
                            if (!exists) {
                                await addField(field);
                                imported++;
                            }
                        }
                        if (imported > 0) {
                            Alert.alert('Successo', `${imported} campi importati con successo! ${template.fields.length - imported > 0 ? `(${template.fields.length - imported} già esistenti)` : ''}`);
                        } else {
                            Alert.alert('Info', 'Tutti i campi di questo modello sono già presenti nel tuo registro.');
                        }
                        setSelectedTemplate(null);
                    }
                }
            ]
        );
    };

    const handleSaveCurrentAsTemplate = () => {
        const userFields = customFields.filter(f => !f.isSystem && !f.deletedAt);
        if (userFields.length === 0) {
            Alert.alert('Nessun Campo', 'Non hai campi personalizzati da salvare come modello. Crea prima dei campi.');
            return;
        }

        Alert.prompt?.(
            'Nome Modello',
            'Dai un nome al tuo modello personalizzato:',
            async (name: string) => {
                if (!name?.trim()) return;
                const newTemplate: SectorTemplate = {
                    id: `custom_${Date.now()}`,
                    name: name.trim(),
                    emoji: '⭐',
                    description: `${userFields.length} campi personalizzati`,
                    color: theme.primary,
                    fields: userFields.map(f => ({
                        name: f.name,
                        type: f.type,
                        uiType: f.uiType,
                        icon: f.icon,
                        unit: f.unit,
                        options: f.options,
                        dataset: f.dataset,
                        required: f.required,
                    })),
                };
                await saveUserTemplates([...userTemplates, newTemplate]);
                Alert.alert('Successo', `Modello "${name.trim()}" salvato con ${userFields.length} campi!`);
            }
        ) || Alert.alert('Info', 'La funzione di salvataggio modello personalizzato sarà disponibile a breve.');
    };

    const handleDeleteUserTemplate = (template: SectorTemplate) => {
        Alert.alert(
            'Elimina Modello',
            `Eliminare definitivamente il modello "${template.name}"?`,
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Elimina',
                    style: 'destructive',
                    onPress: () => saveUserTemplates(userTemplates.filter(t => t.id !== template.id))
                }
            ]
        );
    };

    const allTemplates = [...SECTOR_TEMPLATES, ...userTemplates];

    const renderTemplateCard = (template: SectorTemplate, isUser: boolean = false) => (
        <Pressable
            key={template.id}
            style={styles.templateCard}
            onPress={() => setSelectedTemplate(template)}
        >
            <View style={[styles.templateEmoji, { backgroundColor: `${template.color}20` }]}>
                <Text style={styles.templateEmojiText}>{template.emoji}</Text>
            </View>
            <View style={styles.templateContent}>
                <View style={styles.templateHeader}>
                    <Text style={styles.templateName} numberOfLines={1}>{template.name}</Text>
                    {isUser && (
                        <View style={styles.customBadge}>
                            <Text style={styles.customBadgeText}>Custom</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.templateDesc} numberOfLines={1}>{template.description}</Text>
                <Text style={styles.templateFields}>{template.fields.length} campi</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>
    );

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Modelli Settore</Text>
            </View>

            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: spacing.screenPadding,
                    paddingBottom: insets.bottom + 20,
                }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.subtitle}>
                    Scegli un modello pre-configurato per il tuo settore. I campi verranno aggiunti al tuo registro.
                </Text>

                {/* Built-in Templates */}
                <Text style={styles.sectionTitle}>MODELLI DISPONIBILI ({SECTOR_TEMPLATES.length})</Text>
                {SECTOR_TEMPLATES.map(t => renderTemplateCard(t))}

                {/* User Templates */}
                {userTemplates.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>I TUOI MODELLI ({userTemplates.length})</Text>
                        {userTemplates.map(t => (
                            <View key={t.id}>
                                {renderTemplateCard(t, true)}
                                <Pressable
                                    style={styles.deleteUserTemplate}
                                    onPress={() => handleDeleteUserTemplate(t)}
                                >
                                    <MaterialIcons name="delete-outline" size={16} color={theme.error} />
                                    <Text style={styles.deleteUserTemplateText}>Elimina</Text>
                                </Pressable>
                            </View>
                        ))}
                    </>
                )}

                {/* Save Current */}
                <Pressable style={styles.saveTemplateButton} onPress={handleSaveCurrentAsTemplate}>
                    <MaterialIcons name="save" size={24} color="#000" />
                    <Text style={styles.saveTemplateText}>Salva Campi Attuali come Modello</Text>
                </Pressable>
            </ScrollView>

            {/* Template Detail Modal */}
            <Modal
                visible={!!selectedTemplate}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedTemplate(null)}
            >
                {selectedTemplate && (
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Pressable onPress={() => setSelectedTemplate(null)}>
                                <MaterialIcons name="close" size={24} color={theme.textPrimary} />
                            </Pressable>
                            <Text style={styles.modalTitle}>Anteprima Modello</Text>
                            <Pressable onPress={() => handleImportTemplate(selectedTemplate)}>
                                <Text style={styles.importButton}>Importa</Text>
                            </Pressable>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {/* Template Info */}
                            <View style={styles.templateInfoCard}>
                                <Text style={styles.templateInfoEmoji}>{selectedTemplate.emoji}</Text>
                                <Text style={styles.templateInfoName}>{selectedTemplate.name}</Text>
                                <Text style={styles.templateInfoDesc}>{selectedTemplate.description}</Text>
                            </View>

                            {/* Fields Preview */}
                            <Text style={styles.sectionTitle}>CAMPI INCLUSI ({selectedTemplate.fields.length})</Text>
                            {selectedTemplate.fields.map((field, index) => (
                                <View key={index} style={styles.fieldPreview}>
                                    <View style={[styles.fieldPreviewIcon, { backgroundColor: `${selectedTemplate.color}15` }]}>
                                        <MaterialIcons name={field.icon as any || 'tune'} size={22} color={selectedTemplate.color} />
                                    </View>
                                    <View style={styles.fieldPreviewContent}>
                                        <Text style={styles.fieldPreviewName}>{field.name}</Text>
                                        <Text style={styles.fieldPreviewType}>
                                            {field.type === 'single_choice' ? 'Scelta Singola' :
                                                field.type === 'multi_choice' ? 'Scelta Multipla' :
                                                    field.type === 'text_short' ? 'Testo' :
                                                        field.type === 'text_long' ? 'Testo Lungo' :
                                                            field.type === 'number' ? 'Numero' :
                                                                field.type === 'currency' ? 'Valuta' :
                                                                    field.type === 'date' ? 'Data' :
                                                                        field.type}
                                            {field.unit ? ` (${field.unit})` : ''}
                                            {field.required ? ' • Obbligatorio' : ''}
                                        </Text>
                                        {field.dataset && Array.isArray(field.dataset) && (
                                            <Text style={styles.fieldPreviewOptions} numberOfLines={1}>
                                                {field.dataset.join(' · ')}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}

                            {/* Import Button */}
                            <Pressable
                                style={[styles.importFullButton, { backgroundColor: selectedTemplate.color || theme.primary }]}
                                onPress={() => handleImportTemplate(selectedTemplate)}
                            >
                                <MaterialIcons name="download" size={24} color="#FFF" />
                                <Text style={styles.importFullText}>Importa {selectedTemplate.fields.length} Campi</Text>
                            </Pressable>
                        </ScrollView>
                    </SafeAreaView>
                )}
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.screenPadding,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    backButton: { marginRight: 16 },
    title: { ...typography.cardTitle, fontSize: 20 },
    subtitle: {
        ...typography.body,
        color: theme.textSecondary,
        fontSize: 14,
        marginTop: 16,
        marginBottom: 24,
        lineHeight: 20,
    },
    sectionTitle: { ...typography.sectionHeader, marginBottom: 12 },

    templateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: borderRadius.medium,
        padding: 16,
        marginBottom: 10,
        ...shadows.small,
    },
    templateEmoji: {
        width: 52,
        height: 52,
        borderRadius: borderRadius.medium,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    templateEmojiText: { fontSize: 28 },
    templateContent: { flex: 1 },
    templateHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    templateName: { ...typography.cardTitle, fontSize: 15 },
    customBadge: { backgroundColor: `${theme.primary}20`, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    customBadgeText: { fontSize: 10, color: theme.primary, fontWeight: '600' },
    templateDesc: { ...typography.caption, fontSize: 12, marginBottom: 2 },
    templateFields: { ...typography.caption, fontSize: 11, color: theme.primary, fontWeight: '600' },

    deleteUserTemplate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingLeft: 66,
        marginBottom: 12,
        marginTop: -6,
    },
    deleteUserTemplateText: { fontSize: 12, color: theme.error },

    saveTemplateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.primary,
        borderRadius: borderRadius.medium,
        padding: 16,
        marginTop: 24,
    },
    saveTemplateText: { ...typography.buttonPrimary, fontSize: 15 },

    modalContainer: { flex: 1, backgroundColor: theme.background },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screenPadding,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    modalTitle: { ...typography.cardTitle, fontSize: 18 },
    importButton: { color: theme.primary, fontWeight: '600', fontSize: 16 },
    modalContent: { flex: 1, paddingHorizontal: spacing.screenPadding },

    templateInfoCard: {
        alignItems: 'center',
        paddingVertical: 32,
        marginBottom: 8,
    },
    templateInfoEmoji: { fontSize: 56, marginBottom: 12 },
    templateInfoName: { ...typography.cardTitle, fontSize: 22, marginBottom: 6 },
    templateInfoDesc: { ...typography.caption, fontSize: 14, textAlign: 'center' },

    fieldPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: borderRadius.medium,
        padding: 14,
        marginBottom: 8,
    },
    fieldPreviewIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    fieldPreviewContent: { flex: 1 },
    fieldPreviewName: { ...typography.cardTitle, fontSize: 14, marginBottom: 2 },
    fieldPreviewType: { ...typography.caption, fontSize: 12 },
    fieldPreviewOptions: { ...typography.caption, fontSize: 11, color: theme.textMuted, marginTop: 2 },

    importFullButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: borderRadius.medium,
        marginTop: 24,
        marginBottom: 40,
    },
    importFullText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
