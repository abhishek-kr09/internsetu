const Match = require('../models/match.model');
const Listing = require('../models/listing.model');
const Profile = require('../models/profile.model');
const { ApiError } = require('../utils/apiError');
const { apiResponse } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { generateRecommendations, extractSkills } = require('../services/gemini.service');

const generateMatches = asyncHandler(async (req, res) => {
  const { profileId, filename } = req.body;
  if (!profileId) throw new ApiError(400, 'profileId is required');

  const profile = await Profile.findOne({ _id: profileId, user: req.user._id });
  if (!profile) throw new ApiError(404, 'Profile not found');

  let resumeText = profile.resumeText || '';
  let resumeUrl = profile.resumeUrl || '';

  if (filename && Array.isArray(profile.uploads) && profile.uploads.length) {
    const found = profile.uploads.find((u) => u.filename === filename);
    if (found) {
      if (found.resumeText) resumeText = found.resumeText;
      if (found.resumeUrl) resumeUrl = found.resumeUrl;
    }
  }

  if (!resumeText) throw new ApiError(400, 'No resume text available for matching');

  const listings = await Listing.find({ isActive: true }).lean();
  const { recommendations, aiWarning } = await generateRecommendations({
    resumeText,
    listings,
    geminiApiKey: process.env.GEMINI_API_KEY,
    modelOverride: process.env.GEMINI_MODEL,
  });

  await Match.deleteMany({ student: req.user._id, profile: profile._id });

  const matchDocs = recommendations.map((item) => ({
    student: req.user._id,
    profile: profile._id,
    listing: item.listingId,
    title: item.title,
    company: item.company,
    matchScore: item.match_score,
    matchedSkills: item.matched_skills,
    missingSkills: item.missing_skills,
  }));

  const matches = matchDocs.length ? await Match.insertMany(matchDocs) : [];

  const update = {
    $set: {
      extractedSkills: extractSkills(resumeText),
      resumeText,
      resumeUrl,
      recommendations: recommendations.map((item) => ({
        listing: item.listingId,
        title: item.title,
        company: item.company,
        matchScore: item.match_score,
        matchedSkills: item.matched_skills,
        missingSkills: item.missing_skills,
      })),
    },
  };

  const updatedProfile = await Profile.findOneAndUpdate({ _id: profile._id }, update, {
    returnDocument: 'after',
  });

  return apiResponse(res, {
    status: 200,
    message: 'Matches generated',
    data: {
      aiWarning,
      profile: updatedProfile,
      recommendations,
      matches,
    },
  });
});

const getMyMatches = asyncHandler(async (req, res) => {
  const { profileId } = req.query;
  const filter = { student: req.user._id };
  if (profileId) filter.profile = profileId;

  const matches = await Match.find(filter)
    .populate('listing')
    .sort({ matchScore: -1, createdAt: -1 });

  return apiResponse(res, { status: 200, data: { matches } });
});

module.exports = { generateMatches, getMyMatches };
