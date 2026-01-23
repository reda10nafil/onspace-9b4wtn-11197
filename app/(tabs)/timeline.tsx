// FurInventory Pro - Global Timeline Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme, typography, borderRadius, spacing } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';
import { TimelineEvent } from '../../types';

type FilterType = 'all' | 'created' | 'moved' | 'modified' | 'sold' | 'photo_added';
type DateFilter = 'all' | 'today' | 'week' | 'month';

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { timeline, getProductById } = useInventory();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created': return 'add-circle';
      case 'moved': return 'swap-horiz';
      case 'modified': return 'edit';
      case 'sold': return 'sell';
      case 'scanned': return 'qr-code-scanner';
      case 'photo_added': return 'add-photo-alternate';
      default: return 'circle';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'created': return '#10B981';
      case 'moved': return '#3B82F6';
      case 'modified': return theme.primary;
      case 'sold': return '#10B981';
      case 'scanned': return '#8B5CF6';
      case 'photo_added': return '#F59E0B';
      default: return theme.textSecondary;
    }
  };

  const getEventTitle = (event: TimelineEvent) => {
    const product = getProductById(event.productId);
    const sku = product?.sku || 'Prodotto eliminato';

    switch (event.type) {
      case 'created':
        return `${sku} - Creato`;
      case 'moved':
        return `${sku} - Spostato: ${event.details.from} → ${event.details.to}`;
      case 'modified':
        if (event.details.changes && event.details.changes.length > 0) {
          return `${sku} - ${event.details.changes[0]}`;
        }
        return `${sku} - Modificato`;
      case 'sold':
        const price = event.details.finalPrice ? ` - €${event.details.finalPrice.toLocaleString()}` : '';
        return `${sku} - Venduto${price}`;
      case 'scanned':
        return `${sku} - Scansionato`;
      case 'photo_added':
        const count = event.details.photoCount || 1;
        return `${sku} - ${count} foto aggiunte`;
      default:
        return `${sku} - Evento`;
    }
  };

  const getEventDescription = (event: TimelineEvent) => {
    if (event.type === 'modified' && event.details.changes) {
      return event.details.changes.slice(1).join(' • ');
    }
    return '';
  };

  const filterByDate = (event: TimelineEvent): boolean => {
    const eventDate = new Date(event.timestamp);
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return eventDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return eventDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return eventDate >= monthAgo;
      default:
        return true;
    }
  };

  const filteredTimeline = timeline
    .filter((event) => filterType === 'all' || event.type === filterType)
    .filter((event) => filterByDate(event))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleEventPress = (event: TimelineEvent) => {
    const product = getProductById(event.productId);
    if (product) {
      router.push(`/product/${event.productId}`);
    } else {
      Alert.alert('Prodotto Non Trovato', 'Questo prodotto è stato eliminato');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cronologia Completa</Text>
        <Text style={styles.headerCount}>{filteredTimeline.length} eventi</Text>
      </View>

      {/* Type Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
        style={styles.filterScroll}
      >
        <Pressable
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
            Tutti
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filterType === 'created' && styles.filterChipActive]}
          onPress={() => setFilterType('created')}
        >
          <Text style={[styles.filterChipText, filterType === 'created' && styles.filterChipTextActive]}>
            Creati
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filterType === 'moved' && styles.filterChipActive]}
          onPress={() => setFilterType('moved')}
        >
          <Text style={[styles.filterChipText, filterType === 'moved' && styles.filterChipTextActive]}>
            Spostati
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filterType === 'modified' && styles.filterChipActive]}
          onPress={() => setFilterType('modified')}
        >
          <Text style={[styles.filterChipText, filterType === 'modified' && styles.filterChipTextActive]}>
            Modificati
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filterType === 'sold' && styles.filterChipActive]}
          onPress={() => setFilterType('sold')}
        >
          <Text style={[styles.filterChipText, filterType === 'sold' && styles.filterChipTextActive]}>
            Venduti
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filterType === 'photo_added' && styles.filterChipActive]}
          onPress={() => setFilterType('photo_added')}
        >
          <Text style={[styles.filterChipText, filterType === 'photo_added' && styles.filterChipTextActive]}>
            Foto
          </Text>
        </Pressable>
      </ScrollView>

      {/* Date Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateFilterScrollContent}
        style={styles.dateFilterScroll}
      >
        <Pressable
          style={[styles.dateChip, dateFilter === 'all' && styles.dateChipActive]}
          onPress={() => setDateFilter('all')}
        >
          <Text style={[styles.dateChipText, dateFilter === 'all' && styles.dateChipTextActive]}>
            Tutti i Periodi
          </Text>
        </Pressable>
        <Pressable
          style={[styles.dateChip, dateFilter === 'today' && styles.dateChipActive]}
          onPress={() => setDateFilter('today')}
        >
          <Text style={[styles.dateChipText, dateFilter === 'today' && styles.dateChipTextActive]}>
            Oggi
          </Text>
        </Pressable>
        <Pressable
          style={[styles.dateChip, dateFilter === 'week' && styles.dateChipActive]}
          onPress={() => setDateFilter('week')}
        >
          <Text style={[styles.dateChipText, dateFilter === 'week' && styles.dateChipTextActive]}>
            Questa Settimana
          </Text>
        </Pressable>
        <Pressable
          style={[styles.dateChip, dateFilter === 'month' && styles.dateChipActive]}
          onPress={() => setDateFilter('month')}
        >
          <Text style={[styles.dateChipText, dateFilter === 'month' && styles.dateChipTextActive]}>
            Questo Mese
          </Text>
        </Pressable>
      </ScrollView>

      {/* Timeline List */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.screenPadding,
          paddingBottom: insets.bottom + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {filteredTimeline.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="timeline" size={64} color={theme.textSecondary} />
            <Text style={styles.emptyText}>Nessun evento trovato</Text>
          </View>
        )}

        {filteredTimeline.map((event) => (
          <Pressable
            key={event.id}
            style={styles.timelineItem}
            onPress={() => handleEventPress(event)}
          >
            <View style={[styles.eventIcon, { backgroundColor: `${getEventColor(event.type)}20` }]}>
              <MaterialIcons
                name={getEventIcon(event.type) as any}
                size={24}
                color={getEventColor(event.type)}
              />
            </View>
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>{getEventTitle(event)}</Text>
              {getEventDescription(event) !== '' && (
                <Text style={styles.eventDescription}>{getEventDescription(event)}</Text>
              )}
              <Text style={styles.eventDate}>
                {new Date(event.timestamp).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
  },
  headerTitle: {
    ...typography.cardTitle,
    fontSize: 24,
  },
  headerCount: {
    ...typography.caption,
    fontSize: 14,
    marginTop: 4,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.screenPadding,
    gap: 8,
  },
  dateFilterScroll: {
    marginBottom: 16,
  },
  dateFilterScrollContent: {
    paddingHorizontal: spacing.screenPadding,
    gap: 8,
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
  filterChipText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  filterChipTextActive: {
    color: '#000',
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dateChipActive: {
    backgroundColor: `${theme.primary}30`,
    borderColor: theme.primary,
  },
  dateChipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  dateChipTextActive: {
    color: theme.primary,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 14,
    marginBottom: 8,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    ...typography.cardTitle,
    fontSize: 14,
    marginBottom: 2,
  },
  eventDescription: {
    ...typography.caption,
    fontSize: 12,
    marginBottom: 4,
  },
  eventDate: {
    ...typography.caption,
    fontSize: 11,
    color: theme.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    ...typography.caption,
    fontSize: 16,
    marginTop: 16,
  },
});
