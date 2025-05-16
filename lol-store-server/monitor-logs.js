/**
 * Script para monitorear los logs de stock en tiempo real
 */

const fs = require('fs');
const path = require('path');

const STOCK_LOG_FILE = path.join(__dirname, 'logs', 'stock-updates.log');
const ERROR_LOG_FILE = path.join(__dirname, 'logs', 'error.log');

// Función para asegurar que el archivo existe
const ensureLogFile = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '-- Log file initialized --\n');
  }
};

// Asegurar que los archivos existan
ensureLogFile(STOCK_LOG_FILE);
ensureLogFile(ERROR_LOG_FILE);

// Monitorear ambos archivos de log
console.log('======================================================');
console.log('  MONITOR DE LOGS - SISTEMA DE STOCK KASSADIN STORE');
console.log('======================================================');
console.log('Monitoreando logs de stock y errores en tiempo real...');
console.log('(Presiona Ctrl+C para salir)\n');

// Crear monitor para logs de stock
const stockWatcher = fs.watch(STOCK_LOG_FILE, (eventType) => {
  if (eventType === 'change') {
    const content = fs.readFileSync(STOCK_LOG_FILE, 'utf8');
    const lines = content.split('\n');
    
    // Mostrar sólo las últimas 10 líneas
    const lastLines = lines.slice(-10).filter(line => line.trim() !== '');
    
    console.clear();
    console.log('======================================================');
    console.log('             ÚLTIMOS LOGS DE STOCK');
    console.log('======================================================');
    for (const line of lastLines) {
      console.log(line);
    }
    console.log('\nMonitoreando cambios...');
  }
});

// Crear monitor para logs de errores
const errorWatcher = fs.watch(ERROR_LOG_FILE, (eventType) => {
  if (eventType === 'change') {
    // Verificar si hay errores relacionados con unrankeds o stock
    const content = fs.readFileSync(ERROR_LOG_FILE, 'utf8');
    const lines = content.split('\n');
    
    // Filtrar líneas que tengan "stock", "unranked" o "BACKEND"
    const relevantLines = lines.filter(line => {
      const lowerLine = line.toLowerCase();
      return lowerLine.includes('stock') || lowerLine.includes('unranked') || lowerLine.includes('backend');
    });
    
    // Mostrar sólo las últimas 5 líneas relevantes
    const lastRelevantLines = relevantLines.slice(-5);
    
    if (lastRelevantLines.length > 0) {
      console.log('\n======================================================');
      console.log('          ÚLTIMOS ERRORES RELEVANTES');
      console.log('======================================================');
      for (const line of lastRelevantLines) {
        console.log(line);
      }
      console.log('\n');
    }
  }
});

// Manejador para la terminación del script
process.on('SIGINT', () => {
  stockWatcher.close();
  errorWatcher.close();
  console.log('\nMonitoreo de logs detenido. ¡Hasta pronto!');
  process.exit(0);
});