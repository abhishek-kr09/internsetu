const Listing = require('../models/listing.model');
const { ApiError } = require('../utils/apiError');
const { apiResponse } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const createListing = asyncHandler(async (req, res) => {
  const { title, company, location, stipend, durationWeeks, description, skills, mode } = req.body;
  if (!title || !company || !description || !skills) {
    throw new ApiError(400, 'title, company, description and skills are required');
  }

  const listing = await Listing.create({
    recruiter: req.user._id,
    title,
    company,
    location,
    stipend,
    durationWeeks,
    description,
    skills: Array.isArray(skills)
      ? skills
      : String(skills)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    mode,
    isActive: true,
  });

  return apiResponse(res, {
    status: 201,
    message: 'Internship listing created',
    data: { listing },
  });
});

const getListings = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'recruiter' ? { recruiter: req.user._id } : { isActive: true };
  const listings = await Listing.find(filter).sort({ createdAt: -1 });
  return apiResponse(res, { status: 200, data: { listings } });
});

const getPublicListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find({ isActive: { $ne: false } }).sort({ createdAt: -1 });
  return apiResponse(res, { status: 200, data: { listings } });
});

const getListingById = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) {
    throw new ApiError(404, 'Listing not found');
  }
  return apiResponse(res, { status: 200, data: { listing } });
});

module.exports = {
  createListing,
  getListings,
  getPublicListings,
  getListingById,
};
