const { prisma } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Manually hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (enteredPassword, hashedPassword) => {
  return await bcrypt.compare(enteredPassword, hashedPassword);
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { username, email, name, password, role, page_access, firm_name } = req.body;
    const targetUsername = username || email || name;

    if (!targetUsername || !password) {
      res.status(400);
      throw new Error('Please provide username/email and password');
    }

    // Check if user exists
    const userExists = await prisma.login.findUnique({
      where: { username: targetUsername },
    });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(password);

    // Create user in the 'login' table
    const user = await prisma.login.create({
      data: {
        username: targetUsername,
        password: hashedPassword,
        role: role || 'user',
        page_access: page_access || null,
        firm_name: firm_name || '',
      },
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        id: user.id,
        username: user.username,
        name: user.username,
        email: user.username,
        role: user.role,
        page_access: user.page_access,
        firm_name: user.firm_name,
        token: generateToken(user.id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const targetUsername = username || email;

    if (!targetUsername || !password) {
      res.status(400);
      throw new Error('Please provide username/email and password');
    }

    // Check for user in the 'login' table
    const user = await prisma.login.findUnique({
      where: { username: targetUsername },
    });

    if (user && (await comparePassword(password, user.password))) {
      const updatedUser = await prisma.login.update({
        where: { id: user.id },
        data: { last_login: new Date() },
      });

      res.json({
        _id: updatedUser.id,
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.username,
        email: updatedUser.username,
        role: updatedUser.role,
        page_access: updatedUser.page_access,
        firm_name: updatedUser.firm_name,
        last_login: updatedUser.last_login,
        token: generateToken(updatedUser.id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email/username or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id, 10);
    if (isNaN(userId)) {
      res.status(400);
      throw new Error('Invalid user ID');
    }

    const user = await prisma.login.findUnique({
      where: { id: userId },
    });

    if (user) {
      res.json({
        _id: user.id,
        id: user.id,
        username: user.username,
        name: user.username,
        email: user.username,
        role: user.role,
        page_access: user.page_access,
        firm_name: user.firm_name,
        last_login: user.last_login,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
};
