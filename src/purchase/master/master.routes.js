const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const {
  listMasterRows,
  listToleranceRows,
  getMasterFirmNames,
  getIndentOptions,
  createMasterEntry,
} = require('./master.controller');

router.get('/firms', getMasterFirmNames);
router.get('/indent-options', getIndentOptions);
router.get('/tolerance', listToleranceRows);
router.get('/', listMasterRows);
router.post('/', protect, createMasterEntry);

module.exports = router;
