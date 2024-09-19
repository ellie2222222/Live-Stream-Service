const multer = require('multer');
const path = require('path');
const uploadToBunny = require('./UploadToBunny');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'avatar') {
        const filetypes = /\.(svg|jpg|jpeg|png)$/i;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only accept image file of type svg, jpg, jpeg, or png'));
        }
    } else {
        return cb(new Error('Unaccceptable file type'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10000000 } // 10MB
});

module.exports = upload;