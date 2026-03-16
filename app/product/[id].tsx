// FurInventory Pro - Product Detail Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, useWindowDimensions, Share, Modal, StatusBar } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import * as Sharing from 'expo-sharing';
import { Image } from 'expo-image';
import { theme, typography, shadows, borderRadius, spacing } from '../../constants/theme';
import { useInventory } from '../../contexts/InventoryContext';
import { FUR_TYPES } from '../../constants/config';
import { useLocations } from '../../contexts/LocationsContext';
import { useCustomFields } from '../../contexts/CustomFieldsContext';
import Barcode from '../../components/Barcode';

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getProductById, getTimelineForProduct } = useInventory();
  const { locations } = useLocations();
  const { customFields } = useCustomFields();

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
  const [isModalVisible, setModalVisible] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const heroWidth = Math.max(1, screenWidth);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [codeType, setCodeType] = useState<'qr' | 'barcode'>('qr');

  const location = locations.find((l) => l.id === product.location);
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
            try {
              const text = generateClientText();
              const shareOptions: any = {
                message: text,
                title: `${product.sku} - ${furType?.label || product.furType}`,
              };

              // Add first image if available
              if (product.images && product.images.length > 0) {
                shareOptions.url = product.images[0];
              }

              await Share.share(shareOptions);
            } catch (error) {
              console.error('Errore condivisione cliente:', error);
            }
          },
        },
        {
          text: 'Professionista',
          onPress: async () => {
            try {
              const text = generateProfessionalText();
              const shareOptions: any = {
                message: text,
                title: `Scheda Tecnica - ${product.sku}`,
              };

              // Add first image if available
              if (product.images && product.images.length > 0) {
                shareOptions.url = product.images[0];
              }

              await Share.share(shareOptions);
            } catch (error) {
              console.error('Errore condivisione professionista:', error);
            }
          },
        },
        { text: 'Annulla', style: 'cancel' },
      ]
    );
  };

  const handlePrintLabel = async () => {
    try {
      const qrHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              font-family: sans-serif;
            }
            .label {
              text-align: center;
              border: 1px dashed #000;
              padding: 20px;
              border-radius: 10px;
            }
            .sku {
              font-size: 24px;
              font-weight: bold;
              margin-top: 10px;
            }
            .meta {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div id="qrcode"></div>
            <div class="sku">${product.sku}</div>
            <div class="meta">${product.furType} - ${location?.label || product.location}</div>
          </div>
          <script src="https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js"></script>
          <script>
            new QRCode(document.getElementById("qrcode"), {
              text: "${product.sku}",
              width: 200,
              height: 200
            });
          </script>
        </body>
        </html>
      `;

      const barcodeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              font-family: sans-serif;
            }
            .label {
              text-align: center;
              border: 1px dashed #000;
              padding: 20px;
              border-radius: 10px;
              width: 300px;
            }
            .sku {
              font-size: 24px;
              font-weight: bold;
              margin-top: 10px;
            }
            .meta {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            svg {
              width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <svg id="barcode"></svg>
            <div class="sku">${product.sku}</div>
            <div class="meta">${product.furType} - ${location?.label || product.location}</div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            JsBarcode("#barcode", "${product.sku}", {
              format: "CODE128",
              width: 2,
              height: 100,
              displayValue: false
            });
          </script>
        </body>
        </html>
      `;

      const html = codeType === 'qr' ? qrHtml : barcodeHtml;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Errore', 'Impossibile stampare l\'etichetta');
    }
  };

  const handlePrintPDF = async () => {
    try {
      // Convert ALL images to base64 for embedding (compressed)
      const imagesBase64: string[] = [];
      if (product.images && product.images.length > 0) {
        for (let i = 0; i < product.images.length; i++) {
          try {
            console.log(`Processing image ${i + 1}/${product.images.length} for PDF`);
            const manipulatedImage = await ImageManipulator.manipulateAsync(
              product.images[i],
              [{ resize: { width: 600 } }],
              { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
            );
            const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
              encoding: 'base64',
            });
            imagesBase64.push(base64);
          } catch (error) {
            console.error(`Could not process image ${i + 1}:`, error);
          }
        }
        console.log(`Processed ${imagesBase64.length} images for PDF`);
      }

      // Build timeline HTML
      let timelineHTML = '';
      timeline.slice(0, 10).forEach((event) => {
        let eventText = '';
        if (event.type === 'created') eventText = 'Creato';
        else if (event.type === 'moved') eventText = `Spostato: ${event.details.from} → ${event.details.to}`;
        else if (event.type === 'sold') eventText = 'Venduto';
        else if (event.type === 'modified') eventText = event.details.changes?.[0] || 'Modificato';
        else if (event.type === 'scanned') eventText = 'Scansionato';
        else if (event.type === 'photo_added') eventText = `${event.details.photoCount} foto aggiunte`;

        const date = new Date(event.timestamp).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        timelineHTML += `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-text">${eventText}</div>
              <div class="timeline-date">${date}</div>
            </div>
          </div>
        `;
      });

      // Build photo gallery HTML
      let galleryHTML = '';
      if (imagesBase64.length > 0) {
        galleryHTML = `
          <div class="section">
            <div class="section-title">Galleria Foto (${imagesBase64.length})</div>
            <div class="gallery">
              ${imagesBase64.map((img, idx) => `
                <div class="gallery-item">
                  <img src="data:image/jpeg;base64,${img}" alt="Foto ${idx + 1}" />
                  <div class="gallery-caption">Foto ${idx + 1}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Scheda Prodotto - ${product.sku}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              background: #fff;
              color: #000;
              padding: 40px;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #D4AF37;
            }
            .header h1 {
              font-size: 32px;
              font-weight: bold;
              color: #000;
              margin-bottom: 8px;
            }
            .header .sku {
              font-size: 24px;
              font-weight: 600;
              color: #D4AF37;
              margin-bottom: 4px;
            }
            .header .fur-type {
              font-size: 18px;
              color: #666;
            }
            ${product.status === 'sold' ? `
            .sold-badge {
              display: inline-block;
              background: #999;
              color: #fff;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: bold;
              margin-top: 12px;
            }
            ` : ''}
            .location-card {
              background: #f8f8f8;
              border: 2px solid ${location?.color || '#D4AF37'};
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .location-card .label {
              font-size: 11px;
              font-weight: 600;
              color: #999;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }
            .location-card .value {
              font-size: 20px;
              font-weight: 600;
              color: ${location?.color || '#D4AF37'};
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 13px;
              font-weight: 700;
              color: #999;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 16px;
            }
            .cards-row {
              display: flex;
              gap: 16px;
              margin-bottom: 20px;
              flex-wrap: wrap;
            }
            .card {
              flex: 1;
              min-width: 120px;
              background: #f8f8f8;
              border-radius: 10px;
              padding: 16px;
            }
            .card-label {
              font-size: 12px;
              color: #999;
              margin-bottom: 6px;
            }
            .card-value {
              font-size: 22px;
              font-weight: 600;
              color: #000;
            }
            .card-value.primary {
              color: #D4AF37;
            }
            .notes-box {
              background: #f8f8f8;
              border-radius: 10px;
              padding: 20px;
              font-size: 15px;
              line-height: 1.8;
              color: #333;
            }
            .gallery {
              display: flex;
              flex-direction: column;
              gap: 20px;
            }
            .gallery-item {
              width: 100%;
              text-align: center;
              page-break-inside: avoid;
            }
            .gallery-item img {
              width: auto;
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              border: 1px solid #ddd;
            }
            .gallery-caption {
              font-size: 12px;
              color: #999;
              margin-top: 8px;
            }
            .timeline-item {
              display: flex;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .timeline-dot {
              width: 12px;
              height: 12px;
              background: #D4AF37;
              border-radius: 50%;
              margin-top: 4px;
              margin-right: 16px;
              flex-shrink: 0;
            }
            .timeline-content {
              flex: 1;
            }
            .timeline-text {
              font-size: 15px;
              font-weight: 600;
              color: #000;
              margin-bottom: 4px;
            }
            .timeline-date {
              font-size: 12px;
              color: #999;
            }
            .codes-section {
              margin-top: 40px;
              padding: 30px;
              background: #f8f8f8;
              border-radius: 12px;
              border: 2px dashed #D4AF37;
            }
            .codes-container {
              display: flex;
              justify-content: center;
              gap: 60px;
              align-items: flex-start;
              flex-wrap: wrap;
            }
            .code-block {
              text-align: center;
            }
            .code-block .code-label {
              font-size: 12px;
              font-weight: 600;
              color: #999;
              text-transform: uppercase;
              margin-bottom: 12px;
            }
            .code-block .code-value {
              font-size: 14px;
              font-weight: 600;
              color: #D4AF37;
              margin-top: 8px;
            }
            #qrcode {
              display: inline-block;
            }
            #barcode {
              max-width: 200px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 11px;
              color: #999;
            }
            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <h1>FurInventory Pro</h1>
            <div class="sku">${product.sku}</div>
            <div class="fur-type">${furType?.label || product.furType}</div>
            ${product.status === 'sold' ? '<div class="sold-badge">VENDUTO</div>' : ''}
          </div>

          <!-- Location -->
          <div class="location-card">
            <div class="label">Posizione Attuale</div>
            <div class="value">${location?.label || product.location}</div>
          </div>

          <!-- Prices -->
          ${(product.purchasePrice || product.sellPrice) ? `
            <div class="section">
              <div class="section-title">Prezzi</div>
              <div class="cards-row">
                ${product.purchasePrice ? `
                  <div class="card">
                    <div class="card-label">Acquisto</div>
                    <div class="card-value">€${product.purchasePrice.toLocaleString()}</div>
                  </div>
                ` : ''}
                ${product.sellPrice ? `
                  <div class="card">
                    <div class="card-label">Vendita</div>
                    <div class="card-value primary">€${product.sellPrice.toLocaleString()}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Measurements -->
          ${(product.length || product.width || product.weight) ? `
            <div class="section">
              <div class="section-title">Misure</div>
              <div class="cards-row">
                ${product.length ? `
                  <div class="card">
                    <div class="card-label">Lunghezza</div>
                    <div class="card-value">${product.length} cm</div>
                  </div>
                ` : ''}
                ${product.width ? `
                  <div class="card">
                    <div class="card-label">Larghezza</div>
                    <div class="card-value">${product.width} cm</div>
                  </div>
                ` : ''}
                ${product.weight ? `
                  <div class="card">
                    <div class="card-label">Peso</div>
                    <div class="card-value">${product.weight} kg</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Technical Notes -->
          ${product.technicalNotes ? `
            <div class="section">
              <div class="section-title">Note Tecniche</div>
              <div class="notes-box">${product.technicalNotes}</div>
            </div>
          ` : ''}

          <!-- Photo Gallery -->
          ${galleryHTML}

          <!-- Timeline -->
          ${timeline.length > 0 ? `
            <div class="section">
              <div class="section-title">Cronologia Dettagliata</div>
              ${timelineHTML}
            </div>
          ` : ''}

          <!-- QR Code + Barcode -->
          <div class="codes-section">
            <div class="section-title" style="text-align: center; margin-bottom: 20px;">Codici Identificativi</div>
            <div class="codes-container">
              <div class="code-block">
                <div class="code-label">QR Code</div>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(product.sku)}" alt="QR Code" style="width: 150px; height: 150px;" />
                <div class="code-value">${product.sku}</div>
              </div>
              <div class="code-block">
                <div class="code-label">Barcode</div>
                <img src="https://barcodeapi.org/api/code128/${encodeURIComponent(product.sku)}" alt="Barcode" style="height: 80px;" />
                <div class="code-value">${product.sku}</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            Documento generato: ${new Date().toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        dialogTitle: `Scheda Prodotto - ${product.sku}`,
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Errore', 'Impossibile generare il PDF. Riprova.');
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
              const index = Math.round(event.nativeEvent.contentOffset.x / heroWidth);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {product.images.map((uri, index) => (
              <Pressable key={index} onPress={() => setModalVisible(true)}>
                <Image
                  source={{ uri }}
                  style={[styles.heroImage, { width: heroWidth }]}
                  contentFit="contain"
                />
              </Pressable>
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

          {/* Custom Fields Display Redesign */}
          {product.customData && product.customData.length > 0 && (
            <View style={styles.customFieldsSection}>
              <Text style={styles.sectionTitle}>CAMPI STRUTTURATI</Text>

              <View style={styles.customCardsContainer}>
                {product.customData.map((dataItem, index) => {
                  const value = dataItem.value;
                  const field = dataItem.fieldSnapshot;
                  if (value === undefined || value === null || value === '') return null;

                  // Text Long -> Spanning full width like a Note
                  if (field.type === 'text_long') {
                    return (
                      <View key={field.id || index} style={styles.customNotesCard}>
                        <View style={styles.customNotesHeader}>
                          <MaterialIcons name={field.icon as any || 'notes'} size={18} color={theme.textSecondary} />
                          <Text style={styles.customFieldLabel}>{field.name}</Text>
                        </View>
                        <Text style={styles.customNotesText}>{String(value)}</Text>
                      </View>
                    );
                  }

                  // Array / Multi Choice -> Chips
                  if (Array.isArray(value) || field.type === 'multi_choice') {
                    const displayArray = Array.isArray(value) ? value : [value];
                    return (
                      <View key={field.id || index} style={styles.customTagsCard}>
                        <View style={styles.customNotesHeader}>
                          <MaterialIcons name={field.icon as any || 'label'} size={18} color={theme.textSecondary} />
                          <Text style={styles.customFieldLabel}>{field.name}</Text>
                        </View>
                        <View style={styles.customTagsRow}>
                          {displayArray.map(val => {
                            // Find label if dataset has options
                            let label = val;
                            if (field.options) {
                              const opt = field.options.find((o: any) => o.id === val);
                              if (opt) label = opt.label;
                            }
                            return (
                              <View key={val} style={styles.customTag}>
                                <Text style={styles.customTagText}>{label}</Text>
                              </View>
                            )
                          })}
                        </View>
                      </View>
                    );
                  }

                  // Date
                  if (field.type === 'date') {
                    const rawDate = new Date(value);
                    const displayDate = isNaN(rawDate.getTime()) ? value : rawDate.toLocaleDateString('it-IT');
                    return (
                      <View key={field.id || index} style={styles.customMiniCard}>
                        <View style={[styles.customIconWrap, { backgroundColor: `${theme.info}20` }]}>
                          <MaterialIcons name={field.icon as any || 'event'} size={20} color={theme.info} />
                        </View>
                        <View style={styles.customCardContent}>
                          <Text style={styles.customFieldLabel}>{field.name}</Text>
                          <Text style={styles.customFieldValue}>{displayDate}</Text>
                        </View>
                      </View>
                    );
                  }

                  // Currency
                  if (field.type === 'currency') {
                    return (
                      <View key={field.id || index} style={styles.customMiniCard}>
                        <View style={[styles.customIconWrap, { backgroundColor: `${theme.primary}20` }]}>
                          <MaterialIcons name={field.icon as any || 'attach-money'} size={20} color={theme.primary} />
                        </View>
                        <View style={styles.customCardContent}>
                          <Text style={styles.customFieldLabel}>{field.name}</Text>
                          <Text style={[styles.customFieldValue, { color: theme.primary, fontWeight: '700' }]}>
                            €{Number(value).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  // Default / Single Choice / Number / Text Short
                  let displayValue = String(value) + (field.unit ? ` ${field.unit}` : '');
                  if (typeof value === 'boolean') {
                    displayValue = value ? 'Sì' : 'No';
                  } else if (field.options && field.type === 'single_choice') {
                    const opt = field.options.find((o: any) => o.id === value);
                    if (opt) displayValue = opt.label;
                  }

                  return (
                    <View key={field.id || index} style={styles.customMiniCard}>
                      <View style={styles.customIconWrap}>
                        <MaterialIcons name={field.icon as any || 'info'} size={20} color={theme.textSecondary} />
                      </View>
                      <View style={styles.customCardContent}>
                        <Text style={styles.customFieldLabel}>{field.name}</Text>
                        <Text style={styles.customFieldValue}>{displayValue}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <View style={styles.timelineSection}>
              <Text style={styles.sectionTitle}>CRONOLOGIA DETTAGLIATA</Text>
              {(showAllHistory ? timeline : timeline.slice(0, 4)).map((event, index) => {
                let eventText = '';
                if (event.type === 'created') eventText = 'Creato';
                else if (event.type === 'moved') eventText = `Spostato: ${event.details.from} → ${event.details.to}`;
                else if (event.type === 'sold') eventText = 'Venduto';
                else if (event.type === 'modified') eventText = event.details.changes?.[0] || 'Modificato';
                else if (event.type === 'scanned') eventText = 'Scansionato';
                else if (event.type === 'photo_added') eventText = `${event.details.photoCount} foto aggiunte`;
                else if (event.type === 'deleted') eventText = 'Spostato nel Cestino';
                else if (event.type === 'restored') eventText = 'Ripristinato dal Cestino';

                return (
                  <View key={`${event.id || 'evt'}-${index}`} style={styles.timelineItem}>
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

              {timeline.length > 4 && (
                <Pressable
                  onPress={() => setShowAllHistory(!showAllHistory)}
                  style={styles.showMoreButton}
                >
                  <Text style={styles.showMoreText}>{showAllHistory ? 'Nascondi' : 'Altro'}</Text>
                  <MaterialIcons name={showAllHistory ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color={theme.primary} />
                </Pressable>
              )}
            </View>
          )}

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>AZIONI RAPIDE</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable style={styles.qrButton} onPress={() => setShowQRModal(true)}>
                <MaterialIcons name="qr-code-2" size={24} color={theme.textPrimary} />
                <Text style={styles.qrButtonText}>Mostra QR</Text>
              </Pressable>

              <Pressable style={styles.qrButton} onPress={handlePrintPDF}>
                <MaterialIcons name="picture-as-pdf" size={24} color={theme.primary} />
                <Text style={[styles.qrButtonText, { color: theme.primary }]}>Stampa PDF</Text>
              </Pressable>
            </View>
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
      {/* QR Code Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showQRModal}
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.qrHeader}>
              <Text style={styles.qrTitle}>Codice Prodotto</Text>
              <Pressable onPress={() => setShowQRModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.toggleContainer}>
              <Pressable
                style={[styles.toggleButton, codeType === 'qr' && styles.toggleButtonActive]}
                onPress={() => setCodeType('qr')}
              >
                <Text style={[styles.toggleText, codeType === 'qr' && styles.toggleTextActive]}>QR Code</Text>
              </Pressable>
              <Pressable
                style={[styles.toggleButton, codeType === 'barcode' && styles.toggleButtonActive]}
                onPress={() => setCodeType('barcode')}
              >
                <Text style={[styles.toggleText, codeType === 'barcode' && styles.toggleTextActive]}>Barcode</Text>
              </Pressable>
            </View>

            <View style={styles.qrContainer}>
              {codeType === 'qr' ? (
                <QRCode
                  value={product.sku}
                  size={200}
                  color="black"
                  backgroundColor="white"
                />
              ) : (
                <View style={{ padding: 10, alignItems: 'center' }}>
                  <Barcode
                    value={product.sku}
                    width={260}
                    height={100}
                  />
                </View>
              )}
            </View>

            <Text style={styles.qrSkuText}>{product.sku}</Text>
            <Text style={styles.qrInfoText}>{furType?.label || product.furType}</Text>

            <Pressable style={styles.printLabelButton} onPress={handlePrintLabel}>
              <MaterialIcons name="print" size={20} color="#FFF" />
              <Text style={styles.printLabelText}>Stampa Etichetta</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar hidden={true} />

          {/* Close Button */}
          <Pressable
            style={[styles.closeButton, { top: insets.top + 10 }]}
            onPress={() => setModalVisible(false)}
          >
            <MaterialIcons name="close" size={30} color="#FFF" />
          </Pressable>

          {/* Image Counter */}
          <View style={[styles.modalCounter, { top: insets.top + 20 }]}>
            <Text style={styles.modalCounterText}>
              {currentImageIndex + 1} / {product.images.length}
            </Text>
          </View>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            onScroll={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
            contentOffset={{ x: currentImageIndex * screenWidth, y: 0 }}
          >
            {product.images.map((uri, index) => (
              <View key={index} style={{ width: screenWidth, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Image
                  source={{ uri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    marginTop: 4,
  },
  showMoreText: {
    ...typography.buttonSecondary,
    fontSize: 14,
    color: theme.primary,
  },
  qrSection: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.border,
    ...shadows.small,
  },
  qrButtonText: {
    ...typography.buttonSecondary,
    fontSize: 14,
    color: theme.textPrimary,
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
    color: theme.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalContent: {
    backgroundColor: theme.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadows.card,
  },
  qrHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  qrTitle: {
    ...typography.cardTitle,
    fontSize: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 20,
    ...shadows.small,
  },
  qrSkuText: {
    ...typography.cardTitle,
    fontSize: 24,
    color: theme.primary,
    marginBottom: 4,
  },
  qrInfoText: {
    ...typography.caption,
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    padding: 4,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
    width: '100%',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.small,
  },
  toggleButtonActive: {
    backgroundColor: theme.primary,
  },
  toggleText: {
    ...typography.caption,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  toggleTextActive: {
    color: '#FFF',
  },
  printLabelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: borderRadius.medium,
  },
  printLabelText: {
    ...typography.buttonPrimary,
    fontSize: 16,
  },
  modalContainer: { // For the Image Viewer Modal
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  modalCounter: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalCounterText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  customFieldsSection: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: 24,
  },
  customCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customMiniCard: {
    width: '48%',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customCardContent: {
    flex: 1,
  },
  customFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  customFieldLabel: {
    ...typography.caption,
    fontSize: 12,
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  customFieldValue: {
    ...typography.body,
    fontSize: 14,
    color: theme.textPrimary,
    marginTop: 2,
  },
  customNotesCard: {
    width: '100%',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 14,
    marginBottom: 8,
  },
  customNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customNotesText: {
    ...typography.body,
    fontSize: 14,
    color: theme.textPrimary,
    lineHeight: 20,
  },
  customTagsCard: {
    width: '100%',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.medium,
    padding: 14,
    marginBottom: 8,
  },
  customTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customTag: {
    backgroundColor: theme.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  customTagText: {
    ...typography.caption,
    color: theme.textPrimary,
  }
});
