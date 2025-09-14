/**
 * Receipt Generator per App Sagra
 * Genera comandi ESC/POS per ricevute della sagra
 */

// Import dei comandi ESC/POS dal print-server (fonte unica)
import { 
  CONTROL, 
  CUT, 
  ALIGN, 
  TEXT_STYLE, 
  FONT, 
  FEED, 
  CHARS, 
  HELPERS 
} from '../../print-server/src/escpos-commands.js';

class ReceiptGenerator {
  constructor(config = {}) {
    this.config = {
      title: config.title || 'SAGRA PARROCCHIA',
      footer: config.footer || 'Ritira alle cucine indicate',
      width: config.width || 48,  // 80mm = ~48 caratteri
      currency: config.currency || 'EUR',
      separator: config.separator || '=',
      itemSeparator: config.itemSeparator || '-',
      ...config
    };
  }

  /**
   * Genera ricevuta completa per ordine
   */
  generateOrderReceipt(orderData) {
    const commands = [];
    
    // Inizializza
    commands.push(...CONTROL.INIT);
    
    // Header
    commands.push(...this.createHeader());
    
    // Informazioni ordine
    commands.push(...this.createOrderInfo(orderData));
    
    // Lista items
    commands.push(...this.createItemsList(orderData.items));
    
    // Totale
    commands.push(...this.createTotal(orderData.total));
    
    // Footer
    commands.push(...this.createFooter());
    
    return commands;
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
    commands.push(...this.createSeparator(this.config.itemSeparator));
    
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
    commands.push(...FEED.THREE_LINES);
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

  /**
   * Genera ricevuta di test
   */
  generateTestReceipt() {
    const testOrder = {
      customerNumber: 'TEST-001',
      station: 'Test Station',
      items: [
        { name: 'Pizza Margherita', quantity: 2, price: 8.00 },
        { name: 'Coca Cola', quantity: 1, price: 2.50 }
      ],
      total: 18.50
    };
    
    return this.generateOrderReceipt(testOrder);
  }

  /**
   * Genera solo testo semplice
   */
  generateSimpleText(text, options = {}) {
    const commands = [];
    
    commands.push(...CONTROL.INIT);
    
    if (options.center) {
      commands.push(...ALIGN.CENTER);
    }
    
    if (options.bold) {
      commands.push(...TEXT_STYLE.BOLD_ON);
    }
    
    if (options.large) {
      commands.push(...TEXT_STYLE.DOUBLE_SIZE);
    }
    
    commands.push(...this.textToBytes(text));
    
    if (!text.endsWith('\n')) {
      commands.push(...FEED.ONE_LINE);
    }
    
    // Reset
    commands.push(...TEXT_STYLE.NORMAL);
    commands.push(...TEXT_STYLE.BOLD_OFF);
    commands.push(...ALIGN.LEFT);
    
    if (options.cut !== false) {
      commands.push(...FEED.TWO_LINES);
      commands.push(...CUT.FULL);
    }
    
    return commands;
  }
}

export default ReceiptGenerator;