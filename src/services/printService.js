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
     * Stampa comandi ESC/POS (metodo principale)
     */
    async print(commands, jobId = null) {
        return await this.handleRequest('/print', 'POST', commands, 'stampa');
    }

    /**
     * Test di stampa
     */
    async test() {
        return await this.handleRequest('/test', 'POST', null, 'test stampa');
    }

    /**
     * Verifica stato stampante
     */
    async health() {
        return await this.handleRequest('/health', 'GET', null, 'controllo stato');
    }

    /**
     * Gestisce una richiesta generica al server di stampa
     */
    async handleRequest(endpoint, method = 'GET', commands = null, errorContext = 'operazione') {
        const url = `${this.baseUrl}${endpoint}`;

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(this.timeout)
        };

        if (commands) {
            options.body = JSON.stringify(commands);
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Per l'endpoint /health, non controlliamo result.success perché restituisce direttamente lo stato
            if (endpoint !== '/health' && !result.success) {
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

            console.error(`Errore ${errorContext}:`, error);
            throw new Error(`Errore ${errorContext}: ${error.message}`);
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