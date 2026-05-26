const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { ApiError } = require('../utils/apiError');
const { apiResponse } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const createToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || 'dev_jwt_secret_change_me', {
    expiresIn: '30d',
  });

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role === 'recruiter' ? 'recruiter' : 'student',
  });

  return apiResponse(res, {
    status: 201,
    message: 'User registered successfully',
    data: {
      token: createToken(user._id, user.role),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return apiResponse(res, {
    status: 200,
    data: {
      token: createToken(user._id, user.role),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
});

const me = asyncHandler(async (req, res) => {
  return apiResponse(res, { status: 200, data: { user: req.user } });
});

module.exports = { register, login, me };
