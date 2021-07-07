require('dotenv').config();
const express = require('express');

const logger = require('./logger');
const connectDB = require('./connection');
// Modules
const FileServer = require('./modules/fileServer');

// eslint-disable-next-line no-undef
const PORT = process.env.PORT;

async function main() {
    try {
        const app = express();

        // setup
        app.use(express.json({ limit: '50mb' }));
        app.use(express.urlencoded({ extended: true }));
        // mongodb setup   
        const db = await connectDB(logger);

        // modules
        const fileServer = new FileServer(logger, db, app);
        await fileServer.init()

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            logger.info(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to setup server", error);
        logger.error(`Failed to setup server ${error}`)
    }
}


// eslint-disable-next-line no-undef
process.on('exit', () => logger.info(`Exiting...`));
// eslint-disable-next-line no-undef
process.on('SIGINT', () => {
    logger.info(`Server is going for shutdown...`);
    // eslint-disable-next-line no-undef
    process.exit();
});
// eslint-disable-next-line no-undef
process.on('uncaughtException', (error) => {
    try {
        logger.error('UncaughtException: ', error.message);
        logger.error(error.stack);
    }
    catch (e) {
        console.log("Uncaught Exception: ", error.message);
        console.log(error.stack);
    }
});

main();