// FurInventory Pro - Trash Screen (Products + Custom Fields)
import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, SectionList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { theme, typography, shadows, borderRadius, spacing } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';
import { useCustomFields, FIELD_TYPE_INFO } from '../../contexts/CustomFieldsContext';

export default function TrashScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { getTrashProducts, restoreProduct, permanentlyDeleteProduct } = useInventory();
    const { getDeletedFields, restoreField, permanentlyDeleteField } = useCustomFields();
    const trashProducts = getTrashProducts();
    const deletedFields = getDeletedFields();

    const handleRestoreProduct = (id: string) => {
        Alert.alert(
            'Ripristina Prodotto',
            'Il prodotto tornerà disponibile nella lista principale.',
            [
                { text: 'Annulla', style: 'cancel' },
                { text: 'Ripristina', onPress: () => restoreProduct(id) }
            ]
        );
    };

    const handleDeleteProductForever = (id: string) => {
        Alert.alert(
            'Elimina Definitivamente',
            'Questa azione è irreversibile. Sei sicuro?',
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Elimina',
                    style: 'destructive',
                    onPress: () => permanentlyDeleteProduct(id)
                }
            ]
        );
    };

    const handleRestoreField = (id: string) => {
        Alert.alert(
            'Ripristina Campo',
            'Il campo tornerà disponibile nel registro campi.',
            [
                { text: 'Annulla', style: 'cancel' },
                { text: 'Ripristina', onPress: () => restoreField(id) }
            ]
        );
    };

    const handleDeleteFieldForever = (id: string) => {
        Alert.alert(
            'Elimina Campo Definitivamente',
            'Il campo verrà eliminato per sempre. I prodotti già salvati manterranno i dati grazie all\'immutabilità storica.',
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Elimina',
                    style: 'destructive',
                    onPress: () => permanentlyDeleteField(id)
                }
            ]
        );
    };

    const totalItems = trashProducts.length + deletedFields.length;

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Cestino ({totalItems})</Text>
            </View>

            {totalItems === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="delete-outline" size={64} color={theme.textSecondary} />
                    <Text style={styles.emptyText}>Il cestino è vuoto</Text>
                    <Text style={styles.emptySubtext}>
                        I prodotti e i campi eliminati appariranno qui
                    </Text>
                </View>
            ) : (
                <FlatList
                    ListHeaderComponent={() => (
                        <>
                            {/* Deleted Fields Section */}
                            {deletedFields.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>
                                        CAMPI ELIMINATI ({deletedFields.length})
                                    </Text>
                                    {deletedFields.map((field) => (
                                        <View key={field.id} style={styles.fieldCard}>
                                            <View style={[styles.fieldIconBox, { backgroundColor: `${theme.primary}15` }]}>
                                                <MaterialIcons
                                                    name={field.icon as any || 'text-fields'}
                                                    size={22}
                                                    color={theme.primary}
                                                />
                                            </View>
                                            <View style={styles.fieldContent}>
                                                <Text style={styles.fieldName}>{field.name}</Text>
                                                <Text style={styles.fieldType}>
                                                    {FIELD_TYPE_INFO[field.type]?.label || field.type}
                                                    {field.unit ? ` (${field.unit})` : ''}
                                                </Text>
                                                {field.deletedAt && (
                                                    <Text style={styles.deletedDate}>
                                                        Eliminato il {new Date(field.deletedAt).toLocaleDateString('it-IT')}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={styles.actions}>
                                                <Pressable
                                                    style={[styles.actionButton, styles.restoreButton]}
                                                    onPress={() => handleRestoreField(field.id)}
                                                >
                                                    <MaterialIcons name="restore" size={18} color={theme.primary} />
                                                </Pressable>
                                                <Pressable
                                                    style={[styles.actionButton, styles.deleteButton]}
                                                    onPress={() => handleDeleteFieldForever(field.id)}
                                                >
                                                    <MaterialIcons name="delete-forever" size={18} color={theme.error} />
                                                </Pressable>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Deleted Products Section */}
                            {trashProducts.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>
                                        PRODOTTI ELIMINATI ({trashProducts.length})
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                    data={trashProducts}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            {item.images?.[0] ? (
                                <Image
                                    source={{ uri: item.images[0] }}
                                    style={styles.image}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={[styles.image, styles.imagePlaceholder]}>
                                    <MaterialIcons name="image" size={24} color={theme.textSecondary} />
                                </View>
                            )}
                            <View style={styles.content}>
                                <Text style={styles.sku}>{item.sku}</Text>
                                <Text style={styles.details} numberOfLines={1}>
                                    {item.furType} - {item.location}
                                </Text>
                                <Text style={styles.deletedDate}>
                                    Eliminato il {new Date(item.deletedAt).toLocaleDateString('it-IT')}
                                </Text>
                            </View>
                            <View style={styles.actions}>
                                <Pressable
                                    style={[styles.actionButton, styles.restoreButton]}
                                    onPress={() => handleRestoreProduct(item.id)}
                                >
                                    <MaterialIcons name="restore" size={20} color={theme.primary} />
                                </Pressable>
                                <Pressable
                                    style={[styles.actionButton, styles.deleteButton]}
                                    onPress={() => handleDeleteProductForever(item.id)}
                                >
                                    <MaterialIcons name="delete-forever" size={20} color={theme.error} />
                                </Pressable>
                            </View>
                        </View>
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + 20 }
                    ]}
                />
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
        padding: spacing.screenPadding,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    backButton: {
        marginRight: 16,
    },
    title: {
        ...typography.cardTitle,
        fontSize: 20,
    },
    section: {
        marginBottom: 8,
    },
    sectionTitle: {
        ...typography.sectionHeader,
        marginBottom: 12,
        marginTop: 8,
    },
    listContent: {
        padding: spacing.screenPadding,
        gap: 8,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: theme.surface,
        padding: 12,
        borderRadius: borderRadius.medium,
        alignItems: 'center',
        marginBottom: 8,
        ...shadows.small,
    },
    fieldCard: {
        flexDirection: 'row',
        backgroundColor: theme.surface,
        padding: 12,
        borderRadius: borderRadius.medium,
        alignItems: 'center',
        marginBottom: 8,
    },
    fieldIconBox: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    fieldContent: {
        flex: 1,
    },
    fieldName: {
        ...typography.cardTitle,
        fontSize: 14,
        marginBottom: 2,
    },
    fieldType: {
        ...typography.caption,
        fontSize: 12,
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.small,
        backgroundColor: theme.backgroundSecondary,
    },
    imagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        marginLeft: 12,
    },
    sku: {
        ...typography.cardTitle,
        fontSize: 16,
    },
    details: {
        ...typography.caption,
        fontSize: 13,
        marginTop: 2,
    },
    deletedDate: {
        ...typography.caption,
        fontSize: 11,
        color: theme.error,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 6,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.background,
    },
    restoreButton: {
        backgroundColor: `${theme.primary}15`,
    },
    deleteButton: {
        backgroundColor: `${theme.error}10`,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyText: {
        ...typography.body,
        color: theme.textSecondary,
        fontSize: 18,
    },
    emptySubtext: {
        ...typography.caption,
        color: theme.textMuted,
        fontSize: 14,
    },
});
