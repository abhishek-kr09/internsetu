const pdfParse = require('pdf-parse');

const parseResumeBuffer = async (buffer) => {
  const parsed = await pdfParse(buffer);
  return parsed.text || '';
};

module.exports = { parseResumeBuffer };
