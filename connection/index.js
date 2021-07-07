const { MongoClient } = require('mongodb');

async function connectDB(logger) {
    try {
        // eslint-disable-next-line no-undef
        const URI = process.env.MONGODB_URI;
        // eslint-disable-next-line no-undef
        const DBName = process.env.DB_NAME;
        const client = new MongoClient(`${URI}/${DBName}`, { useUnifiedTopology: true });
        await client.connect();
        const db = client.db(DBName);
        logger.info("Successfully connected with MongoDB client");
        return db;
    } catch (error) {
        logger.error("Failed to connect to MongoClient " + error);
        console.error("Failed to connect to MongoClient", error);
    }
}


module.exports = connectDB;