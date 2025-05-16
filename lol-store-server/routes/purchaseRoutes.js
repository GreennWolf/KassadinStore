const express = require('express');
const upload = require('../middlewares/multerConfig'); // Asegúrate de la ruta correcta
const path = require('path');
// Importar directamente desde el controlador
const { 
    createPurchase, 
    getAllPurchases, 
    updatePurchase, 
    deletePurchase, 
    createStatus, 
    getAllStatus, 
    updateStatus, 
    deleteStatus, 
    getStatusById,
    getUnreadPurchases,
    markStatusAsViewed,
    getUnreadCount,
    getTotalPurchases,
    confirmPurchaseStatus,
    getPurchasesNeedingConfirmation,
    chargeAccountData,
    checkCuponUsage,
    simulatePurchaseProgress,
    confirmAndUpdateUserProgress
} = require('../controllers/purcharseController');

const router = express.Router();

// Crear una nueva compra con el archivo de comprobante
router.post('/create', upload.single('receipt'), createPurchase);
router.get('/getAll', getAllPurchases);
router.put('/edit/:id', updatePurchase); // Corrección aquí
router.delete('/delete/:id', deletePurchase); // Corrección aquí
router.get('/unread/:userId', getUnreadPurchases);
router.put('/markViewed/:purchaseId', markStatusAsViewed);
router.get('/unreadCount/:userId', getUnreadCount);
router.get('/getTotalPurchases/:userId', getTotalPurchases);

router.post('/confirm/:purchaseId', confirmPurchaseStatus);
router.get('/need-confirmation/:userId', getPurchasesNeedingConfirmation);


router.post('/status/create', createStatus);
router.get('/status/getAll', getAllStatus);
router.get('/status/get/:id', getStatusById); // Nueva ruta
router.put('/status/edit/:id', updateStatus); // Corrección aquí
router.delete('/status/delete/:id', deleteStatus); // Corrección aquí

router.patch('/:purchaseId/items/:itemId/account', chargeAccountData);

router.get('/check-cupon/:userId/:cuponId', checkCuponUsage);

router.post('/simulate-progress', simulatePurchaseProgress);

// Añadir esta ruta en el archivo de rutas
router.post('/:purchaseId/process-progress', confirmAndUpdateUserProgress);

// Ruta para acceder a imágenes de recibos directamente
router.get('/receiptImage/:filename', (req, res) => {
  const { filename } = req.params;
  if (!filename) {
    return res.status(400).send('Nombre de archivo no proporcionado');
  }
  
  const filePath = path.join(__dirname, '..', 'public', 'receipts', filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error enviando archivo:', err);
      res.status(404).send('Imagen no encontrada');
    }
  });
});

module.exports = router;
