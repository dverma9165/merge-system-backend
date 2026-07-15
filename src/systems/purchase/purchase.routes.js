const express = require('express');
const router = express.Router();
const purchaseController = require('./purchase.controller');

// Define purchase system routes
router.get('/', purchaseController.getPurchaseOverview);

module.exports = router;
