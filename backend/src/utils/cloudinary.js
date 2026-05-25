const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'internsetu_resumes' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const getPublicIdFromUrl = (url) => {
  if (!url) return '';
  try {
    const cleanUrl = String(url).split('?')[0];
    const uploadIdx = cleanUrl.indexOf('/upload/');
    if (uploadIdx === -1) return '';
    const afterUpload = cleanUrl.slice(uploadIdx + '/upload/'.length);
    const parts = afterUpload.split('/');
    const lastParts = parts.slice(1).join('/');
    const trimmed = lastParts.replace(/\.[^/.]+$/, '');
    return trimmed;
  } catch (error) {
    return '';
  }
};

const deleteFromCloudinary = async (publicId, resourceType) => {
  if (!publicId) return null;

  const tryTypes = resourceType ? [resourceType] : ['raw', 'image', 'video'];
  let lastResult = null;

  for (const type of tryTypes) {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: type });
    lastResult = result;
    if (result?.result === 'ok' || result?.result === 'not found') {
      break;
    }
  }

  return lastResult;
};

module.exports = { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl };
