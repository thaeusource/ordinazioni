/**
 * Servizio di stampa per comunicare con il server di stampa
 */

import ReceiptGenerator from './receiptGenerator.js';

class PrintService {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3001';
    this.receiptGenerator = new ReceiptGenerator(config.receiptConfig);
    this.timeout = config.timeout || 10000;
  }

  /**
   * Stampa ricevuta ordine usando il nuovo endpoint generico
   */
  async printOrderReceipt(orderData) {
    try {
      // Genera comandi ESC/POS per la ricevuta
      const commands = this.receiptGenerator.generateOrderReceipt(orderData);
      
      // Invia al server di stampa generico
      const response = await this.sendPrintRequest('/print-raw', {
        data: commands
      });
      
      return response;
    } catch (error) {
      console.error('Errore stampa ricevuta:', error);
      throw new Error(`Errore stampa ricevuta: ${error.message}`);
    }
  }

  /**
   * Stampa testo semplice
   */
  async printText(text, options = {}) {
    try {
      const response = await this.sendPrintRequest('/print-text', {
        text,
        options
      });
      
      return response;
    } catch (error) {
      console.error('Errore stampa testo:', error);
      throw new Error(`Errore stampa testo: ${error.message}`);
    }
  }

  /**
   * Stampa comandi ESC/POS grezzi
   */
  async printRawCommands(commands) {
    try {
      const response = await this.sendPrintRequest('/print-raw', {
        data: commands
      });
      
      return response;
    } catch (error) {
      console.error('Errore stampa raw:', error);
      throw new Error(`Errore stampa raw: ${error.message}`);
    }
  }

  /**
   * Compatibilità con l'endpoint vecchio (da rimuovere gradualmente)
   */
  async printReceiptOld(customerNumber, items, total, station) {
    try {
      console.warn('printReceiptOld è deprecato, usa printOrderReceipt');
      
      const orderData = {
        customerNumber,
        station,
        items,
        total
      };
      
      return await this.printOrderReceipt(orderData);
    } catch (error) {
      console.error('Errore stampa ricevuta (vecchio):', error);
      throw error;
    }
  }

  /**
   * Test di stampa
   */
  async testPrint() {
    try {
      const testCommands = this.receiptGenerator.generateTestReceipt();
      const response = await this.printRawCommands(testCommands);
      
      return response;
    } catch (error) {
      console.error('Errore test stampa:', error);
      throw new Error(`Errore test stampa: ${error.message}`);
    }
  }

  /**
   * Verifica stato stampante
   */
  async checkPrinterStatus() {
    try {
      const response = await this.sendPrintRequest('/status');
      return response;
    } catch (error) {
      console.error('Errore controllo stato:', error);
      throw new Error(`Errore controllo stato: ${error.message}`);
    }
  }

  /**
   * Ottieni configurazione server
   */
  async getServerConfig() {
    try {
      const response = await this.sendPrintRequest('/config');
      return response;
    } catch (error) {
      console.error('Errore lettura config:', error);
      throw new Error(`Errore lettura config: ${error.message}`);
    }
  }

  /**
   * Invia richiesta al server di stampa
   */
  async sendPrintRequest(endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(this.timeout)
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Errore dal server di stampa');
      }
      
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout comunicazione con server di stampa');
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Server di stampa non raggiungibile');
      }
      
      throw error;
    }
  }

  /**
   * Ping server per verificare connessione
   */
  async ping() {
    try {
      const response = await this.sendPrintRequest('/ping');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Stampa ricevuta formattata personalizzata
   */
  async printCustomReceipt(config) {
    try {
      const generator = new ReceiptGenerator(config.receiptConfig || {});
      const commands = generator.generateOrderReceipt(config.orderData);
      
      return await this.printRawCommands(commands);
    } catch (error) {
      console.error('Errore stampa personalizzata:', error);
      throw new Error(`Errore stampa personalizzata: ${error.message}`);
    }
  }
}

// Istanza singleton per l'app
let printServiceInstance = null;

export const createPrintService = (config = {}) => {
  if (!printServiceInstance) {
    printServiceInstance = new PrintService(config);
  }
  return printServiceInstance;
};

export const getPrintService = () => {
  if (!printServiceInstance) {
    console.warn('PrintService non inizializzato, creo istanza con config default');
    printServiceInstance = new PrintService();
  }
  return printServiceInstance;
};

export default PrintService;