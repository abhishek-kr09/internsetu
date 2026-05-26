const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    company: {
      type: String,
      default: '',
    },
    matchScore: {
      type: Number,
      default: 0,
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
