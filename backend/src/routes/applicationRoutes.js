const express = require('express');
const {
	applyToListing,
	getMyApplications,
	getRecruiterApplications,
	updateApplicationStatus,
	withdrawApplication,
} = require('../controllers/application.controller');
const { authMiddleware, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('student'), applyToListing);
router.get('/me', authMiddleware, authorizeRoles('student'), getMyApplications);
router.delete('/:applicationId', authMiddleware, authorizeRoles('student'), withdrawApplication);
router.get('/recruiter', authMiddleware, authorizeRoles('recruiter'), getRecruiterApplications);
router.patch('/:applicationId/status', authMiddleware, authorizeRoles('recruiter'), updateApplicationStatus);

module.exports = router;
