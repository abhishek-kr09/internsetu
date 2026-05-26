const express = require('express');
const { studentDashboard, recruiterDashboard } = require('../controllers/dashboard.controller');
const { authMiddleware, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/student', authMiddleware, authorizeRoles('student'), studentDashboard);
router.get('/recruiter', authMiddleware, authorizeRoles('recruiter'), recruiterDashboard);

module.exports = router;
