const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
    },
    title: String,
    company: String,
    matchScore: Number,
    matchedSkills: [String],
    missingSkills: [String],
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    resumeText: {
      type: String,
      default: '',
    },
    resumePublicId: {
      type: String,
      default: '',
    },
    resumeResourceType: {
      type: String,
      default: '',
    },
    uploads: {
      type: [
        {
          filename: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
          resumeText: String,
          resumeUrl: String,
          resumePublicId: String,
          resumeResourceType: String,
        },
      ],
      default: [],
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    headline: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    skillsManual: {
      type: [String],
      default: [],
    },
    extractedSkills: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [recommendationSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
