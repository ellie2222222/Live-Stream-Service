const bcrypt = require("bcrypt");
const validator = require("validator");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const DatabaseTransaction = require("../repositories/DatabaseTransaction");
const {
  uploadToBunny,
  deleteFromBunny,
} = require("../middlewares/UploadToBunny");
const mailer = require("../utils/mailer");
const { text } = require("express");

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

const sendVerificationEmail = async (email) => {
  try {
    const connection = new DatabaseTransaction();

    const user = await connection.userRepository.findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.verify === true) {
      throw new Error("Email is already verified");
    }

    const salt = 10;
    const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.EMAIL_VERIFICATION_EXPIRE || "24h",
    });

    user.verifyToken = token;
    await user.save();

    const mailBody = `
      <div style="width: 40vw;">
  <table>
    <tr>
      <td>
        <img src="https://amazingtech.vn/Content/amazingtech/assets/img/logo-color.png" width="350" alt="Logo" />
      </td>
    </tr>
    <tr>
      <td>
        <p>
          Thank you for signing up for the live stream application. Please click the link below to fully access our app & activate your account.
        </p>
      </td>
    </tr>
    <tr>
      <td>
        <a href="http://localhost:4000/api/auth/verify?token=${token}">Click here to verify your email</a>
      </td>
    </tr>
    <tr>
      <td>
        <p style="color: grey;">Please check your spam folder if you don't see the email immediately</p>
      </td>
    </tr>
  </table>
</div>
    `;
    mailer.sendMail(
      email,
      "Verify your email",
      "Click the link below to verify your email",
      mailBody
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const verifyUserEmail = async (token, res) => {
  const successUrl = "http://localhost:5173/verify/success";
  const failUrl = "http://localhost:5173/verify/fail";

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const email = decodedToken.email;

    const connection = new DatabaseTransaction();
    const user = await connection.userRepository.findUserByEmail(email);
    if (!user || user.verifyToken !== token) {
      res.redirect(failUrl);
      throw new Error("Invalid token");
    }

    user.verify = true;
    user.verifyToken = null;
    await user.save();
    res.redirect(successUrl);
  } catch (error) {
    res.redirect(failUrl);
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
  let userResponse;
  try {
    const connection = new DatabaseTransaction();

    if (!searchQuery || !limit || !page) {
      // Case when there's no search query (returns all active users)
      userResponse = await connection.userRepository.findAllActiveUsers();

      return {
        data: userResponse, // Normalize the structure here
        message: "Success",
        total: userResponse.length, // Total number of active users
      };
    } else {
      // Case when there's a search query (uses pagination and search)
      userResponse = await connection.userRepository.Search(
        searchQuery,
        limit,
        page
      );

      return {
        data: userResponse.data, // Normalize the structure here
        message: userResponse.message,
        total: userResponse.total,
        totalPages: userResponse.totalPages,
        page: userResponse.page,
      };
    }
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
const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const connection = new DatabaseTransaction();
    const user = await connection.userRepository.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (oldPassword === newPassword) {
      throw new Error("New password cannot be the same as old password");
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new Error("Incorrect old password");
    }
    if (
      !validator.isStrongPassword(newPassword, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      throw new Error("New password is not strong enough");
    }
    const salt = 10;
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await connection.userRepository.changePassword(userId, hashedPassword);
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

const generateResetPasswordToken = async (email) => {
  try {
    const connection = new DatabaseTransaction();
    const user = await connection.userRepository.findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }
    const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.PASSWORD_RESET_TOKEN_EXPIRE || "1h",
    });
    user.passwordResetToken = token;
    await user.save();
    const mailBody = `
    <div style="width: 40vw;">
<table>
  <tr>
    <td>
      <img src="https://amazingtech.vn/Content/amazingtech/assets/img/logo-color.png" width="350" alt="Logo" />
    </td>
  </tr>
  <tr>
    <td>
      <p>
        You have requested to reset your password, click the link below to reset your password. And please note that your link <strong>will be expired in 1 hour</strong> for security reasons.
      </p>
    </td>
  </tr>
  <tr>
    <td>
      <a href="http://localhost:5173/reset-password/${token}">Click here to reset your password</a>
    </td>
  </tr> 
  <tr>
    <td>
      <p style="color: grey;">Please check your spam folder if you don't see the email immediately</p>
    </td>
  </tr>
</table>
</div>
  `;
    mailer.sendMail(
      email,
      "Reset your password",
      "Click the link below to reset your password",
      mailBody
    );
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

const resetPassword = async (token, newPassword) => {
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const email = decodedToken.email;

    const connection = new DatabaseTransaction();
    const user = await connection.userRepository.findUserByEmail(email);

    if (!user || user.passwordResetToken !== token) {
      throw new Error("Invalid token");
    }

    const salt = 10;
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.passwordResetToken = null;
    await user.save();

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
  sendVerificationEmail,
  verifyUserEmail,
  generateResetPasswordToken,
  resetPassword,
  changePassword,
  findUser,
  findAllUsers,
  updateUserProfile,
  deactivateUser,
  getTopXLiked,
  getUserTotalLike,
};
