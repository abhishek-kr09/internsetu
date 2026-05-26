const Application = require('../models/application.model');
const Listing = require('../models/listing.model');
const Profile = require('../models/profile.model');
const { ApiError } = require('../utils/apiError');
const { apiResponse } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const applyToListing = asyncHandler(async (req, res) => {
  const { listingId, notes } = req.body;
  const profile = await Profile.findOne({ user: req.user._id });
  if (!profile || (!profile.resumeText && (!profile.uploads || profile.uploads.length === 0))) {
    throw new ApiError(400, 'Upload a resume before applying');
  }
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new ApiError(404, 'Listing not found');
  }

  const existing = await Application.findOne({ student: req.user._id, listing: listingId });
  if (existing) {
    throw new ApiError(409, 'Already applied to this internship');
  }

  const application = await Application.create({
    student: req.user._id,
    listing: listingId,
    status: 'pending',
    notes,
  });

  return apiResponse(res, {
    status: 201,
    message: 'Application submitted',
    data: { application },
  });
});

const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ student: req.user._id })
    .populate('listing')
    .sort({ createdAt: -1 });
  return apiResponse(res, { status: 200, data: { applications } });
});

const getRecruiterApplications = asyncHandler(async (req, res) => {
  const recruiterListings = await Listing.find({ recruiter: req.user._id }).select('_id');
  const listingIds = recruiterListings.map((item) => item._id);

  const applications = await Application.find({ listing: { $in: listingIds } })
    .populate('student', 'name email')
    .populate('listing', 'title company')
    .sort({ createdAt: -1 })
    .lean();

  const studentIds = applications.map((a) => a.student?._id).filter(Boolean);
  const profiles = await Profile.find({ user: { $in: studentIds } })
    .select('user resumeUrl')
    .lean();
  const profileMap = Object.fromEntries(profiles.map((p) => [String(p.user), p.resumeUrl]));

  const enrichedApplications = applications.map((a) => ({
    ...a,
    student: {
      ...a.student,
      resumeUrl: profileMap[String(a.student?._id)] || '',
    },
  }));

  return apiResponse(res, { status: 200, data: { applications: enrichedApplications } });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;
  if (!['accepted', 'rejected', 'pending'].includes(status)) {
    throw new ApiError(400, 'Status must be accepted, rejected, or pending');
  }

  const application = await Application.findById(applicationId).populate('listing', 'recruiter');
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  if (String(application.listing.recruiter) !== String(req.user._id)) {
    throw new ApiError(403, 'Forbidden');
  }

  application.status = status;
  await application.save();

  return apiResponse(res, {
    status: 200,
    message: 'Application status updated',
    data: { application },
  });
});

const withdrawApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const application = await Application.findOne({ _id: applicationId, student: req.user._id });
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }
  if (application.status === 'accepted') {
    throw new ApiError(400, 'Accepted applications cannot be withdrawn');
  }

  await Application.deleteOne({ _id: applicationId, student: req.user._id });
  return apiResponse(res, { status: 200, message: 'Application withdrawn' });
});

module.exports = {
  applyToListing,
  getMyApplications,
  getRecruiterApplications,
  updateApplicationStatus,
  withdrawApplication,
};
