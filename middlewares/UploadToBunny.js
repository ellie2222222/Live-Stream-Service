const axios = require('axios');
const stream = require('stream');
require('dotenv').config();

const uploadToBunny = async (file) => {
    try {
        const zoneName = process.env.BUNNYCDN_STORAGE_ZONE_NAME;
        const password = process.env.BUNNYCDN_STORAGE_PASSWORD;
        const storageUrl = process.env.BUNNY_STORAGE_URL;
        const cdn = process.env.BUNNY_STORAGE_CDN;

        const fileStream = new stream.PassThrough();
        fileStream.end(file.buffer);

        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.originalname}`; 

        // Tạo URL tải lên
        const uploadUrl = `https://${storageUrl}/${zoneName}/${fileName}`;
        console.log(uploadUrl)
        // Thực hiện yêu cầu tải lên
        const response = await axios.put(uploadUrl, fileStream, {
            headers: {
                'Content-Type': file.mimetype,
                'AccessKey': password,
            }
        });
        console.log(`https://${cdn}/${fileName}`)
        return `https://${cdn}/${fileName}`;
    } catch (error) {
        console.error('Error uploading file:', error.message);
        throw error; // Để xử lý lỗi ở nơi gọi hàm
    }
};

const deleteFromBunny = async (fileUrl) => {
    try {
        // if (typeof fileUrl !== 'string') {
        //     throw new Error('Invalid file URL');
        // }
        
        const fileName = fileUrl.split('/').pop();
        const zoneName = process.env.BUNNYCDN_STORAGE_ZONE_NAME;
        const password = process.env.BUNNYCDN_STORAGE_PASSWORD;
        const storageUrl = process.env.BUNNY_STORAGE_URL;

        const deleteUrl = `https://${storageUrl}/${zoneName}/${fileName}`;

        await axios.delete(deleteUrl, {
            headers: {
                'AccessKey': password,
            }
        });

    } catch (error) {
        console.error('Error deleting file:', error.message);
        throw error;
    }
};

module.exports = {
    uploadToBunny,
    deleteFromBunny
};