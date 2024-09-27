const bcrypt = require("bcrypt");
const validator = require("validator");
const mongoose = require("mongoose");
const DatabaseTransaction = require("../repositories/DatabaseTransaction");
const {
  uploadToBunny,
  deleteFromBunny,
} = require("../middlewares/UploadToBunny");

// Sign up a new user
const signup = async (name, email, password, bio, img) => {
  let avatarUrl = null;

  try {
    const connection = new DatabaseTransaction();

    if (!validator.isEmail(email)) {
      throw new Error("Invalid email address");
    }

    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      throw new Error("Password is not strong enough");
    }

    const existingUser = await connection.userRepository.findUserByEmail(email);
    if (existingUser) {
      throw new Error("Email is already in use");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (img) {
      avatarUrl = await uploadToBunny(img);
    }

    const user = await connection.userRepository.createUser({
      name,
      email,
      password: hashedPassword,
      bio,
      avatarUrl,
    });

    return user;
  } catch (error) {
    await deleteFromBunny(avatarUrl);
    throw new Error(error.message);
  }
};

// Log in a user
const login = async (email, password) => {
  try {
    const connection = new DatabaseTransaction();

    if (!validator.isEmail(email)) {
      throw new Error("Invalid email address");
    }

    const user = await connection.userRepository.findUserByEmail(email);
    if (user.isActive === false) {
      throw new Error("User account is deactivated! Cannot login");
    }
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Incorrect password");
    }

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

const findUser = async (userId) => {
  try {
    const connection = new DatabaseTransaction();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await connection.userRepository.findUserById(userId);

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

const findAllUsers = async (searchQuery, limit, page) => {
  let user;
  try {
    const connection = new DatabaseTransaction();

    if (!searchQuery || !limit || !page)
      user = await connection.userRepository.findAllActiveUsers();
    else
      user = await connection.userRepository.Search(searchQuery, page, limit);
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateUserProfile = async (userId, updateData) => {
  try {
    const connection = new DatabaseTransaction();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await connection.userRepository.updateUser(userId, updateData);

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

const deactivateUser = async (userId) => {
  try {
    const connection = new DatabaseTransaction();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await connection.userRepository.deactivateUser(userId);

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};
const getTopXLiked = async (x) => {
  const connection = new DatabaseTransaction();
  const limit = x || 10;
  try {
    const topX = await connection.userRepository.getTopUsersByLikes(limit);
    console.log(topX.length);
    return topX;
  } catch (error) {
    throw new Error(error.message);
  }
};
const getUserTotalLike = async (userId) => {
  console.log("services");
  const connection = new DatabaseTransaction();
  try {
    const total = await connection.userRepository.getUserTotalLikes(userId);
    return total;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  login,
  signup,
  findUser,
  findAllUsers,
  updateUserProfile,
  deactivateUser,
  getTopXLiked,
  getUserTotalLike,
};
