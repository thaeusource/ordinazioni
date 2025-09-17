/**
 * Configuration Manager per Print Server
 * Gestisce caricamento e validazione della configurazione
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConfigManager {
    constructor(configPath = './config/config.json') {
        this.configPath = configPath;
        this.config = null;
        this.defaultConfig = this.getDefaultConfig();
    }

    getDefaultConfig() {
        return {
            server: {
                port: 3001,
                host: '127.0.0.1',
                name: 'Thermal Print Server',
                version: '1.0'
            },
            printer: {
                name: 'YOUR_PRINTER_NAME_HERE',
                type: 'thermal',
                width: 32,
                description: 'Thermal Receipt Printer'
            },
            system: {
                platform: 'auto',
                tempDir: './temp',
                cleanupDelay: 10000,
                encoding: 'utf8'
            },
            logging: {
                enabled: true,
                level: 'info',
                requestLogging: true
            }
        };
    }

    loadConfig() {
        try {
            // Controlla se il file di configurazione esiste
            if (!fs.existsSync(this.configPath)) {
                console.log(`⚠️  File di configurazione non trovato: ${this.configPath}`);
                console.log('📝 Creazione configurazione di default...');
                this.createDefaultConfig();
            }

            // Carica la configurazione
            const configData = fs.readFileSync(this.configPath, 'utf8');
            this.config = JSON.parse(configData);

            // Merge con configurazione di default per campi mancanti
            this.config = this.mergeWithDefaults(this.config, this.defaultConfig);

            // Valida la configurazione
            this.validateConfig();

            console.log('✅ Configurazione caricata correttamente');
            return this.config;

        } catch (error) {
            console.error('❌ Errore nel caricamento della configurazione:', error.message);
            console.log('🔄 Uso configurazione di default');
            this.config = { ...this.defaultConfig };
            return this.config;
        }
    }

    createDefaultConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.defaultConfig, null, 2));
            console.log(`✅ File di configurazione creato: ${this.configPath}`);
            console.log('📝 Modifica il file per personalizzare le impostazioni');
        } catch (error) {
            console.error('❌ Errore nella creazione del file di configurazione:', error.message);
        }
    }

    mergeWithDefaults(userConfig, defaultConfig) {
        const merged = { ...defaultConfig };

        for (const [key, value] of Object.entries(userConfig)) {
            if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                merged[key] = this.mergeWithDefaults(value, defaultConfig[key] || {});
            } else {
                merged[key] = value;
            }
        }

        return merged;
    }

    validateConfig() {
        const errors = [];

        // Validazione stampante
        if (!this.config.printer.name || this.config.printer.name === 'YOUR_PRINTER_NAME_HERE') {
            errors.push('Nome stampante non configurato. Modifica config.json');
        }

        // Validazione porta
        if (!this.config.server.port || this.config.server.port < 1 || this.config.server.port > 65535) {
            errors.push('Porta server non valida');
        }

        // Validazione directory temp
        if (!this.config.system.tempDir) {
            errors.push('Directory temporanea non specificata');
        }

        if (errors.length > 0) {
            console.warn('⚠️  Problemi di configurazione:');
            errors.forEach(error => console.warn(`   - ${error}`));
            
            if (this.config.printer.name === 'YOUR_PRINTER_NAME_HERE') {
                console.log('\n🔧 Per configurare la stampante:');
                console.log('   1. Apri config.json');
                console.log('   2. Sostituisci "YOUR_PRINTER_NAME_HERE" con il nome della tua stampante');
                console.log('   3. Su macOS usa: lpstat -p per vedere le stampanti');
                console.log('   4. Su Windows usa: wmic printer list brief');
            }
        }
    }

    get(path) {
        if (!this.config) {
            this.loadConfig();
        }

        const keys = path.split('.');
        let value = this.config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return value;
    }

    set(path, newValue) {
        if (!this.config) {
            this.loadConfig();
        }

        const keys = path.split('.');
        let current = this.config;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = newValue;
    }

    save() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            console.log('✅ Configurazione salvata');
            return true;
        } catch (error) {
            console.error('❌ Errore nel salvataggio della configurazione:', error.message);
            return false;
        }
    }

    getPlatformInfo() {
        const platform = process.platform;
        const isWindows = platform === 'win32';
        const isMac = platform === 'darwin';
        const isLinux = platform === 'linux';

        return {
            platform,
            isWindows,
            isMac,
            isLinux,
            printCommand: isWindows ? 'type' : 'lp'
        };
    }

    getAll() {
        if (!this.config) {
            this.loadConfig();
        }
        return { ...this.config };
    }
}

export default ConfigManager;