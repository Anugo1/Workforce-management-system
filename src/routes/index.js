const express = require('express');

const departmentRoutes = require('./departmentRoutes');
const employeeRoutes = require('./employeeRoutes');
const leaveRequestRoutes = require('./leaveRequestRoutes');

const router = express.Router();

router.use('/departments', departmentRoutes);
router.use('/employees', employeeRoutes);
router.use('/leave-requests', leaveRequestRoutes);

module.exports = router;
