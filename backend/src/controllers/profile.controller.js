const Profile = require('../models/profile.model');
const User = require('../models/user.model');
const Listing = require('../models/listing.model');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../utils/cloudinary');
const { ApiError } = require('../utils/apiError');
const { apiResponse } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { parseResumeBuffer } = require('../services/resume.parser');
const { generateRecommendations, extractSkills } = require('../services/gemini.service');

const uploadResumeAndRecommend = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Resume PDF is required');

  const [resumeText, cloudinaryResult] = await Promise.all([
    parseResumeBuffer(req.file.buffer),
    uploadToCloudinary(req.file.buffer).catch((err) => {
      console.error('Cloudinary upload failed:', err);
      return null;
    }),
  ]);

  const resumeUrl = cloudinaryResult?.secure_url || '';
  const resumePublicId = cloudinaryResult?.public_id || '';
  const resumeResourceType = cloudinaryResult?.resource_type || '';

  const listings = await Listing.find({ isActive: true }).lean();

  const { recommendations, aiWarning } = await generateRecommendations({
    resumeText,
    listings,
    geminiApiKey: process.env.GEMINI_API_KEY,
    modelOverride: process.env.GEMINI_MODEL,
  });

  const update = {
    $set: {
      user: req.user._id,
      resumeText,
      resumeUrl,
      resumePublicId,
      resumeResourceType,
      extractedSkills: extractSkills(resumeText),
      recommendations: recommendations.map((item) => ({
        listing: item.listingId,
        title: item.title,
        company: item.company,
        matchScore: item.match_score,
        matchedSkills: item.matched_skills,
        missingSkills: item.missing_skills,
      })),
    },
    $push: {
      uploads: {
        $each: [
          {
            filename: req.file.originalname || 'uploaded_resume.pdf',
            uploadedAt: new Date(),
            resumeText,
            resumeUrl,
            resumePublicId,
            resumeResourceType,
          },
        ],
        $position: 0,
        $slice: 20,
      },
    },
  };

  const profile = await Profile.findOneAndUpdate({ user: req.user._id }, update, {
    upsert: true,
    returnDocument: 'after',
    setDefaultsOnInsert: true,
  });

  return apiResponse(res, {
    status: 200,
    message: aiWarning
      ? 'Resume processed with fallback scoring (Gemini unavailable)'
      : 'Resume processed and recommendations generated',
    data: {
      aiWarning,
      profile,
      recommendations,
    },
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id });
  return apiResponse(res, {
    status: 200,
    data: {
      profile,
      user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
    },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, headline, location, phone, bio, skillsManual } = req.body;

  if (name) {
    await User.findByIdAndUpdate(req.user._id, { name }, { new: true });
  }

  const normalizedSkills = Array.isArray(skillsManual)
    ? skillsManual
    : typeof skillsManual === 'string'
        ? skillsManual
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined;

  const update = {
    $set: {
      headline: headline ?? '',
      location: location ?? '',
      phone: phone ?? '',
      bio: bio ?? '',
      ...(normalizedSkills ? { skillsManual: normalizedSkills } : {}),
    },
  };

  const profile = await Profile.findOneAndUpdate({ user: req.user._id }, update, {
    upsert: true,
    returnDocument: 'after',
    setDefaultsOnInsert: true,
  });

  return apiResponse(res, {
    status: 200,
    message: 'Profile updated',
    data: { profile },
  });
});

const deleteProfileUpload = asyncHandler(async (req, res) => {
  const { uploadId } = req.params;
  const profile = await Profile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Profile not found');

  const upload = (profile.uploads || []).find((item) => String(item._id) === String(uploadId));
  if (!upload) throw new ApiError(404, 'Upload not found');

  const publicId = upload.resumePublicId || getPublicIdFromUrl(upload.resumeUrl);
  await deleteFromCloudinary(publicId, upload.resumeResourceType);

  const isCurrentResume =
    (profile.resumePublicId && upload.resumePublicId && profile.resumePublicId === upload.resumePublicId)
    || (profile.resumeUrl && upload.resumeUrl && profile.resumeUrl === upload.resumeUrl)
    || profile.uploads.length === 1;

  const update = {
    $pull: { uploads: { _id: uploadId } },
  };

  if (isCurrentResume) {
    update.$set = {
      resumeText: '',
      resumeUrl: '',
      resumePublicId: '',
      resumeResourceType: '',
      extractedSkills: [],
      recommendations: [],
    };
  }

  const updatedProfile = await Profile.findOneAndUpdate({ user: req.user._id }, update, {
    returnDocument: 'after',
  });

  return apiResponse(res, {
    status: 200,
    message: 'Resume removed',
    data: { profile: updatedProfile },
  });
});

const recommendFromProfile = asyncHandler(async (req, res) => {
  const { filename } = req.body;
  const profile = await Profile.findOne({ user: req.user._id });
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

  if (!resumeText) throw new ApiError(400, 'No resume text available to reparse');

  const listings = await Listing.find({ isActive: true }).lean();

  const { recommendations, aiWarning } = await generateRecommendations({
    resumeText,
    listings,
    geminiApiKey: process.env.GEMINI_API_KEY,
    modelOverride: process.env.GEMINI_MODEL,
  });

  const update = {
    $set: {
      resumeText,
      resumeUrl,
      extractedSkills: extractSkills(resumeText),
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

  const updated = await Profile.findOneAndUpdate({ user: req.user._id }, update, {
    returnDocument: 'after',
  });

  return apiResponse(res, {
    status: 200,
    message: 'Reparsed resume and refreshed recommendations',
    data: {
      aiWarning,
      profile: updated,
      recommendations,
    },
  });
});

module.exports = {
  uploadResumeAndRecommend,
  recommendFromProfile,
  getProfile,
  updateProfile,
  deleteProfileUpload,
};
