const express = require('express');
const { createListing, getListings, getPublicListings, getListingById } = require('../controllers/listing.controller');
const { authMiddleware, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/public', getPublicListings);
router.get('/:listingId', getListingById);
router.get('/', authMiddleware, getListings);
router.post('/', authMiddleware, authorizeRoles('recruiter'), createListing);

module.exports = router;
