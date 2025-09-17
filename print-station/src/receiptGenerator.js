/**
 * Receipt Generator per App Sagra
 * Genera comandi ESC/POS per ricevute della sagra
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

// Import dei comandi ESC/POS locali
import { 
  CONTROL, 
  CUT, 
  ALIGN, 
  TEXT_STYLE, 
  FONT, 
  FEED, 
  CHARS, 
  HELPERS 
} from './escposCommands.js';

class ReceiptGenerator {
  constructor(config = {}) {
    this.config = {
      title: config.title || 'FESTA DELLA PARROCCHIA',
      footer: config.footer || 'Ritira alle cucine indicate',
      width: config.width || 48,  // 80mm = ~48 caratteri
      currency: config.currency || 'EUR',
      separator: config.separator || '=',
      itemSeparator: config.itemSeparator || '-',
      ...config
    };
  }

  /**
   * METODO DI TEST - Genera ricevuta completa con cut per linee di preparazione
   * @param {Object} orderData - Oggetto ordine completo con linee di preparazione
   * @returns {Array} Array di comandi ESC/POS
   */
  generateReceiptCommands(orderData, useLineCuts = true) {
    const commands = [];
    
    // Inizializza
    commands.push(...CONTROL.INIT);
    
    // Header
    commands.push(...this.createHeader());
    
    // Informazioni ordine
    commands.push(...this.createOrderInfo(orderData));
    
    // Sezione RIEPILOGO ORDINE
    commands.push(...this.createOrderSummaryHeader());
    
    // Lista items completa
    commands.push(...this.createItemsList(orderData.items));
    
    // Totale
    commands.push(...this.createTotal(orderData.total));
    
    // Footer generale
    commands.push(...this.createFooter());
    
    if(useLineCuts) {
      // Genera cut per ogni linea di preparazione
      if (orderData.items && orderData.items.length > 0) {
        const lineItems = this.groupItemsByPreparationLine(orderData.items);
        
        Object.entries(lineItems).forEach(([lineName, items]) => {
          commands.push(...this.createLineCut(lineName, items));
        });
      }
    }
    
    return commands;
  }

  /**
   * Raggruppa items per linea di preparazione
   */
  groupItemsByPreparationLine(items) {
    const grouped = {};
    
    items.forEach(item => {
      const lineName = item.preparationLine || 'GENERALE';
      if (!grouped[lineName]) {
        grouped[lineName] = [];
      }
      grouped[lineName].push(item);
    });
    
    return grouped;
  }

  /**
   * Converte array di comandi in buffer per stampa
   */
  commandsToBuffer(commands) {
    return Buffer.from(commands);
  }

  /**
   * Salva comandi di stampa in un file temporaneo
   */
  saveCommandsToFile(commands, fileName = null) {
    const buffer = this.commandsToBuffer(commands);
    const tempDir = path.join(os.tmpdir(), 'print-station-receipts');
    
    // Crea directory se non esiste
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filename = fileName || `receipt_${Date.now()}.bin`;
    const filePath = path.join(tempDir, filename);
    
    fs.writeFileSync(filePath, buffer);
    
    return filePath;
  }

  /**
   * Crea sezione header per riepilogo ordine
   */
  createOrderSummaryHeader() {
    const commands = [];
    
    commands.push(...ALIGN.CENTER);
    commands.push(...TEXT_STYLE.BOLD_ON);
    commands.push(...this.textToBytes('RIEPILOGO ORDINE'));
    commands.push(...TEXT_STYLE.BOLD_OFF);
    commands.push(...ALIGN.LEFT);
    commands.push(...FEED.ONE_LINE);
    commands.push(...FEED.ONE_LINE);
    //commands.push(...this.createSeparator(this.config.itemSeparator));
    
    return commands;
  }

  /**
   * Crea un cut per una linea di preparazione specifica
   */
  createLineCut(lineName, items) {
    const commands = [];
    
    // Titolo linea centrato e grassetto
    commands.push(...ALIGN.CENTER);
    commands.push(...TEXT_STYLE.BOLD_ON);
    commands.push(...TEXT_STYLE.DOUBLE_SIZE);
    commands.push(...this.textToBytes(lineName.toUpperCase()));
    commands.push(...TEXT_STYLE.NORMAL);
    commands.push(...TEXT_STYLE.BOLD_OFF);
    commands.push(...ALIGN.LEFT);
    commands.push(...FEED.ONE_LINE);
    commands.push(...FEED.ONE_LINE);
    
    // Lista items della linea
    items.forEach(item => {
      const line = `${item.quantity}x ${item.name}`;
      commands.push(...this.textToBytes(line));
      commands.push(...FEED.ONE_LINE);
    });
    
    commands.push(...FEED.ONE_LINE);
    commands.push(...FEED.ONE_LINE);
    commands.push(...FEED.ONE_LINE);
    commands.push(...FEED.ONE_LINE);
    commands.push(...FEED.ONE_LINE);
    commands.push(...CUT.FULL);
    
    return commands;
  }

  /**
   * METODO DI TEST - Crea un ordine di esempio per testare la funzionalità
   */
  static createTestOrder() {
    return {
      customerNumber: 42,
      station: 'CASSA-01',
      total: 23.50,
      timestamp: new Date(),
      items: [
        {
          id: 'pizza-margherita',
          name: 'Pizza Margherita',
          quantity: 2,
          price: 6.00,
          preparationLine: 'SALATO'
        },
        {
          id: 'coca-cola',
          name: 'Coca Cola',
          quantity: 2,
          price: 2.50,
          preparationLine: 'BAR'
        },
        {
          id: 'tiramisu',
          name: 'Tiramisù',
          quantity: 1,
          price: 4.50,
          preparationLine: 'DOLCE'
        },
        {
          id: 'panino-porchetta',
          name: 'Panino Porchetta',
          quantity: 1,
          price: 7.00,
          preparationLine: 'SALATO'
        }
      ]
    };
  }

  /**
   * Crea header della ricevuta
   */
  createHeader() {
    const commands = [];
    
    // Titolo centrato in grassetto
    commands.push(...ALIGN.CENTER);
    commands.push(...TEXT_STYLE.BOLD_ON);
    commands.push(...TEXT_STYLE.DOUBLE_SIZE);
    commands.push(...this.textToBytes(this.config.title));
    commands.push(...FEED.ONE_LINE);
    commands.push(...TEXT_STYLE.NORMAL);
    commands.push(...TEXT_STYLE.BOLD_OFF);
    commands.push(...ALIGN.LEFT);
    
    // Linea separatrice
    commands.push(...this.createSeparator());
    
    return commands;
  }

  /**
   * Crea informazioni ordine
   */
  createOrderInfo(orderData) {
    const commands = [];
    const now = new Date();
    
    const info = [
      `Data: ${now.toLocaleDateString('it-IT')} ${now.toLocaleTimeString('it-IT')}`,
      `Ordine: ${orderData.customerNumber}`,
      `Stazione: ${orderData.station || 'N/A'}`
    ];
    
    info.forEach(line => {
      commands.push(...this.textToBytes(line));
      commands.push(...FEED.ONE_LINE);
    });
    
    // Separatore items
    commands.push(...FEED.ONE_LINE);
    //commands.push(...this.createSeparator(this.config.itemSeparator));
    
    return commands;
  }

  /**
   * Crea lista items
   */
  createItemsList(items) {
    const commands = [];
    
    items.forEach(item => {
      // Riga item con quantità e nome
      const itemLine = `${item.quantity || item.qty}x ${item.name}`;
      commands.push(...this.textToBytes(itemLine));
      commands.push(...FEED.ONE_LINE);
      
      // Riga prezzo allineata a destra
      const price = this.formatPrice(item.price * (item.quantity || item.qty));
      const priceLine = this.createPriceLine('', price);
      commands.push(...this.textToBytes(priceLine));
      commands.push(...FEED.ONE_LINE);
    });
    
    return commands;
  }

  /**
   * Crea totale
   */
  createTotal(total) {
    const commands = [];
    
    // Separatore
    commands.push(...this.createSeparator(this.config.itemSeparator));
    
    // Totale in grassetto
    commands.push(...TEXT_STYLE.BOLD_ON);
    const totalLine = this.createPriceLine('TOTALE:', this.formatPrice(total));
    commands.push(...this.textToBytes(totalLine));
    commands.push(...FEED.ONE_LINE);
    commands.push(...TEXT_STYLE.BOLD_OFF);
    
    // Separatore finale
    commands.push(...this.createSeparator());
    
    return commands;
  }

  /**
   * Crea footer
   */
  createFooter() {
    const commands = [];
    
    if (this.config.footer) {
      commands.push(...ALIGN.CENTER);
      commands.push(...this.textToBytes(this.config.footer));
      commands.push(...FEED.ONE_LINE);
      commands.push(...ALIGN.LEFT);
    }
    
    // Avanzamento carta e taglio
    commands.push(...FEED.ONE_LINE);
    commands.push(...FEED.ONE_LINE);
    commands.push(...FEED.ONE_LINE);
    commands.push(...FEED.ONE_LINE);
    commands.push(...FEED.ONE_LINE);
    commands.push(...CUT.FULL);
    
    return commands;
  }

  /**
   * Crea separatore
   */
  createSeparator(char = null) {
    const separatorChar = char || this.config.separator;
    const line = separatorChar.repeat(this.config.width);
    return [
      ...this.textToBytes(line),
      ...FEED.ONE_LINE
    ];
  }

  /**
   * Crea linea con prezzo allineato
   */
  createPriceLine(description, price) {
    const priceStr = price.toString();
    const availableSpace = this.config.width - priceStr.length;
    const padding = Math.max(0, availableSpace - description.length);
    
    if (padding > 0) {
      return description + ' '.repeat(padding) + priceStr;
    } else {
      // Tronca descrizione se troppo lunga
      const maxDesc = availableSpace - 1;
      return description.substring(0, maxDesc) + ' ' + priceStr;
    }
  }

  /**
   * Formatta prezzo
   */
  formatPrice(amount) {
    // Se amount è in centesimi, converte in euro
    const euros = typeof amount === 'number' && amount > 99 ? 
                  (amount / 100).toFixed(2) : 
                  parseFloat(amount).toFixed(2);
    
    return `${this.config.currency} ${euros}`;
  }

  /**
   * Converte testo in array di byte (compatibile browser)
   */
  textToBytes(text) {
    // Verifica se siamo in ambiente Node.js o browser
    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      return Array.from(Buffer.from(text, 'utf8'));
    } else {
      // Browser environment - usa TextEncoder
      const encoder = new TextEncoder();
      return Array.from(encoder.encode(text));
    }
  }

  /**
   * Utility per verificare l'ambiente di esecuzione
   */
  isNodeEnvironment() {
    return typeof Buffer !== 'undefined' && typeof process !== 'undefined';
  }

  /**
   * Converte array di byte in stringa (per debug)
   */
  bytesToString(bytes) {
    if (this.isNodeEnvironment()) {
      return Buffer.from(bytes).toString('utf8');
    } else {
      const decoder = new TextDecoder();
      return decoder.decode(new Uint8Array(bytes));
    }
  }
}

export default ReceiptGenerator;