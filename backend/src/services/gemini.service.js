const { GoogleGenerativeAI } = require('@google/generative-ai');

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
      const listingSkills = (listing.skills || []).map((s) => s.toLowerCase());
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

const normalizeRecommendations = (items, listings) => {
  const listingMap = new Map(listings.map((listing) => [String(listing._id), listing]));

  return (items || [])
    .map((item) => {
      const listingId = item?.listingId || item?.listing_id || '';
      const listing = listingMap.get(String(listingId)) || {};
      const matchedSkills = Array.isArray(item?.matched_skills) ? item.matched_skills : [];
      const missingSkills = Array.isArray(item?.missing_skills) ? item.missing_skills : [];

      const matchScore = Number.isFinite(Number(item?.match_score))
        ? Number(item.match_score)
        : 0;

      return {
        listingId: listingId || listing._id,
        title: item?.title || listing.title || '',
        company: item?.company || listing.company || '',
        match_score: missingSkills.length === 0 ? 100 : matchScore,
        matched_skills: matchedSkills,
        missing_skills: missingSkills,
      };
    })
    .filter((item) => item.listingId)
    .sort((a, b) => b.match_score - a.match_score);
};

const buildPrompt = (resumeText, listings) => `Given this student's profile: ${resumeText}\n\nRank these internships by fit and return ONLY a JSON array. Each item must include listingId, title, company, match_score (0-100), matched_skills (string[]), missing_skills (string[]).\n\nCRITICAL: If the student has ALL the skills required for an internship (missing_skills is empty), the match_score MUST be 100. Do not penalize for lack of experience or other factors if the primary skills match.\n\nListings JSON: ${JSON.stringify(listings)}`;

const generateRecommendations = async ({ resumeText, listings, geminiApiKey, modelOverride }) => {
  let recommendations;
  let aiWarning = null;

  if (geminiApiKey) {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const prompt = buildPrompt(resumeText, listings);
    const candidateModels = [
      modelOverride,
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

  return {
    recommendations: normalizeRecommendations(recommendations, listings),
    aiWarning,
  };
};

module.exports = {
  generateRecommendations,
  extractSkills,
};
