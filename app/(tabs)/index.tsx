// FurInventory Pro - Home Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { theme, typography, shadows, borderRadius, spacing } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';
import { isDormant, needsPromotion } from '../../services/mockData';

type FilterType = 'all' | 'available' | 'sold' | 'alert';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { products, alerts, filterProducts } = useInventory();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredProducts = filterProducts(activeFilter);
  const activeAlerts = alerts.filter((a) => !a.dismissed);

  const stats = {
    total: products.length,
    available: products.filter((p) => p.status === 'available').length,
    sold: products.filter((p) => p.status === 'sold').length,
    alerts: activeAlerts.length,
  };

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'Tutti', count: stats.total },
    { id: 'available', label: 'Disponibili', count: stats.available },
    { id: 'sold', label: 'Venduti', count: stats.sold },
    { id: 'alert', label: 'Attenzione', count: stats.alerts },
  ];

  const renderProductCard = ({ item }: any) => {
    const product = item;
    const hasAlert = activeAlerts.some((a) => a.productId === product.id);
    const dormant = isDormant(product);
    const promotion = needsPromotion(product);

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => router.push(`/product/${product.id}`)}
      >
        <Image
          source={{ uri: product.images[0] }}
          style={styles.productImage}
          contentFit="cover"
        />
        
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
        <Pressable style={styles.iconButton}>
          <MaterialIcons name="search" size={24} color={theme.primary} />
        </Pressable>
      </View>

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
      />
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
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
});
