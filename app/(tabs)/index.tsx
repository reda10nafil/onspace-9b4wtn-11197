// FurInventory Pro - Home Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { theme, typography, shadows, borderRadius, spacing } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';
import { isDormant, needsPromotion } from '../../services/mockData';

type FilterType = 'all' | 'available' | 'sold' | 'alert' | 'trash';


export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams(); // Read params
  const { products, alerts, filterProducts, deleteProduct, updateProduct, libraries } = useInventory();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeLibraryId, setActiveLibraryId] = useState<string | null>(null);

  // React to param changes (e.g. deep link from scanner)
  React.useEffect(() => {
    if (params.library) {
      setActiveLibraryId(params.library as string);
    }
  }, [params.library]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showActionModal, setShowActionModal] = useState(false); // Controls Modal visibility

  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const trashProducts = products.filter((p) => p.deletedAt);

  // 1. First, filter by Library (Folder)
  const folderFilteredProducts = products.filter((p) => {
    if (activeLibraryId === null) return true;
    return p.libraryId === activeLibraryId;
  });

  // Calculate stats based on the FOLDER (Library) view
  const stats = {
    total: folderFilteredProducts.length,
    available: folderFilteredProducts.filter((p) => p.status === 'available' && !p.deletedAt).length,
    sold: folderFilteredProducts.filter((p) => p.status === 'sold' && !p.deletedAt).length,
    alerts: activeAlerts.filter((a) => {
      const prod = folderFilteredProducts.find((p) => p.id === a.productId);
      return !!prod;
    }).length,
    trash: trashProducts.filter((p) => {
      // Trash is global usually, but if we want to show trash for this folder:
      if (activeLibraryId === null) return true;
      return p.libraryId === activeLibraryId;
    }).length,
  };

  // 2. Then, apply Status Filter & Search on the Folder-filtered list
  const filteredProducts = folderFilteredProducts.filter((p) => {
    // Status Filter
    if (activeFilter === 'available' && (p.status !== 'available' || p.deletedAt)) return false;
    if (activeFilter === 'sold' && (p.status !== 'sold' || p.deletedAt)) return false;
    if (activeFilter === 'trash') return !!p.deletedAt;
    if (activeFilter === 'alert') return activeAlerts.some((a) => a.productId === p.id);
    if (activeFilter === 'all' && p.deletedAt) return false;

    // Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.sku.toLowerCase().includes(query) ||
        p.furType.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'Tutti', count: stats.total - stats.trash },
    { id: 'available', label: 'Disponibili', count: stats.available },
    { id: 'sold', label: 'Venduti', count: stats.sold },
    { id: 'alert', label: 'Attenzione', count: stats.alerts },
    { id: 'trash', label: 'Cestino', count: stats.trash },
  ];

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      const newIds = selectedIds.filter(selectedId => selectedId !== id);
      setSelectedIds(newIds);
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleLongPress = (product: any) => {
    // Enter selection mode if not already active, otherwise toggle
    if (selectedIds.length === 0) {
      setSelectedIds([product.id]);
    } else {
      toggleSelection(product.id);
    }
  };

  const handlePress = (product: any) => {
    if (selectedIds.length > 0) {
      toggleSelection(product.id);
    } else {
      router.push(`/product/${product.id}`);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const exitSelectionMode = () => {
    setSelectedIds([]);
    setShowActionModal(false);
  };

  const handleMoveToLibrary = (libraryId: string | undefined) => {
    if (selectedIds.length === 0) return;

    // Batch update
    selectedIds.forEach(id => {
      updateProduct(id, { libraryId });
    });

    if (libraryId === undefined) {
      Alert.alert('Spostato', `${selectedIds.length} prodotti rimossi dalla cartella`);
    } else {
      const libName = libraries.find(l => l.id === libraryId)?.name;
      Alert.alert('Spostato', `${selectedIds.length} prodotti spostati in "${libName}"`);
    }

    exitSelectionMode();
  };

  const CONFIRM_DELETE_PRODUCT = () => {
    if (selectedIds.length === 0) return;

    Alert.alert(
      'Conferma Eliminazione',
      `Vuoi spostare ${selectedIds.length} prodotti nel cestino?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            selectedIds.forEach(id => deleteProduct(id));
            exitSelectionMode();
          }
        }
      ]
    );
  };

  const renderProductCard = ({ item }: any) => {
    const product = item;
    const hasAlert = activeAlerts.some((a) => a.productId === product.id);
    const dormant = isDormant(product);
    const promotion = needsPromotion(product);

    const isSelected = selectedIds.includes(product.id);
    const isSelectionMode = selectedIds.length > 0;

    return (
      <Pressable
        style={[styles.productCard, isSelected && styles.productCardSelected]}
        onPress={() => handlePress(product)}
        onLongPress={() => handleLongPress(product)}
        delayLongPress={300}
      >
        <Image
          source={{ uri: product.images[0] }}
          style={styles.productImage}
          contentFit="cover"
        />

        {/* Selection Overlay */}
        {isSelectionMode && (
          <View style={styles.selectionOverlay}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <MaterialIcons name="check" size={14} color="#000" />}
            </View>
          </View>
        )}



        {/* Status Badges */}
        <View style={styles.badgeContainer}>
          {product.status === 'sold' && (
            <View style={[styles.badge, styles.badgeSold]}>
              <Text style={styles.badgeText}>VENDUTO</Text>
            </View>
          )}
          {hasAlert && product.status === 'available' && (
            <View style={[styles.badge, styles.badgeAlert]}>
              <MaterialIcons name="warning" size={12} color="#000" />
              <Text style={styles.badgeText}>ALERT</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productSku} numberOfLines={1}>
            {product.sku}
          </Text>
          <Text style={styles.productType} numberOfLines={1}>
            {product.furType.charAt(0).toUpperCase() + product.furType.slice(1)}
          </Text>

          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={14} color={theme.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {product.location.replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          {product.sellPrice && (
            <Text style={styles.priceText}>€{product.sellPrice.toLocaleString()}</Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>FurInventory Pro</Text>
          <Text style={styles.headerSubtitle}>{filteredProducts.length} prodotti</Text>

        </View>
        <View style={styles.headerActions}>
          {selectedIds.length > 0 ? (
            <Pressable
              style={styles.textButton}
              onPress={handleSelectAll}
            >
              <Text style={styles.textButtonLabel}>
                {selectedIds.length === filteredProducts.length ? 'Deseleziona' : 'Seleziona Tutto'}
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={styles.iconButton}
                onPress={() => {
                  setIsSearchVisible(!isSearchVisible);
                  if (isSearchVisible) setSearchQuery('');
                }}
              >
                <MaterialIcons name={isSearchVisible ? "close" : "search"} size={24} color={theme.primary} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Search Bar */}
      {isSearchVisible && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cerca SKU, tipo, posizione..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              placeholderTextColor={theme.textSecondary}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <MaterialIcons name="cancel" size={18} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>
      )}
      {/* Library/Folder Selector - NEW */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.libraryContainer}
        style={styles.libraryScroll}
      >
        <Pressable
          style={[
            styles.libraryChip,
            activeLibraryId === null && styles.libraryChipActive,
          ]}
          onPress={() => setActiveLibraryId(null)}
        >
          <MaterialIcons
            name="apps"
            size={18}
            color={activeLibraryId === null ? '#000000' : theme.textSecondary}
          />
          <Text
            style={[
              styles.libraryText,
              activeLibraryId === null && styles.libraryTextActive,
            ]}
          >
            Tutti
          </Text>
        </Pressable>

        {libraries.map((lib) => (
          <Pressable
            key={lib.id}
            style={[
              styles.libraryChip,
              activeLibraryId === lib.id && styles.libraryChipActive,
            ]}
            onPress={() => setActiveLibraryId(lib.id)}
          >
            <MaterialIcons
              name={lib.icon as any}
              size={18}
              color={activeLibraryId === lib.id ? '#000000' : theme.textSecondary}
            />
            <Text
              style={[
                styles.libraryText,
                activeLibraryId === lib.id && styles.libraryTextActive,
              ]}
            >
              {lib.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContainer}
        style={styles.statsScroll}
      >
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.available}</Text>
          <Text style={styles.statLabel}>DISPONIBILI</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.sold}</Text>
          <Text style={styles.statLabel}>VENDUTI</Text>
        </View>
        <View style={[styles.statCard, stats.alerts > 0 && styles.statCardAlert]}>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>{stats.alerts}</Text>
            {stats.alerts > 0 && (
              <MaterialIcons name="warning" size={20} color={theme.warning} />
            )}
          </View>
          <Text style={styles.statLabel}>RICHIEDONO ATTENZIONE</Text>
        </View>
      </ScrollView>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScroll}
      >
        {filters.map((filter) => (
          <Pressable
            key={filter.id}
            style={[
              styles.filterChip,
              activeFilter === filter.id && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label} ({filter.count})
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Products Grid */}
      <FlashList
        data={filteredProducts}
        renderItem={renderProductCard}
        estimatedItemSize={240}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: spacing.screenPadding,
          paddingBottom: insets.bottom + 16,
        }}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
      />

      {/* Selection Bottom Bar */}
      {selectedIds.length > 0 && (
        <View style={styles.bottomActionBar}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>{selectedIds.length}</Text>
          </View>
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton} onPress={() => setShowActionModal(true)}>
              <MaterialIcons name="folder-open" size={24} color="#000" />
            </Pressable>
            <Pressable style={[styles.actionButton, styles.actionButtonDestructive]} onPress={CONFIRM_DELETE_PRODUCT}>
              <MaterialIcons name="delete" size={24} color="#FFF" />
            </Pressable>
            <Pressable style={styles.closeSelectionButton} onPress={exitSelectionMode}>
              <MaterialIcons name="close" size={24} color={theme.textPrimary} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Product Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowActionModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gestisci {selectedIds.length} Prodotti</Text>
            </View>

            <Text style={styles.modalSectionLabel}>SPOSTA IN CARTELLA</Text>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalList}>
              {/* Option to clear folder */}
              <Pressable
                style={styles.modalOption}
                onPress={() => handleMoveToLibrary(undefined)}
              >
                <View style={styles.modalOptionIcon}>
                  <MaterialIcons name="folder-off" size={20} color={theme.textSecondary} />
                </View>
                <Text style={styles.modalOptionText}>Rimuovi dalla cartella</Text>
              </Pressable>

              {libraries.map(lib => (
                <Pressable
                  key={lib.id}
                  style={styles.modalOption}
                  onPress={() => handleMoveToLibrary(lib.id)}
                >
                  <View style={styles.modalOptionIcon}>
                    <MaterialIcons
                      name={lib.icon as any}
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={styles.modalOptionText}>{lib.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable style={styles.modalCancelButton} onPress={() => setShowActionModal(false)}>
              <Text style={styles.modalCancelText}>Annulla</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
  },
  headerTitle: {
    ...typography.cardTitle,
    fontSize: 20,
  },
  headerSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsScroll: {
    maxHeight: 100,
  },
  statsContainer: {
    paddingHorizontal: spacing.screenPadding,
    gap: 12,
    paddingVertical: 8,
  },
  statCard: {
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: borderRadius.medium,
    minWidth: 140,
    ...shadows.card,
  },
  statCardAlert: {
    borderWidth: 1,
    borderColor: theme.warning,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    ...typography.cardValue,
    fontSize: 32,
    color: theme.primary,
  },
  statLabel: {
    ...typography.heroLabel,
    marginTop: 4,
  },
  filterScroll: {
    maxHeight: 50,
    marginTop: 8,
  },
  filterContainer: {
    paddingHorizontal: spacing.screenPadding,
    gap: 8,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: theme.border,
    minWidth: 90,
    minHeight: 48,
  },
  filterChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterText: {
    ...typography.caption,
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  filterTextActive: {
    color: '#000000',
  },
  productCard: {
    flex: 1,
    margin: 6,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    ...shadows.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productCardSelected: {
    borderColor: theme.primary,
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1.5,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: theme.backgroundSecondary,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    gap: 4,
  },
  badgeSold: {
    backgroundColor: theme.textSecondary,
  },
  badgeAlert: {
    backgroundColor: theme.warning,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  productInfo: {
    padding: 12,
  },
  productSku: {
    ...typography.cardTitle,
    fontSize: 14,
    marginBottom: 4,
  },
  productType: {
    ...typography.caption,
    fontSize: 12,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    ...typography.caption,
    fontSize: 11,
    flex: 1,
  },
  priceText: {
    ...typography.cardValue,
    fontSize: 16,
    color: theme.primary,
  },
  searchContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.textSecondary,
  },
  cardDeleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButtonActive: {
    backgroundColor: theme.surfaceElevated,
    borderRadius: borderRadius.full,
  },
  libraryScroll: {
    maxHeight: 50,
    marginTop: 12,
  },
  libraryContainer: {
    paddingHorizontal: spacing.screenPadding,
    gap: 8,
  },
  libraryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.surface,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  libraryChipActive: {
    backgroundColor: theme.primary, // Gold for active
    borderColor: theme.primary,
  },
  libraryText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  libraryTextActive: {
    color: '#000000', // Black text on Gold background
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.screenPadding,
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.large,
    padding: 20,
    maxHeight: '80%',
    ...shadows.cardElevated,
  },
  modalHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.cardTitle,
    fontSize: 18,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...typography.caption,
    fontSize: 14,
    color: theme.primary,
  },
  modalSectionLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 4,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalList: {
    gap: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: borderRadius.medium,
    backgroundColor: theme.backgroundSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalOptionSelected: {
    borderColor: theme.primary,
    backgroundColor: `${theme.primary}15`, // 15% opacity gold
  },
  modalOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.small,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalOptionIconSelected: {
    backgroundColor: theme.primary,
  },
  modalOptionText: {
    ...typography.body,
    fontSize: 15,
    flex: 1,
  },
  modalOptionTextSelected: {
    color: theme.primary,
    fontWeight: '600',
  },
  modalDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 20,
  },
  modalDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: borderRadius.medium,
    backgroundColor: `${theme.error}15`,
    marginBottom: 12,
  },
  modalDeleteText: {
    ...typography.buttonPrimary,
    color: theme.error,
    fontSize: 15,
  },
  modalCancelText: {
    ...typography.bodySecondary,
    fontWeight: '600',
  },
  modalCancelButton: {
    paddingVertical: 14,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.large,
    padding: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...shadows.cardElevated,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionCount: {
    ...typography.cardTitle,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: theme.primary,
    borderRadius: borderRadius.full,
  },
  actionButtonDestructive: {
    backgroundColor: theme.error,
  },
  actionButtonText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#000',
    fontSize: 13,
  },
  closeSelectionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: borderRadius.full,
  },
  textButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textButtonLabel: {
    ...typography.buttonPrimary,
    color: theme.primary,
    fontSize: 14,
  },
});
