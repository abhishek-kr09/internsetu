const express = require('express');
const multer = require('multer');
const {
	uploadResumeAndRecommend,
	recommendFromProfile,
	getProfile,
	updateProfile,
	deleteProfileUpload,
} = require('../controllers/profile.controller');
const { authMiddleware, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/resume-upload', authMiddleware, authorizeRoles('student'), upload.single('resume'), uploadResumeAndRecommend);
router.post('/reparse', authMiddleware, authorizeRoles('student'), express.json(), recommendFromProfile);
router.get('/me', authMiddleware, authorizeRoles('student'), getProfile);
router.patch('/me', authMiddleware, authorizeRoles('student'), express.json(), updateProfile);
router.delete('/uploads/:uploadId', authMiddleware, authorizeRoles('student'), deleteProfileUpload);

module.exports = router;
