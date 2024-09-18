const { findUser, updateUserProfile, deactivateUser, findAllUsers } = require("../services/UserService");
const { uploadToBunny, deleteFromBunny} = require('../middlewares/uploadToBunny');

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

    // get all users
    async getUsers(req, res) {
        try {
            const user = await findAllUsers();

            res.status(200).json({ data: user, message: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // update a user
    async updateUser(req, res) {
        const { name, bio, isActive} = req.body;
        const img = req.file ? req.file : null;
        const userId = req.userId;

        try {
            const user = await updateUserProfile(userId, {});
            const currentAvatarUrl = user.avatarUrl;

            console.log('Current Avatar URL:', currentAvatarUrl);

            let newAvatarUrl = currentAvatarUrl;

            if(img) {
                if (currentAvatarUrl) {
                    await deleteFromBunny(currentAvatarUrl);
                }
                newAvatarUrl = await uploadToBunny(img);
                console.log('New Avatar URL:', newAvatarUrl);
            }

            const updateData = { 
                name, 
                bio, 
                avatarUrl: newAvatarUrl, 
                isActive 
            };
            
            const updatedUser = await updateUserProfile(userId, updateData);
            res.status(200).json({ data: updatedUser, message: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

     // update a user
     async updateUser(req, res) {
        const { name, bio, isActive} = req.body;
        const img = req.file ? req.file : null;
        const userId = req.userId;

        try {
            const user = await updateUserProfile(userId, {});
            const currentAvatarUrl = user.avatarUrl;

            console.log('Current Avatar URL:', currentAvatarUrl);

            let newAvatarUrl = currentAvatarUrl;

            if(img) {
                if (currentAvatarUrl) {
                    await deleteFromBunny(currentAvatarUrl);
                }
                newAvatarUrl = await uploadToBunny(img);
                console.log('New Avatar URL:', newAvatarUrl);
            }

            const updateData = { 
                name, 
                bio, 
                avatarUrl: newAvatarUrl, 
                isActive 
            };
            
            const updatedUser = await updateUserProfile(userId, updateData);
            res.status(200).json({ data: updatedUser, message: "Success" });
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