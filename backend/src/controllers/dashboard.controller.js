const Application = require('../models/application.model');
const Listing = require('../models/listing.model');
const Profile = require('../models/profile.model');
const { apiResponse } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const studentDashboard = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id });
  const applications = await Application.find({ student: req.user._id }).populate('listing');
  return apiResponse(res, {
    status: 200,
    data: {
      profile,
      recommendations: profile?.recommendations || [],
      applications,
    },
  });
});

const recruiterDashboard = asyncHandler(async (req, res) => {
  const listings = await Listing.find({ recruiter: req.user._id }).sort({ createdAt: -1 });
  const listingIds = listings.map((l) => l._id);
  const applicationCount = await Application.countDocuments({ listing: { $in: listingIds } });

  return apiResponse(res, {
    status: 200,
    data: {
      listings,
      stats: {
        totalListings: listings.length,
        totalApplications: applicationCount,
      },
    },
  });
});

module.exports = { studentDashboard, recruiterDashboard };
