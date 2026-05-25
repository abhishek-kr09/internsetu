const jwt = require('jsonwebtoken');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/user.model');
const Profile = require('../models/profile.model');
const Listing = require('../models/listing.model');
const Application = require('../models/application.model');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../utils/cloudinary');

const createToken = (id, role) =>
	jwt.sign({ id, role }, process.env.JWT_SECRET || 'dev_jwt_secret_change_me', {
		expiresIn: '30d',
	});

const parseGeminiJson = (rawText) => {
	const cleaned = rawText.replace(/```json|```/g, '').trim();
	return JSON.parse(cleaned);
};

const extractSkills = (text) => {
	const knownSkills = [
		'javascript', 'typescript', 'react', 'node.js', 'node', 'express', 'mongodb', 'sql',
		'python', 'java', 'c++', 'tailwind', 'html', 'css', 'git', 'figma', 'next.js',
		'communication', 'problem solving', 'api', 'rest', 'jwt', 'ml', 'ai', 'data analysis',
	];
	const normalized = text.toLowerCase();
	return knownSkills.filter((skill) => normalized.includes(skill));
};

const fallbackRecommendation = (resumeText, listings) => {
	const studentSkills = extractSkills(resumeText);
	return listings
		.map((listing) => {
			const listingSkills = listing.skills.map((s) => s.toLowerCase());
			const matched = listingSkills.filter((skill) => studentSkills.includes(skill));
			const missing = listingSkills.filter((skill) => !studentSkills.includes(skill));
			const score = listingSkills.length
				? Math.round((matched.length / listingSkills.length) * 100)
				: 0;

			return {
				listingId: listing._id,
				title: listing.title,
				company: listing.company,
				match_score: score,
				matched_skills: matched,
				missing_skills: missing,
			};
		})
		.sort((a, b) => b.match_score - a.match_score);
};

const register = async (req, res) => {
	try {
		const { name, email, password, role } = req.body;
		if (!name || !email || !password) {
			return res.status(400).json({ message: 'Name, email and password are required' });
		}

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(409).json({ message: 'Email already registered' });
		}

		const user = await User.create({
			name,
			email,
			password,
			role: role === 'recruiter' ? 'recruiter' : 'student',
		});

		return res.status(201).json({
			message: 'User registered successfully',
			token: createToken(user._id, user.role),
			user: { id: user._id, name: user.name, email: user.email, role: user.role },
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });

		if (!user || !(await user.comparePassword(password))) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		return res.status(200).json({
			token: createToken(user._id, user.role),
			user: { id: user._id, name: user.name, email: user.email, role: user.role },
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const me = async (req, res) => {
	return res.status(200).json({ user: req.user });
};

const createListing = async (req, res) => {
	try {
		const { title, company, location, stipend, durationWeeks, description, skills, mode } = req.body;
		if (!title || !company || !description || !skills) {
			return res.status(400).json({ message: 'title, company, description and skills are required' });
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

		return res.status(201).json({ message: 'Internship listing created', listing });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const getListings = async (req, res) => {
	try {
		const filter = req.user.role === 'recruiter' ? { recruiter: req.user._id } : { isActive: true };
		const listings = await Listing.find(filter).sort({ createdAt: -1 });
		return res.status(200).json({ listings });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const getPublicListings = async (req, res) => {
	try {
		const listings = await Listing.find({ isActive: { $ne: false } }).sort({ createdAt: -1 });
		return res.status(200).json({ listings });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const getListingById = async (req, res) => {
	try {
		const listing = await Listing.findById(req.params.listingId);
		if (!listing) {
			return res.status(404).json({ message: 'Listing not found' });
		}
		return res.status(200).json({ listing });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const applyToListing = async (req, res) => {
	try {
		const { listingId, notes } = req.body;
		const profile = await Profile.findOne({ user: req.user._id });
		if (!profile || (!profile.resumeText && (!profile.uploads || profile.uploads.length === 0))) {
			return res.status(400).json({ message: 'Upload a resume before applying' });
		}
		const listing = await Listing.findById(listingId);
		if (!listing) {
			return res.status(404).json({ message: 'Listing not found' });
		}

		const existing = await Application.findOne({ student: req.user._id, listing: listingId });
		if (existing) {
			return res.status(409).json({ message: 'Already applied to this internship' });
		}

		const application = await Application.create({
			student: req.user._id,
			listing: listingId,
			status: 'pending',
			notes,
		});

		return res.status(201).json({ message: 'Application submitted', application });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const getMyApplications = async (req, res) => {
	try {
		const applications = await Application.find({ student: req.user._id })
			.populate('listing')
			.sort({ createdAt: -1 });
		return res.status(200).json({ applications });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const getRecruiterApplications = async (req, res) => {
	try {
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

		return res.status(200).json({ applications: enrichedApplications });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const updateApplicationStatus = async (req, res) => {
	try {
		const { applicationId } = req.params;
		const { status } = req.body;
		if (!['accepted', 'rejected', 'pending'].includes(status)) {
			return res.status(400).json({ message: 'Status must be accepted, rejected, or pending' });
		}

		const application = await Application.findById(applicationId).populate('listing', 'recruiter');
		if (!application) {
			return res.status(404).json({ message: 'Application not found' });
		}

		if (String(application.listing.recruiter) !== String(req.user._id)) {
			return res.status(403).json({ message: 'Forbidden' });
		}

		application.status = status;
		await application.save();

		return res.status(200).json({ message: 'Application status updated', application });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const withdrawApplication = async (req, res) => {
	try {
		const { applicationId } = req.params;
		const application = await Application.findOne({ _id: applicationId, student: req.user._id });
		if (!application) {
			return res.status(404).json({ message: 'Application not found' });
		}
		if (application.status === 'accepted') {
			return res.status(400).json({ message: 'Accepted applications cannot be withdrawn' });
		}

		await Application.deleteOne({ _id: applicationId, student: req.user._id });
		return res.status(200).json({ message: 'Application withdrawn' });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const studentDashboard = async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user._id });
		const applications = await Application.find({ student: req.user._id }).populate('listing');
		return res.status(200).json({
			profile,
			recommendations: profile?.recommendations || [],
			applications,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const recruiterDashboard = async (req, res) => {
	try {
		const listings = await Listing.find({ recruiter: req.user._id }).sort({ createdAt: -1 });
		const listingIds = listings.map((l) => l._id);
		const applicationCount = await Application.countDocuments({ listing: { $in: listingIds } });

		return res.status(200).json({
			listings,
			stats: {
				totalListings: listings.length,
				totalApplications: applicationCount,
			},
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const uploadResumeAndRecommend = async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ message: 'Resume PDF is required' });

		// 1. Upload to Cloudinary (concurrently with PDF parsing)
		const [parsed, cloudinaryResult] = await Promise.all([
			pdfParse(req.file.buffer),
			uploadToCloudinary(req.file.buffer).catch(err => {
				console.error('Cloudinary upload failed:', err);
				return null; // Fallback if upload fails
			})
		]);

		const resumeText = parsed.text || '';
		const resumeUrl = cloudinaryResult?.secure_url || '';
		const resumePublicId = cloudinaryResult?.public_id || '';
		const resumeResourceType = cloudinaryResult?.resource_type || '';

		const listings = await Listing.find({ isActive: true }).lean();

		let recommendations;
		let aiWarning = null;
		if (process.env.GEMINI_API_KEY) {
			const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
			const prompt = `Given this student's profile: ${resumeText}\n\nRank these internships by fit and return ONLY a JSON array. Each item must include listingId, title, company, match_score (0-100), matched_skills (string[]), missing_skills (string[]). Listings JSON: ${JSON.stringify(listings)}`;
			const candidateModels = [
				process.env.GEMINI_MODEL,
				'gemini-2.0-flash',
				'gemini-1.5-flash-latest',
				'gemini-1.5-flash-8b',
			].filter(Boolean);

			let lastGeminiError = null;
			for (const modelName of candidateModels) {
				try {
					const model = genAI.getGenerativeModel({ model: modelName });
					const result = await model.generateContent(prompt);
					const text = result.response.text();
					recommendations = parseGeminiJson(text);
					break;
				} catch (error) {
					lastGeminiError = error;
				}
			}

			if (!recommendations) {
				aiWarning = lastGeminiError?.message || 'Gemini model unavailable, used fallback scoring.';
				recommendations = fallbackRecommendation(resumeText, listings);
			}
		} else {
			recommendations = fallbackRecommendation(resumeText, listings);
		}

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

		return res.status(200).json({
			message: aiWarning
				? 'Resume processed with fallback scoring (Gemini unavailable)'
				: 'Resume processed and recommendations generated',
			aiWarning,
			profile,
			recommendations,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const getProfile = async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user._id });
		return res.status(200).json({
			profile,
			user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const updateProfile = async (req, res) => {
	try {
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

		return res.status(200).json({
			message: 'Profile updated',
			profile,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const deleteProfileUpload = async (req, res) => {
	try {
		const { uploadId } = req.params;
		const profile = await Profile.findOne({ user: req.user._id });
		if (!profile) return res.status(404).json({ message: 'Profile not found' });

		const upload = (profile.uploads || []).find((item) => String(item._id) === String(uploadId));
		if (!upload) return res.status(404).json({ message: 'Upload not found' });

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

		const updatedProfile = await Profile.findOneAndUpdate(
			{ user: req.user._id },
			update,
			{ returnDocument: 'after' }
		);

		return res.status(200).json({ message: 'Resume removed', profile: updatedProfile });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const recommendFromProfile = async (req, res) => {
	try {
		const { filename } = req.body;
		const profile = await Profile.findOne({ user: req.user._id });
		if (!profile) return res.status(404).json({ message: 'Profile not found' });

		let resumeText = profile.resumeText || '';
		let resumeUrl = profile.resumeUrl || '';

		if (filename && Array.isArray(profile.uploads) && profile.uploads.length) {
			const found = profile.uploads.find((u) => u.filename === filename);
			if (found) {
				if (found.resumeText) resumeText = found.resumeText;
				if (found.resumeUrl) resumeUrl = found.resumeUrl;
			}
		}

		if (!resumeText) return res.status(400).json({ message: 'No resume text available to reparse' });

		const listings = await Listing.find({ isActive: true }).lean();

		let recommendations;
		let aiWarning = null;
		if (process.env.GEMINI_API_KEY) {
			const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
			const prompt = `Given this student's profile: ${resumeText}\n\nRank these internships by fit and return ONLY a JSON array. Each item must include listingId, title, company, match_score (0-100), matched_skills (string[]), missing_skills (string[]). Listings JSON: ${JSON.stringify(listings)}`;
			const candidateModels = [
				process.env.GEMINI_MODEL,
				'gemini-2.0-flash',
				'gemini-1.5-flash-latest',
				'gemini-1.5-flash-8b',
			].filter(Boolean);

			let lastGeminiError = null;
			for (const modelName of candidateModels) {
				try {
					const model = genAI.getGenerativeModel({ model: modelName });
					const result = await model.generateContent(prompt);
					const text = result.response.text();
					recommendations = parseGeminiJson(text);
					break;
				} catch (error) {
					lastGeminiError = error;
				}
			}

			if (!recommendations) {
				aiWarning = lastGeminiError?.message || 'Gemini model unavailable, used fallback scoring.';
				recommendations = fallbackRecommendation(resumeText, listings);
			}
		} else {
			recommendations = fallbackRecommendation(resumeText, listings);
		}

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

		return res.status(200).json({
			message: 'Reparsed resume and refreshed recommendations',
			aiWarning,
			profile: updated,
			recommendations,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

module.exports = {
	register,
	login,
	me,
	createListing,
	getListings,
	getPublicListings,
	getListingById,
	applyToListing,
	getMyApplications,
	getRecruiterApplications,
	updateApplicationStatus,
	withdrawApplication,
	studentDashboard,
	recruiterDashboard,
	uploadResumeAndRecommend,
	recommendFromProfile,
	getProfile,
	updateProfile,
	deleteProfileUpload,
};
