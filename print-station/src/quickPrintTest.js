/**
 * Test Stampa Rapido
 * Script per configurare rapidamente una stampante e testare la stampa
 */

import ReceiptGenerator from './receiptGenerator.js';
import PrintManager from './printManager.js';
import ConfigManager from './configManager.js';

/**
 * Test stampa con configurazione stampante custom
 */
async function quickPrintTest(printerName = null) {
  console.log('🖨️ Test Stampa Rapido');
  console.log('='.repeat(50));
  
  try {
    // Se non specificata una stampante, lista quelle disponibili
    if (!printerName) {
      console.log('📋 Per usare questo test, specifica il nome della stampante:');
      console.log('   node quickPrintTest.js "Nome_Stampante"');
      console.log('');
      console.log('💡 Su macOS puoi vedere le stampanti con:');
      console.log('   lpstat -p');
      console.log('');
      console.log('💡 Su Windows:');
      console.log('   wmic printer list brief');
      console.log('');
      console.log('📝 Generazione file di test comunque...');
    }
    
    // Configura al volo
    const configManager = new ConfigManager();
    configManager.loadConfig();
    
    if (printerName) {
      // Sovrascrivi temporaneamente il nome stampante
      configManager.config.printer.name = printerName;
      console.log(`🎯 Stampante configurata: ${printerName}`);
    }
    
    // Genera scontrino di test
    const generator = new ReceiptGenerator();
    const testOrder = ReceiptGenerator.createTestOrder();
    
    console.log(`📝 Generazione scontrino test...`);
    const commands = generator.generateReceiptCommands(testOrder);
    
    // Salva file
    const filePath = generator.saveCommandsToFile(commands, 'quick_test.bin');
    console.log(`💾 File salvato: ${filePath}`);
    
    if (printerName) {
      // Tenta stampa
      const printManager = new PrintManager(configManager);
      console.log(`🖨️ Invio alla stampante "${printerName}"...`);
      
      try {
        const result = await printManager.printFile(filePath, { raw: true });
        console.log('✅ STAMPA INVIATA!');
        console.log(`   Comando: ${result.command}`);
        
        return true;
        
      } catch (error) {
        console.log(`❌ Errore stampa: ${error.message}`);
        console.log('');
        console.log('💡 Suggerimenti:');
        console.log('   • Verifica che la stampante sia accesa');
        console.log('   • Controlla il nome stampante (case sensitive)');
        console.log('   • Su macOS prova: lpstat -p');
        console.log('   • Il file è comunque salvato per debug');
        
        return false;
      }
    } else {
      console.log('📄 File generato. Per stampare, rilancia con:');
      console.log(`   node quickPrintTest.js "Nome_Stampante"`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
    return false;
  }
}

// Parsing argomenti linea di comando
const printerName = process.argv[2];

// Esegui test
quickPrintTest(printerName).then(success => {
  process.exit(success ? 0 : 1);
});

export { quickPrintTest };