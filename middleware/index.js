const multer = require('multer');
const { nanoid } = require('nanoid');

/**
 * @param {object} options - Arguments
 * @param {string} options.dirPath - Directory path where to save the uploaded file
 * @param {string} [options.fieldName=file] - fieldname of the file in form.
 * @param {number} [options.sizeLimit=5] - max size of the file. Defaults to 5 MB(MB)
 * @returns a multer object
 */
const uploadSingleMiddleware = ({ dirPath, fieldName = 'file', sizeLimit = 5 }) => {
    const upload = multer({
        storage: multer.diskStorage({
            destination: dirPath,
            filename: (req, file, cb) => cb(null, `${nanoid()}${file.originalname}`)
        }),
        limits: {
            fileSize: 1000 * 1000 * sizeLimit
        },
    });

    const uploadMW = upload.single(fieldName);

    return (req, res, next) => {
        uploadMW(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).send(`File size exceeded ${sizeLimit}MB`);
                }
                return res.status(400).send(`Something went while uploading`);
            } else if (err) {
                return res.status(400).send(`Something went while uploading`);
            }
            next();
        })
    }
}


module.exports = {
    uploadSingleMiddleware
}