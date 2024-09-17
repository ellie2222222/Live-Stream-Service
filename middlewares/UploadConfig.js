const multer = require('multer');
const path = require('path');
const uploadToBunny = require('./uploadToBunny');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'img') {
        const filetypes = /\.(svg|jpg|jpeg|png)$/i;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh svg, jpg, jpeg, hoặc png'));
        }
    } else {
        return cb(new Error('Loại tệp không được chấp nhận'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10000000 } // 10MB
});

module.exports = upload;
