// FurInventory Pro - Custom Fields Builder Screen with Edit Modal
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme, typography, borderRadius, spacing } from '../../constants/theme';
import { useCustomFields, FieldType, FIELD_TYPE_INFO } from '../../contexts/CustomFieldsContext';
import { FieldUIType, CustomField } from '../../types';

const COMMON_ICONS = [
  'tune', 'text-fields', 'tag', 'calendar-today', 'image', 'list', 'check-box',
  'attach-money', 'straighten', 'place', 'description', 'person', 'local-shipping',
  'palette', 'architecture', 'speed', 'inventory', 'qr-code', 'category', 'sell',
  'star', 'diamond', 'watch', 'devices', 'local-bar', 'science', 'brush',
  'visibility', 'eco', 'fitness-center', 'layers', 'verified', 'ac-unit',
  'wb-sunny', 'style', 'fingerprint', 'medication', 'public', 'thermostat',
];

export default function CustomFieldsScreen() {
  const insets = useSafeAreaInsets();
  const { customFields, loading, addField, deleteField, updateField } = useCustomFields();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [selectedBaseType, setSelectedBaseType] = useState<FieldType | null>(null);
  const [selectedUIType, setSelectedUIType] = useState<FieldUIType | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>('tune');
  const [fieldName, setFieldName] = useState('');
  const [fieldUnit, setFieldUnit] = useState('');

  const [stepperOptions, setStepperOptions] = useState({ min: '0', max: '100', step: '1' });
  const [options, setOptions] = useState<string[]>(['']);
  const [isRequired, setIsRequired] = useState(false);

  // Advanced Inteligence Features
  const [isBarcode, setIsBarcode] = useState(false);
  const [linkTo, setLinkTo] = useState<'locations' | 'libraries' | 'furType' | null>(null);

  const resetForm = () => {
    setSelectedBaseType(null);
    setSelectedUIType(null);
    setSelectedIcon('tune');
    setFieldName('');
    setFieldUnit('');
    setStepperOptions({ min: '0', max: '100', step: '1' });
    setIsRequired(false);
    setOptions(['']);
    setIsBarcode(false);
    setLinkTo(null);
    setEditingField(null);
  };

  const openEditModal = (field: CustomField) => {
    setEditingField(field);
    setFieldName(field.name);
    setSelectedBaseType(field.type);
    setSelectedUIType(field.uiType);
    setSelectedIcon(field.icon || 'tune');
    setFieldUnit(field.unit || '');
    setIsRequired(field.required);
    setIsBarcode(field.isBarcode || false);
    setLinkTo(field.linkTo || null);

    if (field.dataset && Array.isArray(field.dataset)) {
      setOptions(field.dataset);
    } else if (field.dataset && typeof field.dataset === 'object') {
      setStepperOptions({
        min: String(field.dataset.min ?? '0'),
        max: String(field.dataset.max ?? '100'),
        step: String(field.dataset.step ?? '1'),
      });
    }

    setShowAddModal(true);
  };

  const handleSaveField = async () => {
    if (!selectedBaseType || !fieldName.trim()) {
      Alert.alert('Errore', 'Inserisci il nome del campo e scegli un tipo');
      return;
    }

    const name = fieldName.trim();
    const baseType = selectedBaseType;
    let finalUIType = selectedUIType || 'text';

    if (baseType === 'single_choice' && !selectedUIType) finalUIType = 'grid';
    if (baseType === 'multi_choice' && !selectedUIType) finalUIType = 'grid';
    if (baseType === 'document') finalUIType = 'document';
    if (baseType === 'date' && !selectedUIType) finalUIType = 'date';
    if (baseType === 'images') finalUIType = 'images';

    let dataset: any = null;
    let fieldOptions: any = undefined;

    if (baseType === 'single_choice' || baseType === 'multi_choice') {
      if (!linkTo) {
        const validOptions = options.map(o => o.trim()).filter(Boolean);
        if (validOptions.length === 0) {
          Alert.alert('Errore', 'Aggiungi almeno una opzione nel Dataset oppure seleziona una Sorgente Dati dinamica');
          return;
        }
        dataset = validOptions;
        fieldOptions = validOptions.map((o, i) => ({ id: `opt_${i}`, label: o }));
      }
    } else if (finalUIType === 'stepper') {
      dataset = {
        min: parseFloat(stepperOptions.min) || 0,
        max: parseFloat(stepperOptions.max) || 100,
        step: parseFloat(stepperOptions.step) || 1,
      };
    }

    const payload = {
      name,
      type: baseType,
      uiType: finalUIType,
      dataset,
      options: fieldOptions,
      required: isRequired,
      icon: selectedIcon,
      unit: fieldUnit || undefined,
      isBarcode: isBarcode ? true : undefined,
      linkTo: linkTo || undefined,
    };

    if (editingField) {
      // Update existing field
      await updateField(editingField.id, payload);
      Alert.alert('Successo', `Campo "${name}" aggiornato!`);
    } else {
      // Add new field
      await addField(payload);
      Alert.alert('Successo', `Campo "${name}" creato nel Registro!`);
    }

    resetForm();
    setShowAddModal(false);
  };

  const handleDeleteField = (field: CustomField) => {
    Alert.alert(
      'Sposta nel Cestino',
      `Il campo "${field.name}" verrà spostato nel cestino. Potrai ripristinarlo in qualsiasi momento.`,
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Cestina', style: 'destructive', onPress: () => deleteField(field.id) },
      ]
    );
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.screenPadding,
          paddingBottom: insets.bottom + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Existing Fields Section */}
        {customFields.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>CAMPI ATTIVI ({customFields.length})</Text>
            {customFields.map((field) => (
              <View key={field.id} style={styles.fieldCard}>
                <View style={styles.fieldIcon}>
                  <MaterialIcons
                    name={field.icon as any || 'text-fields'}
                    size={24}
                    color={field.isSystem ? theme.textSecondary : theme.primary}
                  />
                </View>
                <View style={styles.fieldContent}>
                  <View style={styles.fieldHeader}>
                    <Text style={styles.fieldName}>{field.name}</Text>
                    {field.isSystem && (
                      <View style={styles.systemBadge}>
                        <Text style={styles.systemBadgeText}>Base</Text>
                      </View>
                    )}
                    {field.required && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Obblig</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.fieldType}>
                    {FIELD_TYPE_INFO[field.type]?.label} {field.uiType && !field.isSystem ? `(UI: ${field.uiType})` : ''}
                    {field.unit ? ` • ${field.unit}` : ''}
                  </Text>
                  {field.dataset && Array.isArray(field.dataset) && (
                    <Text style={styles.fieldOptions} numberOfLines={1}>
                      Valori: {field.dataset.join(', ')}
                    </Text>
                  )}
                </View>

                {/* Edit & Delete buttons for non-system fields */}
                {!field.isSystem && (
                  <View style={styles.fieldActions}>
                    <Pressable
                      style={styles.editButton}
                      onPress={() => openEditModal(field)}
                    >
                      <MaterialIcons name="edit" size={18} color={theme.primary} />
                    </Pressable>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeleteField(field)}
                    >
                      <MaterialIcons name="delete" size={18} color={theme.error} />
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* Add Field Button */}
        <Pressable
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="add-circle" size={24} color="#000" />
          <Text style={styles.addButtonText}>Crea Nuovo Campo</Text>
        </Pressable>

        <View style={styles.infoCard}>
          <MaterialIcons name="security" size={24} color={theme.primary} />
          <Text style={styles.infoText}>
            Immutabilità Storica Attiva: Se elimini un campo, finirà nel Cestino.
            I prodotti già generati continueranno a visualizzarlo nei loro dettagli.
          </Text>
        </View>
      </ScrollView>

      {/* FIELD BUILDER / EDITOR MODAL */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          resetForm();
          setShowAddModal(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => { resetForm(); setShowAddModal(false); }}>
              <MaterialIcons name="close" size={24} color={theme.textPrimary} />
            </Pressable>
            <Text style={styles.modalTitle}>
              {editingField ? 'Modifica Campo' : 'Field Builder'}
            </Text>
            <Pressable onPress={handleSaveField}>
              <Text style={styles.saveButton}>
                {editingField ? 'Aggiorna' : 'Salva Campo'}
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>

            {/* 1. SELEZIONE TIPO BASE */}
            {!selectedBaseType ? (
              <>
                <Text style={styles.modalSectionTitle}>TIPI DI CAMPO DISPONIBILI</Text>
                {Object.entries(FIELD_TYPE_INFO).map(([key, info]) => (
                  <Pressable
                    key={key}
                    style={styles.typeOption}
                    onPress={() => {
                      setSelectedBaseType(key as FieldType);
                      setSelectedIcon(info.icon);
                    }}
                  >
                    <View style={styles.typeOptionIcon}>
                      <MaterialIcons name={info.icon as any} size={24} color={theme.primary} />
                    </View>
                    <View style={styles.typeOptionContent}>
                      <Text style={styles.typeOptionLabel}>{info.label}</Text>
                      <Text style={styles.typeOptionDesc}>{info.description}</Text>
                    </View>
                    <MaterialIcons name="add-circle" size={24} color={theme.primary} />
                  </Pressable>
                ))}
              </>
            ) : (
              /* 2. CONFIGURAZIONE CAMPO */
              <>
                <View style={styles.selectedTypeHeader}>
                  <MaterialIcons
                    name={FIELD_TYPE_INFO[selectedBaseType].icon as any}
                    size={32}
                    color={theme.primary}
                  />
                  <Text style={styles.selectedTypeLabel}>
                    {FIELD_TYPE_INFO[selectedBaseType].label}
                  </Text>
                  {!editingField && (
                    <Pressable
                      style={styles.changeTypeButton}
                      onPress={() => setSelectedBaseType(null)}
                    >
                      <Text style={styles.changeTypeText}>Cambia</Text>
                    </Pressable>
                  )}
                </View>

                {/* A. NOME CAMPO */}
                <Text style={styles.inputLabel}>Nome del Campo *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Es: Taglia Pantalone, PDF Manuale"
                  placeholderTextColor={theme.textSecondary}
                  value={fieldName}
                  onChangeText={setFieldName}
                />

                {/* A2. UNITÀ DI MISURA (for number/currency) */}
                {(selectedBaseType === 'number' || selectedBaseType === 'currency') && (
                  <>
                    <Text style={styles.inputLabel}>Unità di Misura (opzionale)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Es: cm, kg, €, ml"
                      placeholderTextColor={theme.textSecondary}
                      value={fieldUnit}
                      onChangeText={setFieldUnit}
                    />
                  </>
                )}

                {/* B. ICONA CAMPO */}
                <Text style={styles.inputLabel}>Scegli un'icona</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                  {COMMON_ICONS.map(icon => (
                    <Pressable
                      key={icon}
                      onPress={() => setSelectedIcon(icon)}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: selectedIcon === icon ? theme.primary : theme.backgroundSecondary,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <MaterialIcons name={icon as any} size={24} color={selectedIcon === icon ? '#000' : theme.textSecondary} />
                    </Pressable>
                  ))}
                </ScrollView>

                {/* C. OPZIONI UI SPECIFICHE */}
                {selectedBaseType === 'text_short' && (
                  <View style={styles.datasetBox}>
                    <Text style={styles.inputLabel}>Intelligenza Avanzata</Text>
                    <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }} onPress={() => setIsBarcode(!isBarcode)}>
                      <MaterialIcons name={isBarcode ? 'qr-code-scanner' : 'qr-code'} size={24} color={isBarcode ? theme.primary : theme.textSecondary} />
                      <Text style={styles.requiredToggleText}>Abilita Scanner Barcode / QR</Text>
                    </Pressable>
                    <Text style={[styles.subtext, { marginTop: 6, marginLeft: 36 }]}>
                      Visualizza un bottone per aprire la fotocamera e scannerizzare direttamente nel campo.
                    </Text>
                  </View>
                )}

                {(selectedBaseType === 'single_choice' || selectedBaseType === 'multi_choice') && (
                  <View style={styles.datasetBox}>
                    <Text style={styles.inputLabel}>Aspetto UI (Opzionale)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
                      {['grid', 'segmented', 'picker', 'modal_list'].map(ui => (
                        <Pressable
                          key={ui}
                          onPress={() => setSelectedUIType(ui as FieldUIType)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 16,
                            backgroundColor: selectedUIType === ui ? theme.primary : theme.surface,
                            borderWidth: 1,
                            borderColor: selectedUIType === ui ? theme.primary : theme.border
                          }}
                        >
                          <Text style={{ color: selectedUIType === ui ? '#000' : theme.textPrimary, fontWeight: '600' }}>{ui.toUpperCase()}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>

                    <Text style={styles.inputLabel}>Sorgente Dati (Intelligenza Avanzata)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
                      {[
                        { id: null, label: 'Manuale (Digita tu)' },
                        { id: 'locations', label: 'Libreria Posizioni' },
                        { id: 'libraries', label: 'Libreria Cartelle' },
                        { id: 'furType', label: 'Libreria Categorie' },
                      ].map(l => (
                        <Pressable
                          key={String(l.id)}
                          onPress={() => setLinkTo(l.id as any)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 16,
                            backgroundColor: linkTo === l.id ? theme.primary : theme.surface,
                            borderWidth: 1,
                            borderColor: linkTo === l.id ? theme.primary : theme.border
                          }}
                        >
                          <Text style={{ color: linkTo === l.id ? '#000' : theme.textPrimary, fontWeight: '600' }}>{l.label}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>

                    {!linkTo && (
                      <>
                        <Text style={styles.inputLabel}>Opzioni del menu (Dataset manuale)</Text>
                        {options.map((option, index) => (
                          <View key={index} style={styles.optionRow}>
                            <TextInput
                              style={[styles.input, styles.optionInput]}
                              placeholder={`Valore ${index + 1}`}
                              placeholderTextColor={theme.textSecondary}
                              value={option}
                              onChangeText={(text) => updateOption(index, text)}
                            />
                            {options.length > 1 && (
                              <Pressable style={styles.removeOptionButton} onPress={() => removeOption(index)}>
                                <MaterialIcons name="remove-circle" size={24} color={theme.error} />
                              </Pressable>
                            )}
                          </View>
                        ))}
                        <Pressable style={styles.addOptionButton} onPress={() => setOptions([...options, ''])}>
                          <MaterialIcons name="add" size={20} color={theme.primary} />
                          <Text style={styles.addOptionText}>Aggiungi Opzione</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                )}

                {selectedBaseType === 'number' && (
                  <View style={styles.datasetBox}>
                    <Text style={styles.inputLabel}>Contatore UI (Opzionale)</Text>
                    <Pressable
                      onPress={() => setSelectedUIType(selectedUIType === 'stepper' ? null : 'stepper')}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 16,
                        backgroundColor: selectedUIType === 'stepper' ? theme.primary : theme.surface,
                        borderWidth: 1,
                        borderColor: selectedUIType === 'stepper' ? theme.primary : theme.border,
                        alignSelf: 'flex-start',
                        marginBottom: 16
                      }}
                    >
                      <Text style={{ color: selectedUIType === 'stepper' ? '#000' : theme.textPrimary, fontWeight: '600' }}>STEPPER (+ / -)</Text>
                    </Pressable>

                    {selectedUIType === 'stepper' && (
                      <View style={styles.datasetBox}>
                        <Text style={styles.inputLabel}>C. Limiti Contatore (Dataset)</Text>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.subtext}>Minimo</Text>
                            <TextInput style={styles.input} value={stepperOptions.min} onChangeText={t => setStepperOptions({ ...stepperOptions, min: t })} keyboardType="numeric" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.subtext}>Massimo</Text>
                            <TextInput style={styles.input} value={stepperOptions.max} onChangeText={t => setStepperOptions({ ...stepperOptions, max: t })} keyboardType="numeric" />
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <Pressable style={styles.requiredToggle} onPress={() => setIsRequired(!isRequired)}>
                  <MaterialIcons
                    name={isRequired ? 'check-box' : 'check-box-outline-blank'}
                    size={24}
                    color={isRequired ? theme.primary : theme.textSecondary}
                  />
                  <Text style={styles.requiredToggleText}>Campo obbligatorio in fase di aggiunta</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...typography.body, marginTop: 12 },
  sectionTitle: { ...typography.sectionHeader, marginTop: 24, marginBottom: 12 },

  fieldCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: borderRadius.medium, padding: 16, marginBottom: 12 },
  fieldIcon: { width: 48, height: 48, borderRadius: borderRadius.medium, backgroundColor: `${theme.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  fieldContent: { flex: 1 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  fieldName: { ...typography.cardTitle, fontSize: 15 },
  systemBadge: { backgroundColor: theme.backgroundSecondary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  systemBadgeText: { fontSize: 10, color: theme.textSecondary, fontWeight: '600' },
  requiredBadge: { backgroundColor: `${theme.warning}20`, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  requiredText: { fontSize: 10, color: theme.warning, fontWeight: '600' },
  fieldType: { ...typography.caption, fontSize: 12 },
  fieldOptions: { ...typography.caption, fontSize: 11, color: theme.textMuted, marginTop: 2 },
  fieldActions: { flexDirection: 'row', gap: 4 },
  editButton: { padding: 8, backgroundColor: `${theme.primary}15`, borderRadius: 8 },
  deleteButton: { padding: 8 },

  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, borderRadius: borderRadius.medium, padding: 16, marginTop: 16 },
  addButtonText: { ...typography.buttonPrimary, fontSize: 16 },
  infoCard: { flexDirection: 'row', gap: 12, backgroundColor: theme.surface, borderRadius: borderRadius.medium, padding: 16, marginTop: 16 },
  infoText: { ...typography.caption, fontSize: 13, lineHeight: 18, flex: 1 },

  modalContainer: { flex: 1, backgroundColor: theme.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenPadding, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  modalTitle: { ...typography.cardTitle, fontSize: 18 },
  saveButton: { color: theme.primary, fontWeight: '600', fontSize: 16 },
  modalContent: { flex: 1, paddingHorizontal: spacing.screenPadding },
  modalSectionTitle: { ...typography.sectionHeader, marginTop: 24, marginBottom: 16 },

  typeOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: borderRadius.medium, padding: 16, marginBottom: 12 },
  typeOptionIcon: { width: 48, height: 48, borderRadius: borderRadius.medium, backgroundColor: `${theme.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  typeOptionContent: { flex: 1 },
  typeOptionLabel: { ...typography.cardTitle, fontSize: 15, marginBottom: 2 },
  typeOptionDesc: { ...typography.caption, fontSize: 12 },

  selectedTypeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface, borderRadius: borderRadius.medium, padding: 16, marginTop: 24, marginBottom: 24 },
  selectedTypeLabel: { ...typography.cardTitle, fontSize: 16, flex: 1 },
  changeTypeButton: { padding: 8 },
  changeTypeText: { color: theme.primary, fontWeight: '600' },

  inputLabel: { ...typography.caption, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.surface, borderRadius: borderRadius.medium, padding: 14, fontSize: 16, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border },
  subtext: { ...typography.caption, fontSize: 11, marginBottom: 4, color: theme.textSecondary },

  datasetBox: { backgroundColor: theme.backgroundSecondary, padding: 16, borderRadius: borderRadius.medium, marginTop: 16 },

  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  optionInput: { flex: 1 },
  removeOptionButton: { padding: 4 },
  addOptionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginTop: 8 },
  addOptionText: { color: theme.primary, fontWeight: '600' },
  requiredToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, padding: 16, backgroundColor: theme.surface, borderRadius: borderRadius.medium, marginBottom: 40 },
  requiredToggleText: { ...typography.body, fontSize: 15 },
});
