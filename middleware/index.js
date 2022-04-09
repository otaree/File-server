const multer = require('multer');
const { nanoid } = require('nanoid');
const slugify = require('slugify');
const { join } = require("path");
const fsPromises = require("fs/promises");

async function pathExists(path) {
    try {
        await fsPromises.access(path);
        return true;
    } catch (error) {
        return false;
    }
}
/**
 * @param {object} options - Arguments
 * @param {string} options.dirPath - Directory path where to save the uploaded file
 * @param {string} [options.fieldName=file] - fieldname of the file in form.
 * @param {number} [options.sizeLimit=5] - max size of the file. Defaults to 5 MB(MB)
 * @returns a multer object
 */
const uploadSingleMiddleware = ({ dirPath: uploadPath, fieldName = 'file', sizeLimit = 5 }) => {
    return async (req, res, next) => {
        let dirPath = uploadPath;
        console.log({ dirPath })
        if (req.params.dirname) {
            dirPath = join(dirPath, req.params.dirname);
            console.log("AFTER:::", { dirPath })
            const dirPathExists = await pathExists(dirPath);
            if (!dirPathExists) {
                await fsPromises.mkdir(dirPath);
            }
        }

        const upload = multer({
            storage: multer.diskStorage({
                destination: dirPath,
                filename: (req, file, cb) => cb(null, slugify(`${nanoid()}${file.originalname}`))
            }),
            limits: {
                fileSize: 1000 * 1000 * sizeLimit
            },
        });

        const uploadMW = upload.single(fieldName);

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