const express = require('express');
const router = express.Router();

router.use('/firms', require('./firms/firms.routes'));
router.use('/master', require('./master/master.routes'));
router.use('/indent', require('./indent/indent.routes'));
router.use('/hod-approval', require('./hod-approval/hodApproval.routes'));
router.use('/three-party', require('./three-party/threeParty.routes'));
router.use('/factory-approval', require('./factory-approval/factoryApproval.routes'));
router.use('/management-approval', require('./management-approval/managementApproval.routes'));

// @desc    Purchase system overview placeholder (kept from the original module)
// @route   GET /api/purchase
// @access  Public
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: { message: 'Purchase System overview data' },
  });
});

module.exports = router;
