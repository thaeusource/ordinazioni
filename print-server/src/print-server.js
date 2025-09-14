// Print Server per stampante termica Qian QOP-T80UL-RI-02
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ConfigManager from './config-manager.js';
import PrintManager from './print-manager.js';
import { CONTROL, CUT, ALIGN, TEXT_STYLE, FEED, HELPERS } from './escpos-commands.js';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ThermalPrintServer {
    constructor() {
        // Carica configurazione
        this.configManager = new ConfigManager();
        this.config = this.configManager.loadConfig();

        // Inizializza print manager
        this.printManager = new PrintManager(this.configManager);

        // Configurazione server
        this.app = express();
        this.port = this.config.server.port;
        this.host = this.config.server.host;
        this.tempDir = path.resolve(this.config.system.tempDir);

        // Crea directory temp se non esiste
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }

        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());

        // CORS headers per permettere chiamate dall'app React
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });

        // Logging middleware
        if (this.config.logging.requestLogging) {
            this.app.use((req, res, next) => {
                console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
                next();
            });
        }
    }

    setupRoutes() {
        // Endpoint per listare stampanti
        this.app.get('/printers', async (req, res) => {
            try {
                const result = await this.printManager.listPrinters();
                res.json(result);
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.get('/health', async (req, res) => {
            try {
                const printerStatus = await this.printManager.checkPrinterStatus();
                const platformInfo = this.configManager.getPlatformInfo();

                res.json({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    server: {
                        name: this.config.server.name,
                        version: this.config.server.version,
                        platform: platformInfo.platform
                    },
                    printer: {
                        name: this.config.printer.name,
                        status: printerStatus.status,
                        available: printerStatus.available
                    },
                    config: {
                        tempDir: this.tempDir,
                        logging: this.config.logging.enabled
                    }
                });
            } catch (error) {
                res.status(500).json({
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });


        // Endpoint principale per stampa (usato dall'app React)
        this.app.post('/print', async (req, res) => {
            try {
                const commands = req.body;

                if (!commands) {
                    return res.status(400).json({
                        success: false,
                        error: 'Campo "data" o "content" mancante. Invia array di comandi ESC/POS.'
                    });
                }

                const result = await this.printRawContent(commands);
                res.json(result);
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Endpoint di test (semplificato)
        this.app.post('/test', async (req, res) => {
            try {
                const dt = new Date().toLocaleString('it-IT');
                const commands = [];

                // Test generico
                commands.push(...CONTROL.INIT);
                commands.push(...HELPERS.header('PRINT SERVER TEST'));
                commands.push(...HELPERS.separator('=', this.config.printer.width));
                commands.push(...Buffer.from(`Data: ${dt}\n`));
                commands.push(...Buffer.from(`Server: ${this.config.server.name}\n`));
                commands.push(...Buffer.from(`Stampante: ${this.config.printer.name}\n`));
                commands.push(...HELPERS.separator('=', this.config.printer.width));
                commands.push(...HELPERS.footer('Test completato', 3));
                
                const result = await this.printRawContent(commands, 'TEST');
                res.json(result);
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    euros(amount) {
        return (amount / 100).toFixed(2);
    }

    async printRawContent(content, jobId = null) {
        try {
            // Converte array di comandi in Buffer se necessario
            let escposData;
            if (Array.isArray(content)) {
                escposData = Buffer.from(content);
            } else if (typeof content === 'string') {
                // Tratta come testo semplice
                escposData = Buffer.from([
                    ...CONTROL.INIT,
                    ...Buffer.from(content),
                    ...FEED.THREE_LINES,
                    ...CUT.FULL
                ]);
            } else {
                escposData = content;
            }

            const tempFile = path.join(this.tempDir, `print-${jobId || Date.now()}.bin`);

            // Scrivi i dati ESC/POS nel file temporaneo
            fs.writeFileSync(tempFile, escposData);

            // Usa il print manager per stampare
            const result = await this.printManager.printFile(tempFile, { raw: true });

            // Cleanup del file temporaneo
            setTimeout(() => {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            }, this.config.system.cleanupDelay);

            return {
                success: true,
                jobId: jobId || 'UNKNOWN',
                message: 'Contenuto stampato',
                printJob: result.output,
                platform: result.platform,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`Stampa fallita: ${error.message}`);
        }
    }

    async checkPrinterStatus() {
        return await this.printManager.checkPrinterStatus();
    }

    start() {
        this.app.listen(this.port, this.host, () => {
            console.log('=====================================');
            console.log(`  ${this.config.server.name.toUpperCase()}  `);
            console.log('=====================================');
            console.log(`🌐 Indirizzo: http://${this.host}:${this.port}`);
            console.log(`🖨️ Stampante: ${this.config.printer.name}`);
            console.log(`💻 Piattaforma: ${this.configManager.getPlatformInfo().platform}`);
            console.log(`📂 Temp Dir: ${this.tempDir}`);
            console.log('=====================================');
            console.log('✅ Server pronto');

            // Avviso se la stampante non è configurata
            if (this.config.printer.name === 'YOUR_PRINTER_NAME_HERE') {
                console.log('\n⚠️  ATTENZIONE: Stampante non configurata!');
                console.log('📝 Modifica config.json per impostare il nome della stampante');
            }
        });
    }
}

// Avvia il server
const server = new ThermalPrintServer();

export default ThermalPrintServer;
server.start();
