/**
 * Receipt Generator per App Sagra
 * Genera comandi ESC/POS per ricevute della sagra
 */

// Comandi ESC/POS base
const ESC_POS = {
  INIT: [0x1B, 0x40],
  ALIGN_CENTER: [0x1B, 0x61, 0x01],
  ALIGN_LEFT: [0x1B, 0x61, 0x00],
  ALIGN_RIGHT: [0x1B, 0x61, 0x02],
  BOLD_ON: [0x1B, 0x45, 0x01],
  BOLD_OFF: [0x1B, 0x45, 0x00],
  DOUBLE_SIZE: [0x1B, 0x21, 0x30],
  NORMAL_SIZE: [0x1B, 0x21, 0x00],
  LINE_FEED: [0x0A],
  CUT_PAPER: [0x1D, 0x56, 0x00]
};

class ReceiptGenerator {
  constructor(config = {}) {
    this.config = {
      title: config.title || 'SAGRA PARROCCHIA',
      footer: config.footer || 'Ritira alle cucine indicate',
      width: config.width || 32,
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
    commands.push(...ESC_POS.INIT);
    
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
    commands.push(...ESC_POS.ALIGN_CENTER);
    commands.push(...ESC_POS.BOLD_ON);
    commands.push(...ESC_POS.DOUBLE_SIZE);
    commands.push(...this.textToBytes(this.config.title));
    commands.push(...ESC_POS.LINE_FEED);
    commands.push(...ESC_POS.NORMAL_SIZE);
    commands.push(...ESC_POS.BOLD_OFF);
    commands.push(...ESC_POS.ALIGN_LEFT);
    
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
      commands.push(...ESC_POS.LINE_FEED);
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
      commands.push(...ESC_POS.LINE_FEED);
      
      // Riga prezzo allineata a destra
      const price = this.formatPrice(item.price * (item.quantity || item.qty));
      const priceLine = this.createPriceLine('', price);
      commands.push(...this.textToBytes(priceLine));
      commands.push(...ESC_POS.LINE_FEED);
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
    commands.push(...ESC_POS.BOLD_ON);
    const totalLine = this.createPriceLine('TOTALE:', this.formatPrice(total));
    commands.push(...this.textToBytes(totalLine));
    commands.push(...ESC_POS.LINE_FEED);
    commands.push(...ESC_POS.BOLD_OFF);
    
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
      commands.push(...ESC_POS.ALIGN_CENTER);
      commands.push(...this.textToBytes(this.config.footer));
      commands.push(...ESC_POS.LINE_FEED);
      commands.push(...ESC_POS.ALIGN_LEFT);
    }
    
    // Avanzamento carta e taglio
    commands.push(...ESC_POS.LINE_FEED);
    commands.push(...ESC_POS.LINE_FEED);
    commands.push(...ESC_POS.LINE_FEED);
    commands.push(...ESC_POS.CUT_PAPER);
    
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
      ...ESC_POS.LINE_FEED
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
   * Converte testo in array di byte
   */
  textToBytes(text) {
    return Array.from(Buffer.from(text, 'utf8'));
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
    
    commands.push(...ESC_POS.INIT);
    
    if (options.center) {
      commands.push(...ESC_POS.ALIGN_CENTER);
    }
    
    if (options.bold) {
      commands.push(...ESC_POS.BOLD_ON);
    }
    
    if (options.large) {
      commands.push(...ESC_POS.DOUBLE_SIZE);
    }
    
    commands.push(...this.textToBytes(text));
    
    if (!text.endsWith('\n')) {
      commands.push(...ESC_POS.LINE_FEED);
    }
    
    // Reset
    commands.push(...ESC_POS.NORMAL_SIZE);
    commands.push(...ESC_POS.BOLD_OFF);
    commands.push(...ESC_POS.ALIGN_LEFT);
    
    if (options.cut !== false) {
      commands.push(...ESC_POS.LINE_FEED);
      commands.push(...ESC_POS.LINE_FEED);
      commands.push(...ESC_POS.CUT_PAPER);
    }
    
    return commands;
  }
}

export default ReceiptGenerator;