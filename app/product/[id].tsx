// FurInventory Pro - Product Detail Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Image } from 'expo-image';
import { theme, typography, shadows, borderRadius, spacing } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';
import { LOCATIONS, FUR_TYPES } from '../../constants/config';

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getProductById, getTimelineForProduct } = useInventory();

  const product = getProductById(id as string);
  const timeline = getTimelineForProduct(id as string);

  if (!product) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Prodotto non trovato</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { width: screenWidth } = Dimensions.get('window');
  
  const location = LOCATIONS.find((l) => l.id === product.location);
  const furType = FUR_TYPES.find((f) => f.id === product.furType);

  const generateClientText = () => {
    let text = `✨ ${furType?.label || product.furType} - ${product.sku}\n\n`;
    
    if (product.length || product.width || product.weight) {
      text += '📐 MISURE:\n';
      if (product.length) text += `   Lunghezza: ${product.length} cm\n`;
      if (product.width) text += `   Larghezza: ${product.width} cm\n`;
      if (product.weight) text += `   Peso: ${product.weight} kg\n`;
      text += '\n';
    }
    
    if (product.sellPrice) {
      text += `💰 PREZZO: €${product.sellPrice.toLocaleString()}\n\n`;
    }
    
    if (product.technicalNotes) {
      text += `📝 ${product.technicalNotes}\n\n`;
    } else {
      text += '📝 Pelliccia di alta qualità\n\n';
    }
    
    text += `📍 Disponibile presso: ${location?.label || product.location}`;
    
    return text;
  };

  const generateProfessionalText = () => {
    let text = `╔════════════════════════════════════════╗\n`;
    text += `║   SCHEDA TECNICA PRODOTTO PELLICCIA   ║\n`;
    text += `╚════════════════════════════════════════╝\n\n`;
    
    text += `SKU: ${product.sku}\n`;
    text += `TIPO: ${furType?.label || product.furType}\n`;
    text += `STATO: ${product.status === 'available' ? 'Disponibile' : 'Venduto'}\n`;
    text += `POSIZIONE: ${location?.label || product.location}\n`;
    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    text += `📐 MISURE DETTAGLIATE:\n`;
    text += `   • Lunghezza: ${product.length || 'N/D'} cm\n`;
    text += `   • Larghezza: ${product.width || 'N/D'} cm\n`;
    text += `   • Peso: ${product.weight || 'N/D'} kg\n`;
    text += `\n`;
    
    text += `💰 ANALISI PREZZI:\n`;
    text += `   • Prezzo Acquisto: €${product.purchasePrice?.toLocaleString() || 'N/D'}\n`;
    text += `   • Prezzo Vendita: €${product.sellPrice?.toLocaleString() || 'N/D'}\n`;
    if (product.purchasePrice && product.sellPrice) {
      const margin = product.sellPrice - product.purchasePrice;
      const marginPercent = ((margin / product.purchasePrice) * 100).toFixed(1);
      text += `   • Margine: €${margin.toLocaleString()} (+${marginPercent}%)\n`;
    }
    text += `\n`;
    
    text += `📅 DATE IMPORTANTI:\n`;
    text += `   • Data Produzione: ${product.productionDate || 'N/D'}\n`;
    text += `   • Data Creazione: ${new Date(product.createdAt).toLocaleDateString('it-IT')}\n`;
    text += `   • Ultimo Aggiornamento: ${new Date(product.updatedAt).toLocaleDateString('it-IT')}\n`;
    if (product.lastScannedAt) {
      text += `   • Ultima Scansione: ${new Date(product.lastScannedAt).toLocaleDateString('it-IT')}\n`;
    }
    if (product.soldAt) {
      text += `   • Data Vendita: ${new Date(product.soldAt).toLocaleDateString('it-IT')}\n`;
    }
    text += `\n`;
    
    text += `📝 NOTE TECNICHE:\n`;
    text += `${product.technicalNotes || 'Nessuna nota disponibile'}\n`;
    text += `\n`;
    
    text += `📊 CRONOLOGIA MOVIMENTI:\n`;
    timeline.slice(0, 5).forEach((event) => {
      const date = new Date(event.timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
      let eventText = '';
      if (event.type === 'created') eventText = 'Creato';
      else if (event.type === 'moved') eventText = `${event.details.from} → ${event.details.to}`;
      else if (event.type === 'sold') eventText = 'Venduto';
      else if (event.type === 'modified') eventText = 'Modificato';
      text += `   • ${date}: ${eventText}\n`;
    });
    
    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Documento generato: ${new Date().toLocaleString('it-IT')}\n`;
    
    return text;
  };

  const handleShare = async () => {
    Alert.alert(
      'Condividi Prodotto',
      'Scegli il tipo di condivisione:',
      [
        {
          text: 'Cliente',
          onPress: async () => {
            const text = generateClientText();
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync('data:text/plain;base64,' + Buffer.from(text).toString('base64'), {
                dialogTitle: `Condividi ${product.sku}`,
                mimeType: 'text/plain',
                UTI: 'public.plain-text',
              }).catch(() => {
                Alert.alert('Dettagli Cliente', text, [
                  { text: 'OK' },
                ]);
              });
            } else {
              Alert.alert('Dettagli Cliente', text, [
                { text: 'OK' },
              ]);
            }
          },
        },
        {
          text: 'Professionista',
          onPress: () => {
            const text = generateProfessionalText();
            Alert.alert('Scheda Tecnica Completa', text, [
              { text: 'OK' },
            ]);
          },
        },
        { text: 'Annulla', style: 'cancel' },
      ]
    );
  };

  const handlePrintQR = async () => {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>QR Code - ${product.sku}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .qr-container {
              text-align: center;
              padding: 30px;
              border: 2px solid #000;
              border-radius: 12px;
            }
            .qr-code {
              margin: 20px 0;
            }
            h1 {
              font-size: 24px;
              font-weight: bold;
              margin: 0 0 10px 0;
              color: #000;
            }
            p {
              font-size: 16px;
              margin: 5px 0;
              color: #333;
            }
            .sku {
              font-size: 20px;
              font-weight: 600;
              color: #D4AF37;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>FurInventory Pro</h1>
            <p>${furType?.label || product.furType}</p>
            <div class="qr-code">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <!-- QR Code placeholder - In production, use actual QR generation -->
                <rect width="200" height="200" fill="#000"/>
                <text x="100" y="100" text-anchor="middle" dy=".3em" fill="#FFF" font-size="14">
                  QR: ${product.sku}
                </text>
              </svg>
            </div>
            <p class="sku">${product.sku}</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        dialogTitle: `QR Code - ${product.sku}`,
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      Alert.alert('Errore', 'Impossibile generare il QR code stampabile');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Gallery */}
        <View style={styles.imageGalleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {product.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={[styles.heroImage, { width: screenWidth }]}
                contentFit="cover"
              />
            ))}
          </ScrollView>
          
          {/* Image Counter */}
          {product.images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1}/{product.images.length}
              </Text>
            </View>
          )}
          
          {/* Pagination Dots */}
          {product.images.length > 1 && (
            <View style={styles.paginationDots}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentImageIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Status Badge */}
        {product.status === 'sold' && (
          <View style={styles.soldBadge}>
            <MaterialIcons name="sell" size={16} color="#FFF" />
            <Text style={styles.soldText}>VENDUTO</Text>
          </View>
        )}

        {/* Product Info */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.sku}>{product.sku}</Text>
              <Text style={styles.furType}>{furType?.label || product.furType}</Text>
            </View>
            <Pressable style={styles.shareButton} onPress={handleShare}>
              <MaterialIcons name="share" size={24} color={theme.primary} />
            </Pressable>
          </View>

          {/* Location Card */}
          <View style={[styles.locationCard, { borderColor: location?.color || theme.border }]}>
            <MaterialIcons name="location-on" size={24} color={location?.color || theme.primary} />
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>POSIZIONE ATTUALE</Text>
              <Text style={styles.locationValue}>{location?.label || product.location}</Text>
            </View>
          </View>

          {/* Prices */}
          {(product.purchasePrice || product.sellPrice) && (
            <View style={styles.priceSection}>
              <Text style={styles.sectionTitle}>PREZZI</Text>
              <View style={styles.priceRow}>
                {product.purchasePrice && (
                  <View style={styles.priceCard}>
                    <Text style={styles.priceLabel}>Acquisto</Text>
                    <Text style={styles.priceValue}>€{product.purchasePrice.toLocaleString()}</Text>
                  </View>
                )}
                {product.sellPrice && (
                  <View style={styles.priceCard}>
                    <Text style={styles.priceLabel}>Vendita</Text>
                    <Text style={[styles.priceValue, { color: theme.primary }]}>
                      €{product.sellPrice.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Measurements */}
          {(product.length || product.width || product.weight) && (
            <View style={styles.measureSection}>
              <Text style={styles.sectionTitle}>MISURE</Text>
              <View style={styles.measureRow}>
                {product.length && (
                  <View style={styles.measureCard}>
                    <MaterialIcons name="straighten" size={20} color={theme.textSecondary} />
                    <Text style={styles.measureLabel}>Lunghezza</Text>
                    <Text style={styles.measureValue}>{product.length} cm</Text>
                  </View>
                )}
                {product.width && (
                  <View style={styles.measureCard}>
                    <MaterialIcons name="width-wide" size={20} color={theme.textSecondary} />
                    <Text style={styles.measureLabel}>Larghezza</Text>
                    <Text style={styles.measureValue}>{product.width} cm</Text>
                  </View>
                )}
                {product.weight && (
                  <View style={styles.measureCard}>
                    <MaterialIcons name="scale" size={20} color={theme.textSecondary} />
                    <Text style={styles.measureLabel}>Peso</Text>
                    <Text style={styles.measureValue}>{product.weight} kg</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Technical Notes */}
          {product.technicalNotes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>NOTE TECNICHE</Text>
              <Text style={styles.notesText}>{product.technicalNotes}</Text>
            </View>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <View style={styles.timelineSection}>
              <Text style={styles.sectionTitle}>CRONOLOGIA DETTAGLIATA</Text>
              {timeline.map((event) => {
                let eventText = '';
                if (event.type === 'created') eventText = 'Prodotto creato';
                else if (event.type === 'moved') eventText = `Spostato: ${event.details.from} → ${event.details.to}`;
                else if (event.type === 'sold') {
                  const price = event.details.finalPrice ? ` - €${event.details.finalPrice.toLocaleString()}` : '';
                  eventText = `Venduto${price}`;
                }
                else if (event.type === 'scanned') eventText = 'Scansionato';
                else if (event.type === 'photo_added') eventText = `${event.details.photoCount} foto aggiunte`;
                else if (event.type === 'modified' && event.details.changes) {
                  eventText = event.details.changes[0];
                }
                else if (event.type === 'modified') eventText = 'Modificato';
                
                return (
                  <View key={event.id} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineType}>{eventText}</Text>
                      {event.type === 'modified' && event.details.changes && event.details.changes.length > 1 && (
                        <Text style={styles.timelineChanges}>
                          {event.details.changes.slice(1).join(' • ')}
                        </Text>
                      )}
                      <Text style={styles.timelineDate}>
                        {new Date(event.timestamp).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>QR CODE PRODOTTO</Text>
            <Pressable style={styles.qrButton} onPress={handlePrintQR}>
              <MaterialIcons name="print" size={24} color={theme.primary} />
              <Text style={styles.qrButtonText}>Stampa QR Code</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.actionButtonSecondary} onPress={() => router.back()}>
          <Text style={styles.actionButtonTextSecondary}>Indietro</Text>
        </Pressable>
        <Pressable
          style={styles.actionButtonPrimary}
          onPress={() => router.push(`/product/edit/${product.id}`)}
        >
          <MaterialIcons name="edit" size={20} color="#000" />
          <Text style={styles.actionButtonTextPrimary}>Modifica</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  imageGalleryContainer: {
    position: 'relative',
  },
  heroImage: {
    height: 320,
    backgroundColor: theme.backgroundSecondary,
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.medium,
  },
  imageCounterText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: theme.primary,
    width: 24,
  },
  soldBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.textSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.medium,
  },
  soldText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    padding: spacing.screenPadding,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleLeft: {
    flex: 1,
  },
  sku: {
    ...typography.cardTitle,
    fontSize: 24,
    marginBottom: 4,
  },
  furType: {
    ...typography.caption,
    fontSize: 16,
  },
  shareButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
  },
  locationContent: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    ...typography.heroLabel,
    marginBottom: 2,
  },
  locationValue: {
    ...typography.cardTitle,
    fontSize: 18,
  },
  sectionTitle: {
    ...typography.sectionHeader,
    marginBottom: 12,
  },
  priceSection: {
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 16,
  },
  priceLabel: {
    ...typography.caption,
    fontSize: 12,
    marginBottom: 4,
  },
  priceValue: {
    ...typography.cardValue,
    fontSize: 24,
  },
  measureSection: {
    marginBottom: 24,
  },
  measureRow: {
    flexDirection: 'row',
    gap: 12,
  },
  measureCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 12,
    alignItems: 'center',
  },
  measureLabel: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 6,
    marginBottom: 2,
  },
  measureValue: {
    ...typography.cardTitle,
    fontSize: 16,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesText: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 16,
  },
  timelineSection: {
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.primary,
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineType: {
    ...typography.cardTitle,
    fontSize: 15,
    marginBottom: 2,
  },
  timelineDate: {
    ...typography.caption,
    fontSize: 12,
  },
  timelineChanges: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 2,
  },
  qrSection: {
    marginBottom: 16,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.primary,
    borderStyle: 'dashed',
  },
  qrButtonText: {
    ...typography.cardTitle,
    fontSize: 15,
    color: theme.primary,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 16,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  actionButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionButtonTextSecondary: {
    ...typography.buttonSecondary,
    fontSize: 16,
  },
  actionButtonPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: theme.primary,
    borderRadius: borderRadius.medium,
    ...shadows.card,
  },
  actionButtonTextPrimary: {
    ...typography.buttonPrimary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.cardTitle,
    fontSize: 18,
  },
});
