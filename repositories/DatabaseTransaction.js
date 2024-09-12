const BaseDatabaseTransaction = require("./BaseDatabaseTransaction");
const UserRepository = require("./UserRepository");
const StreamRepository = require("./StreamRepository");

class DatabaseTransaction extends BaseDatabaseTransaction {
    constructor() {
        super();
        this.userRepository = new UserRepository();
        this.streamRepository = new StreamRepository();
    }
}

module.exports = DatabaseTransaction