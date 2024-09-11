const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.DATABASE_URI;
const DBName = process.env.DATABASE_NAME;

class BaseDatabaseTransaction {
    constructor() {
        this.session = null;
        this.connect();
    }

    async connect() {
        try {
            await mongoose.connect(URI, { dbName: DBName });
            console.log(`Successfully connected to the database ${DBName}`);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async startTransaction() {
        try {
            this.session = await mongoose.startSession();
            this.session.startTransaction();
            return this.session;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async commitTransaction() {
        try {
            if (this.session) {
                await this.session.commitTransaction();
                this.session.endSession();
                console.log("Commit change to database successfully!");
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async abortTransaction() {
        try {
            if (this.session) {
                await this.session.abortTransaction();
                this.session.endSession();
                console.log("Abort change to database!");
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

module.exports = BaseDatabaseTransaction;
