const bcrypt = require('bcrypt');
const validator = require('validator');
const DatabaseTransaction = require('../repositories/DatabaseTransaction');

// Sign up a new user
const signup = async (username, email, password) => {
    const transaction = new DatabaseTransaction();
    await transaction.startTransaction();

    try {
        if (!validator.isEmail(email)) {
            throw new Error('Invalid email address');
        }

        if (!validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        })) {
            throw new Error('Password is not strong enough');
        }

        const existingUser = await transaction.userRepository.findUserByEmail(email);
        if (existingUser) {
            throw new Error('Email is already in use');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await transaction.userRepository.createUser({
            username,
            email,
            password: hashedPassword
        });


        await transaction.commitTransaction();
        return user;
    } catch (error) {
        await transaction.abortTransaction();
        throw new Error(error.message);
    }
}

// Log in a user
const login = async (email, password) => {
    // const transaction = new DatabaseTransaction();
    // await transaction.startTransaction();

    try {
        if (!validator.isEmail(email)) {
            throw new Error('Invalid email address');
        }

        const transaction = new DatabaseTransaction();
        const user = await transaction.userRepository.findUserByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Incorrect password');
        }

        return user;
    } catch (error) {
        // await transaction.abortTransaction();
        throw new Error(error.message);
    }
}

module.exports = {
    login,
    signup,
};
