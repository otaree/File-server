const fs = require('fs');
const path = require('path');
const cors = require('cors');

const { uploadSingleMiddleware } = require('../../middleware');

// eslint-disable-next-line no-undef
const isHTTPS = typeof process.env.isHTTPS === "boolean" ? process.env.isHTTPS : false;

// checks if upload dir is there or not. If not, It will create the dir.
// eslint-disable-next-line no-undef
const uploadDirPath = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDirPath)) {
    fs.mkdirSync(uploadDirPath);
}

/**
 * A FileServer class
 */
class FileServer {
    /**
     * @param {object} logger - A Logger instance 
     * @param {object} db - A mongodb DB instance
     * @param {object} app - A Express app object 
     */
    constructor(logger, db, app) {
        this.logger = logger;
        this.db = db;
        this.app = app;
        this.collectionName = "Files";
    }

    /**
     * @description Class init method
     */
    async init() {
        this.initAPIs();
    }

    /**
     * @description Initialize all the APIs in the common inbox
     */
    initAPIs() {
        this.app.post(
            '/upload',
            // cors({
            //     origin: [/example\.com$/]
            // }),
            cors(),
            uploadSingleMiddleware({ dirPath: uploadDirPath, sizeLimit: 5 }),
            this.fileUpload.bind(this)
        );

        this.app.post(
            '/:dirname/upload',
            // cors({
            //     origin: [/example\.com$/]
            // }),
            cors(),
            uploadSingleMiddleware({ dirPath: uploadDirPath, sizeLimit: 5 }),
            this.fileUpload.bind(this)
        );


        this.app.get(
            '/:dirname/:filename',
            cors(),
            this.fileServeByDir.bind(this)
        );

        this.app.get(
            '/:filename',
            cors(),
            this.fileServe.bind(this)
        );

    }

    /**
     * @description Uploads a file
     * @param {object} req - A Express Request object. 
     * @param {object} res - A Express Response object. 
     * @returns 
     */
    async fileUpload(req, res) {
        try {
            if (!req.file) return res.status(400).send(`Please provide a file.`);
            let attachment = false;

            if (req.body.attachment && req.body.attachment === "true") {
                attachment = true;
            }

            const todayDate = new Date().toISOString();

            const protocol = isHTTPS ? 'https://' : 'http://';
            const { originalname, encoding, mimetype, filename, size } = req.file;

            const body = {
                originalname,
                encoding,
                mimetype,
                filename,
                size,
                attachment,
                createdOn: todayDate
            }

            if (req.params.dirname) {
                body["dir"] = req.params.dirname;
            }

            if (req.body.additionalInformation && typeof req.body.additionalInformation === "object" && Object.keys(req.body.additionalInformation).length > 0) {
                body["additionalInformation"] = req.body.additionalInformation;
            }
            
            const insertedInfo = await this.db.collection(this.collectionName).insertOne(body);

            if (insertedInfo.insertedCount === 0) throw new Error('Failed to insert document in ' + this.collectionName);

            let fileURI = ``;
            if (req.params.dirname) {
                fileURI = `${protocol}${req.headers.host}/${req.params.dirname}/${filename}`;
            } else {
                fileURI = `${protocol}${req.headers.host}/${filename}`;
            }
            res.send({ url: fileURI });
        } catch (error) {
            console.error("ERROR:::", error);
            this.logger.error(`Failed to upload a file ${error}`);
            res.status(500).send("Something went wrong in the server.")
        }
    }

    // /**
    //  * @description Serves a file
    //  * @param {object} req - A Express Request object. 
    //  * @param {object} res - A Express Response object. 
    //  * @returns 
    //  */
    // async fileServe(req, res) {
    //     try {
    //         const endpoints = req.url.split("/").filter(el => el);
    //         const dirPathArr = endpoints.slice(0, endpoints.length - 1);
    //         const filename = endpoints[endpoints.length - 1];
    //         if (!filename) return res.sendStatus(404);
    //         const query = { filename };
    //         if (Array.isArray(dirPathArr) && dirPathArr.length > 0) {
    //             query["dirPath"] = dirPathArr.join("/");
    //         }
    //         console.log(query);
    //         const file = await this.db.collection(this.collectionName).findOne(query);
    //         if (!file) return res.sendStatus(404);
    //         const headers = {
    //             'Content-Type': file.mimetype,
    //             'Content-Length': file.size
    //         }

    //         if (file.attachment) {
    //             headers['Content-Disposition'] = `attachment; filename=${file.originalname}`;
    //         }

    //         res.set(headers);
    //         const fileStream = fs.createReadStream(path.join(uploadDirPath, filename))
    //         fileStream.pipe(res);
    //     } catch (error) {
    //         this.logger.error(`Failed to serve a file ${error}`);
    //         res.status(500).send("Something went wrong in the server.")
    //     }
    // }


    /**
     * @description Serves a file
     * @param {object} req - A Express Request object. 
     * @param {object} res - A Express Response object. 
     * @returns 
     */
    async fileServeByDir(req, res) {
        try {
            const { filename, dirname } = req.params;
            const file = await this.db.collection(this.collectionName).findOne({ filename, dir: dirname });
            if (!file) return res.sendStatus(404);
            const headers = {
                'Content-Type': file.mimetype,
                'Content-Length': file.size
            }

            if (file.attachment) {
                headers['Content-Disposition'] = `attachment; filename=${file.originalname}`;
            }

            res.set(headers);
            const fileStream = fs.createReadStream(path.join(uploadDirPath, dirname, filename))
            fileStream.pipe(res);
        } catch (error) {
            this.logger.error(`Failed to serve a file ${error}`);
            res.status(500).send("Something went wrong in the server.")
        }
    }

    /**
     * @description Serves a file
     * @param {object} req - A Express Request object. 
     * @param {object} res - A Express Response object. 
     * @returns 
     */
    async fileServe(req, res) {
        try {
            const { filename } = req.params;
            const file = await this.db.collection(this.collectionName).findOne({ filename });
            if (!file) return res.sendStatus(404);
            const headers = {
                'Content-Type': file.mimetype,
                'Content-Length': file.size
            }

            if (file.attachment) {
                headers['Content-Disposition'] = `attachment; filename=${file.originalname}`;
            }

            res.set(headers);
            const fileStream = fs.createReadStream(path.join(uploadDirPath, filename))
            fileStream.pipe(res);
        } catch (error) {
            this.logger.error(`Failed to serve a file ${error}`);
            res.status(500).send("Something went wrong in the server.")
        }
    }

    // /**
    //  * @description Serves a file
    //  * @param {object} req - A Express Request object. 
    //  * @param {object} res - A Express Response object. 
    //  * @returns 
    //  */
    // async fileServe(req, res) {
    //     try {
    //         console.log(req.url)
    //         const { filename } = req.params;
    //         const file = await this.db.collection(this.collectionName).findOne({ filename });
    //         if (!file) return res.sendStatus(404);
    //         const headers = {
    //             'Content-Type': file.mimetype,
    //             'Content-Length': file.size
    //         }

    //         if (file.attachment) {
    //             headers['Content-Disposition'] = `attachment; filename=${file.originalname}`;
    //         }

    //         res.set(headers);
    //         const fileStream = fs.createReadStream(path.join(uploadDirPath, filename))
    //         fileStream.pipe(res);
    //     } catch (error) {
    //         this.logger.error(`Failed to serve a file ${error}`);
    //         res.status(500).send("Something went wrong in the server.")
    //     }
    // }
}


module.exports = FileServer;