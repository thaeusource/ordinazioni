// Print Server per stampante termica Qian QOP-T80UL-RI-02
const express = require('express');
const fs = require('fs');
const path = require('path');
const ConfigManager = require('./config-manager');
const PrintManager = require('./print-manager');
const { CONTROL, CUT, ALIGN, TEXT_STYLE, FEED, HELPERS } = require('./escpos-commands');

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

        this.app.post('/test', async (req, res) => {
            try {
                // Test generico con contenuto semplice
                const testContent = this.generateTestContent();
                const result = await this.printRawContent(testContent, 'TEST');
                res.json(result);
            } catch (error) {
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
            }
        });

        // Endpoint generico per stampare contenuto ESC/POS raw
        this.app.post('/print-raw', async (req, res) => {
            try {
                const { content, jobId } = req.body;
                
                if (!content) {
                    return res.status(400).json({
                        success: false,
                        error: 'Campo "content" mancante. Invia array di comandi ESC/POS.'
                    });
                }

                const result = await this.printRawContent(content, jobId || `JOB-${Date.now()}`);
                res.json(result);
            } catch (error) {
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
            }
        });

        // Endpoint per stampare testo semplice
        this.app.post('/print-text', async (req, res) => {
            try {
                const { text, options } = req.body;
                
                if (!text) {
                    return res.status(400).json({
                        success: false,
                        error: 'Campo "text" mancante.'
                    });
                }

                const content = this.generateTextContent(text, options || {});
                const result = await this.printRawContent(content, `TEXT-${Date.now()}`);
                res.json(result);
            } catch (error) {
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
            }
        });

        // Endpoint per test stampa semplice
        this.app.post('/test-simple', async (req, res) => {
            try {
                const result = await this.printManager.testPrint();
                res.json({
                    success: true,
                    message: 'Test di stampa completato',
                    ...result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

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

        this.app.post('/print-receipt', async (req, res) => {
            try {
                // Endpoint compatibile con l'app esistente
                // Deprecato: usa /print-raw per nuove implementazioni
                const { customerNumber, station, items, total } = req.body;
                
                if (!customerNumber || !station || !items || !total) {
                    return res.status(400).json({
                        success: false,
                        error: 'Parametri mancanti. DEPRECATO: Usa /print-raw per nuove implementazioni.'
                    });
                }

                // Genera contenuto ESC/POS per compatibilità
                const content = this.generateReceiptContent(customerNumber, station, { items, total });
                const result = await this.printRawContent(content, customerNumber.toString());
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

    generateTestContent() {
        const dt = new Date().toLocaleString('it-IT');
        const commands = [];
        
        // Test generico
        commands.push(...CONTROL.INIT);
        commands.push(...HELPERS.header('PRINT SERVER TEST'));
        commands.push(...HELPERS.separator('=', this.config.printer.width));
        commands.push(...Buffer.from(`Data: ${dt}\n`));
        commands.push(...Buffer.from(`Server: ${this.config.server.name}\n`));
        commands.push(...Buffer.from(`Piattaforma: ${this.configManager.getPlatformInfo().platform}\n`));
        commands.push(...HELPERS.separator('-', this.config.printer.width));
        commands.push(...Buffer.from('Test di stampa completato\n'));
        commands.push(...HELPERS.separator('=', this.config.printer.width));
        commands.push(...HELPERS.footer('Server funzionante!', 3));
        
        return commands;
    }

    generateTextContent(text, options = {}) {
        const commands = [];
        
        commands.push(...CONTROL.INIT);
        
        if (options.centered) {
            commands.push(...ALIGN.CENTER);
        }
        
        if (options.bold) {
            commands.push(...TEXT_STYLE.BOLD_ON);
        }
        
        if (options.doubleSize) {
            commands.push(...TEXT_STYLE.DOUBLE_SIZE);
        }
        
        commands.push(...Buffer.from(text));
        
        if (!text.endsWith('\n')) {
            commands.push(...Buffer.from('\n'));
        }
        
        // Reset stili
        commands.push(...TEXT_STYLE.NORMAL);
        commands.push(...ALIGN.LEFT);
        
        if (options.cut !== false) {
            commands.push(...FEED.THREE_LINES);
            commands.push(...CUT.FULL);
        }
        
        return commands;
    }

    // Metodo di compatibilità per l'app esistente
    generateReceiptContent(orderNo, station, order) {
        const dt = new Date().toLocaleString('it-IT');
        const commands = [];
        
        commands.push(...CONTROL.INIT);
        commands.push(...HELPERS.header('SAGRA PARROCCHIA'));
        commands.push(...HELPERS.separator('=', this.config.printer.width));
        commands.push(...Buffer.from(`Data: ${dt}\n`));
        commands.push(...Buffer.from(`Ordine: ${orderNo}\n`));
        commands.push(...Buffer.from(`Stazione: ${station}\n`));
        commands.push(...HELPERS.separator('-', this.config.printer.width));
        
        order.items.forEach(item => {
            const itemLine = `${item.qty} x ${item.name}`;
            const priceLine = `EUR ${this.euros(item.price * item.qty)}`;
            
            commands.push(...Buffer.from(itemLine + '\n'));
            commands.push(...HELPERS.alignedText(`     ${priceLine}\n`, 'LEFT'));
        });
        
        commands.push(...HELPERS.separator('-', this.config.printer.width));
        commands.push(...TEXT_STYLE.BOLD_ON);
        commands.push(...HELPERS.priceeLine('TOTALE:', `EUR ${this.euros(order.total)}`, this.config.printer.width));
        commands.push(...TEXT_STYLE.BOLD_OFF);
        commands.push(...HELPERS.separator('=', this.config.printer.width));
        commands.push(...HELPERS.footer('Ritira alle cucine indicate', 3));
        
        return commands;
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

    // Metodo di compatibilità
    async printReceipt(orderNo, station, order) {
        const content = this.generateReceiptContent(orderNo, station, order);
        return await this.printRawContent(content, orderNo);
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

const server = new ThermalPrintServer();
server.start();
