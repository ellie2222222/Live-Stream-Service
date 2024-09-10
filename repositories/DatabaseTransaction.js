const BaseDatabaseTransaction = require("./BaseDatabaseTransaction");
const UserRepository = require("./UserRepository");

class DatabaseTransaction extends BaseDatabaseTransaction {
    constructor() {
        super();
        this.userRepository = new UserRepository();
    }
}

module.exports = DatabaseTransaction