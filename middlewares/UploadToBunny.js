const axios = require('axios');
const stream = require('stream');
require('dotenv').config();

const uploadToBunny = async (file) => {
    try {
        const zoneName = process.env.BUNNY_STORAGE_ZONE_NAME;
        const password = process.env.BUNNY_STORAGE_PASSWORD;
        const storageUrl = process.env.BUNNY_STORAGE_URL;
        const cdn = process.env.BUNNY_STORAGE_CDN;

        // Đọc tệp từ đối tượng file (Buffer)
        const fileStream = new stream.PassThrough();
        fileStream.end(file.buffer); // file.buffer chứa nội dung của tệp

        const fileName = file.originalname;

        // Tạo URL tải lên
        const uploadUrl = `https://${storageUrl}/${zoneName}/${fileName}`;

        // Thực hiện yêu cầu tải lên
        const response = await axios.put(uploadUrl, fileStream, {
            headers: {
                'Content-Type': file.mimetype,
                'AccessKey': password, // Sử dụng AccessKey trong header
            }
        });

        return `https://${cdn}/${fileName}`;
    } catch (error) {
        console.error('Error uploading file:', error.message);
        throw error; // Để xử lý lỗi ở nơi gọi hàm
    }
};

const deleteFromBunny = async (fileUrl) => {
    try {
        const fileName = fileUrl.split('/').pop();
        const zoneName = process.env.BUNNY_STORAGE_ZONE_NAME;
        const password = process.env.BUNNY_STORAGE_PASSWORD;
        const storageUrl = process.env.BUNNY_STORAGE_URL;
        const cdn = process.env.BUNNY_STORAGE_CDN;

        const deleteUrl = `https://${storageUrl}/${zoneName}/${fileName}`;

        await axios.delete(deleteUrl, {
            headers: {
                'AccessKey': password,
            }
        });

        return `https://${cdn}/${fileName}`;
    } catch (error) {
        console.error('Error deleting file:', error.message);
        throw error;
    }
};

module.exports = uploadToBunny;
module.exports = deleteFromBunny;
