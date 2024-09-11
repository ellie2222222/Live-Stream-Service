const { findUser, updateUserProfile, deactivateUser } = require("../services/UserService");

class UserController {
    // get a user
    async getUser(req, res) {
        const { userId } = req.params;

        try {
            const user = await findUser(userId);

            res.status(200).json({ data: user, message: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // update a user
    async updateUser(req, res) {
        const { userId } = req.params;
        const { username, bio, avatarUrl} = req.body;
        const updateData = { username, bio, avatarUrl }

        try {
            const user = await updateUserProfile(userId, updateData);

            res.status(200).json({ data: user, message: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    async deleteUser(req, res) {
        const { userId } = req.params;

        try {
            await deactivateUser(userId);

            res.status(200).json({ message: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = UserController;