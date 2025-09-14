/**
 * Print Manager Cross-Platform
 * Gestisce i comandi di stampa su Windows, macOS e Linux
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PrintManager {
    constructor(config) {
        this.config = config;
        this.platform = os.platform();
        this.isWindows = this.platform === 'win32';
        this.isMac = this.platform === 'darwin';
        this.isLinux = this.platform === 'linux';
    }

    /**
     * Stampa un file sulla stampante configurata
     */
    async printFile(filePath, options = {}) {
        return new Promise((resolve, reject) => {
            const printerName = this.config.get('printer.name');
            
            if (!printerName || printerName === 'YOUR_PRINTER_NAME_HERE') {
                reject(new Error('Nome stampante non configurato'));
                return;
            }

            const printCommand = this.buildPrintCommand(filePath, printerName, options);
            
            console.log(`🖨️  Comando stampa: ${printCommand}`);

            exec(printCommand, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Stampa fallita: ${error.message}`));
                } else {
                    resolve({
                        success: true,
                        command: printCommand,
                        output: stdout.trim(),
                        platform: this.platform
                    });
                }
            });
        });
    }

    /**
     * Costruisce il comando di stampa basato sulla piattaforma
     */
    buildPrintCommand(filePath, printerName, options = {}) {
        const rawMode = options.raw !== false; // Default true per stampe ESC/POS

        if (this.isWindows) {
            return this.buildWindowsPrintCommand(filePath, printerName, rawMode);
        } else if (this.isMac || this.isLinux) {
            return this.buildUnixPrintCommand(filePath, printerName, rawMode);
        } else {
            throw new Error(`Piattaforma non supportata: ${this.platform}`);
        }
    }

    /**
     * Comando di stampa per Windows
     */
    buildWindowsPrintCommand(filePath, printerName, rawMode) {
        if (rawMode) {
            // Per stampa raw su Windows usando copy command
            return `copy /b "${filePath}" "\\\\localhost\\${printerName}"`;
        } else {
            // Per stampa normale su Windows
            return `notepad /p "${filePath}"`;
        }
    }

    /**
     * Comando di stampa per Unix (macOS/Linux)
     */
    buildUnixPrintCommand(filePath, printerName, rawMode) {
        let command = `lp -d "${printerName}"`;
        
        if (rawMode) {
            command += ' -o raw';
        }
        
        command += ` "${filePath}"`;
        return command;
    }

    /**
     * Verifica lo stato della stampante
     */
    async checkPrinterStatus() {
        return new Promise((resolve, reject) => {
            const printerName = this.config.get('printer.name');
            
            if (!printerName || printerName === 'YOUR_PRINTER_NAME_HERE') {
                reject(new Error('Nome stampante non configurato'));
                return;
            }

            const statusCommand = this.buildStatusCommand(printerName);

            exec(statusCommand, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Stampante non trovata: ${error.message}`));
                } else {
                    resolve({
                        printer: printerName,
                        platform: this.platform,
                        status: stdout.trim(),
                        available: true
                    });
                }
            });
        });
    }

    /**
     * Costruisce il comando per verificare lo stato della stampante
     */
    buildStatusCommand(printerName) {
        if (this.isWindows) {
            return `wmic printer where name="${printerName}" get status`;
        } else {
            return `lpstat -p "${printerName}"`;
        }
    }

    /**
     * Lista tutte le stampanti disponibili
     */
    async listPrinters() {
        return new Promise((resolve, reject) => {
            const listCommand = this.buildListCommand();

            exec(listCommand, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Errore nel listare stampanti: ${error.message}`));
                } else {
                    const printers = this.parsePrinterList(stdout);
                    resolve({
                        platform: this.platform,
                        printers: printers,
                        count: printers.length
                    });
                }
            });
        });
    }

    /**
     * Comando per listare stampanti
     */
    buildListCommand() {
        if (this.isWindows) {
            return 'wmic printer list brief';
        } else {
            return 'lpstat -p';
        }
    }

    /**
     * Analizza l'output della lista stampanti
     */
    parsePrinterList(output) {
        const printers = [];

        if (this.isWindows) {
            // Parsing per Windows
            const lines = output.split('\n').slice(1); // Salta header
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('Name')) {
                    const parts = trimmed.split(/\s+/);
                    if (parts.length > 0) {
                        printers.push({
                            name: parts[0],
                            platform: 'windows'
                        });
                    }
                }
            });
        } else {
            // Parsing per Unix
            const lines = output.split('\n');
            lines.forEach(line => {
                const match = line.match(/printer (\S+)/);
                if (match) {
                    printers.push({
                        name: match[1],
                        platform: this.platform,
                        status: line.includes('idle') ? 'idle' : 'unknown'
                    });
                }
            });
        }

        return printers;
    }

    /**
     * Test di stampa
     */
    async testPrint() {
        try {
            const testContent = this.createTestContent();
            const tempFile = path.join(
                this.config.get('system.tempDir') || './temp',
                `test-print-${Date.now()}.txt`
            );

            // Crea directory temp se non esiste
            const tempDir = path.dirname(tempFile);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Scrivi il contenuto di test
            fs.writeFileSync(tempFile, testContent);

            // Stampa
            const result = await this.printFile(tempFile, { raw: false });

            // Cleanup
            setTimeout(() => {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            }, 5000);

            return {
                ...result,
                testFile: tempFile,
                content: testContent
            };

        } catch (error) {
            throw new Error(`Test di stampa fallito: ${error.message}`);
        }
    }

    /**
     * Crea contenuto di test per la stampa
     */
    createTestContent() {
        const now = new Date().toLocaleString();
        return `
===============================
    PRINT SERVER TEST
===============================
Data: ${now}
Piattaforma: ${this.platform}
Stampante: ${this.config.get('printer.name')}
Server: ${this.config.get('server.name')}
===============================
Se vedi questo messaggio,
la stampante funziona correttamente!
===============================
        `.trim();
    }
}

export default PrintManager;