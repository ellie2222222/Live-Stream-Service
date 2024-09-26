const bcrypt = require("bcrypt");
const validator = require("validator");
const mongoose = require("mongoose");
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
    const salt = 10;

    bcrypt.hash(email, salt).then((hashEmail) => {
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
        <a href="http://localhost:4000/api/auth/verify?email=${email}&token=${hashEmail}">Click here to verify your email</a>
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
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const verifyUserEmail = async (email, token, res) => {
  const successUrl = "http://localhost:5173/verify/success";
  const failUrl = "http://localhost:5173/verify/fail";
  const isVerified = await bcrypt.compare(email, token);
  try {
    if (!isVerified) {
      res.redirect(failUrl);
      throw new Error("Invalid verification token");
    }

    const connection = new DatabaseTransaction();
    try {
      await connection.startTransaction();
      const user = await connection.userRepository.findUserByEmail(email);
      if (!user) {
        res.redirect(failUrl);
        throw new Error("User not found");
      }
      await connection.userRepository.verifyUserEmail(email);
      await connection.commitTransaction();
      res.redirect(successUrl);
    } catch (error) {
      await connection.abortTransaction();
      res.redirect(failUrl);
      throw new Error(error.message);
    }
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

const findAllUsers = async (userId) => {
  try {
    const connection = new DatabaseTransaction();

    const user = await connection.userRepository.findAllActiveUsers();

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

module.exports = {
  login,
  signup,
  sendVerificationEmail,
  verifyUserEmail,
  findUser,
  findAllUsers,
  updateUserProfile,
  deactivateUser,
};
