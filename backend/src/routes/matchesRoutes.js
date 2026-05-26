const express = require('express');
const { generateMatches, getMyMatches } = require('../controllers/match.controller');
const { authMiddleware, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/generate', authMiddleware, authorizeRoles('student'), express.json(), generateMatches);
router.get('/me', authMiddleware, authorizeRoles('student'), getMyMatches);

module.exports = router;
