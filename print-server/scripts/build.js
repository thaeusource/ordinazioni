#!/usr/bin/env node

/**
 * Script di build per creare i pacchetti distribuibili del Print Server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJson = require('../package.json');
const version = packageJson.version;
const projectName = 'sagra-print-server';

console.log('🏗️  Build Print Server Distribution');
console.log('===================================');
console.log(`📦 Progetto: ${projectName}`);
console.log(`🏷️  Versione: v${version}`);
console.log('');

// Directory e file da escludere
const excludePatterns = [
    'node_modules',
    'dist',
    'temp',
    '.git',
    '.DS_Store',
    '*.tar.gz',
    '*.zip',
    '*.log'
];

// File che devono essere inclusi
const requiredFiles = [
    'package.json',
    'README.md',
    'QUICK_START.md',
    'src/',
    'scripts/',
    'config/',
    'start.js',
    'start.bat'
];

function createDistDirectory() {
    console.log('📁 Preparazione directory di build...');
    
    // Rimuovi vecchi file
    try {
        execSync('rm -rf dist/ *.tar.gz *.zip', { stdio: 'ignore' });
    } catch (error) {
        // Ignora errori se i file non esistono
    }
    
    // Crea directory dist
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
    }
    
    console.log('✅ Directory preparata');
}

function validateFiles() {
    console.log('🔍 Validazione file richiesti...');
    
    const missingFiles = [];
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (!fs.existsSync(filePath)) {
            missingFiles.push(file);
        }
    });
    
    if (missingFiles.length > 0) {
        console.error('❌ File mancanti:');
        missingFiles.forEach(file => console.error(`   - ${file}`));
        process.exit(1);
    }
    
    console.log('✅ Tutti i file richiesti sono presenti');
}

function createTarPackage() {
    console.log('📦 Creazione pacchetto TAR.GZ (macOS/Linux)...');
    
    const excludeArgs = excludePatterns.map(pattern => `--exclude='${pattern}'`).join(' ');
    const tarFileName = `${projectName}-v${version}.tar.gz`;
    
    try {
        const command = `tar ${excludeArgs} -czf ${tarFileName} -C .. print-server`;
        execSync(command, { stdio: 'inherit' });
        
        // Verifica che il file sia stato creato
        if (fs.existsSync(tarFileName)) {
            const stats = fs.statSync(tarFileName);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`✅ TAR.GZ creato: ${tarFileName} (${fileSizeMB} MB)`);
        } else {
            throw new Error('File TAR.GZ non creato');
        }
    } catch (error) {
        console.error('❌ Errore nella creazione del TAR.GZ:', error.message);
        process.exit(1);
    }
}

function createZipPackage() {
    console.log('📦 Creazione pacchetto ZIP (Windows)...');
    
    const excludeArgs = excludePatterns.map(pattern => `-x '${pattern}/*'`).join(' ');
    const zipFileName = `${projectName}-v${version}.zip`;
    
    try {
        const command = `zip -r ${zipFileName} . ${excludeArgs}`;
        execSync(command, { stdio: 'inherit' });
        
        // Verifica che il file sia stato creato
        if (fs.existsSync(zipFileName)) {
            const stats = fs.statSync(zipFileName);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`✅ ZIP creato: ${zipFileName} (${fileSizeMB} MB)`);
        } else {
            throw new Error('File ZIP non creato');
        }
    } catch (error) {
        console.error('❌ Errore nella creazione del ZIP:', error.message);
        process.exit(1);
    }
}

function generateChecksums() {
    console.log('🔐 Generazione checksum...');
    
    const files = [
        `${projectName}-v${version}.tar.gz`,
        `${projectName}-v${version}.zip`
    ];
    
    const checksumFile = `${projectName}-v${version}-checksums.txt`;
    let checksumContent = `# Checksums per ${projectName} v${version}\n`;
    checksumContent += `# Generato il ${new Date().toISOString()}\n\n`;
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            try {
                const sha256 = execSync(`shasum -a 256 ${file}`, { encoding: 'utf8' });
                checksumContent += sha256;
            } catch (error) {
                console.warn(`⚠️  Impossibile generare checksum per ${file}`);
            }
        }
    });
    
    fs.writeFileSync(checksumFile, checksumContent);
    console.log(`✅ Checksum salvati in: ${checksumFile}`);
}

function showSummary() {
    console.log('');
    console.log('🎉 BUILD COMPLETATO!');
    console.log('====================');
    console.log('📦 Pacchetti creati:');
    
    try {
        const files = execSync('ls -la *.tar.gz *.zip *.txt 2>/dev/null || true', { encoding: 'utf8' });
        if (files.trim()) {
            console.log(files);
        } else {
            console.log('   Nessun pacchetto trovato');
        }
    } catch (error) {
        console.log('   Errore nel listare i file');
    }
    
    console.log('');
    console.log('📋 Istruzioni per la distribuzione:');
    console.log(`   1. Condividi ${projectName}-v${version}.tar.gz per macOS/Linux`);
    console.log(`   2. Condividi ${projectName}-v${version}.zip per Windows`);
    console.log('   3. Includi sempre il file checksums per la verifica');
    console.log('');
}

// Esegui il build
function main() {
    try {
        createDistDirectory();
        validateFiles();
        createTarPackage();
        createZipPackage();
        generateChecksums();
        showSummary();
    } catch (error) {
        console.error('❌ Build fallito:', error.message);
        process.exit(1);
    }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
    main();
}

module.exports = { main };