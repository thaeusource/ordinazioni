/**
 * Componente di test per verificare il sistema di stampa
 */
import React, { useState } from 'react';
import { getPrintService } from '../services/printService';

const PrintTestComponent = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const runTest = async (testName, testFn) => {
    setLoading(true);
    setStatus(`Eseguendo test: ${testName}...`);
    
    try {
      await testFn();
      setStatus(`✅ Test "${testName}" completato con successo`);
    } catch (error) {
      setStatus(`❌ Test "${testName}" fallito: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testServerConnection = async () => {
    const printService = getPrintService();
    const isOnline = await printService.ping();
    
    if (!isOnline) {
      throw new Error('Server di stampa non raggiungibile');
    }
    
    const config = await printService.getServerConfig();
    console.log('Config server:', config);
  };

  const testSimpleText = async () => {
    const printService = getPrintService();
    await printService.printText('Test di stampa semplice\nData: ' + new Date().toLocaleString('it-IT'), {
      center: true,
      bold: true
    });
  };

  const testOrderReceipt = async () => {
    const printService = getPrintService();
    
    const testOrder = {
      customerNumber: 'TEST-001',
      station: 'Test Station',
      items: [
        { name: 'Pizza Margherita', quantity: 2, price: 8.00 },
        { name: 'Coca Cola', quantity: 1, price: 2.50 },
        { name: 'Birra Media', quantity: 3, price: 4.00 }
      ],
      total: 22.50
    };
    
    await printService.printOrderReceipt(testOrder);
  };

  const testPrintServerStatus = async () => {
    const printService = getPrintService();
    const status = await printService.checkPrinterStatus();
    console.log('Stato stampante:', status);
  };

  const testRawCommands = async () => {
    const printService = getPrintService();
    
    // Comandi ESC/POS per test avanzato
    const commands = [
      0x1B, 0x40, // INIT
      0x1B, 0x61, 0x01, // CENTER
      0x1B, 0x45, 0x01, // BOLD ON
      ...Array.from(Buffer.from('TEST COMANDI RAW', 'utf8')),
      0x0A, // LINE FEED
      0x1B, 0x45, 0x00, // BOLD OFF
      0x1B, 0x61, 0x00, // LEFT
      ...Array.from(Buffer.from('Questo è un test di comandi ESC/POS raw', 'utf8')),
      0x0A, 0x0A, 0x0A,
      0x1D, 0x56, 0x00 // CUT
    ];
    
    await printService.printRawCommands(commands);
  };

  return (
    <div className="print-test-panel">
      <h3>🖨️ Test Sistema di Stampa</h3>
      
      <div className="test-buttons">
        <button 
          onClick={() => runTest('Connessione Server', testServerConnection)}
          disabled={loading}
          className="test-btn"
        >
          Test Connessione
        </button>
        
        <button 
          onClick={() => runTest('Stato Stampante', testPrintServerStatus)}
          disabled={loading}
          className="test-btn"
        >
          Stato Stampante
        </button>
        
        <button 
          onClick={() => runTest('Testo Semplice', testSimpleText)}
          disabled={loading}
          className="test-btn"
        >
          Test Testo
        </button>
        
        <button 
          onClick={() => runTest('Ricevuta Ordine', testOrderReceipt)}
          disabled={loading}
          className="test-btn"
        >
          Test Ricevuta
        </button>
        
        <button 
          onClick={() => runTest('Comandi Raw', testRawCommands)}
          disabled={loading}
          className="test-btn"
        >
          Test Raw ESC/POS
        </button>
      </div>
      
      {status && (
        <div className={`test-status ${status.includes('❌') ? 'error' : 'success'}`}>
          {status}
        </div>
      )}
      
      <style jsx>{`
        .print-test-panel {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }
        
        .test-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0;
        }
        
        .test-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        
        .test-btn:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .test-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .test-status {
          margin-top: 16px;
          padding: 12px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
        }
        
        .test-status.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }
        
        .test-status.error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }
      `}</style>
    </div>
  );
};

export default PrintTestComponent;