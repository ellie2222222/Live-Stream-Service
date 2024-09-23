const BaseDatabaseTransaction = require("./BaseDatabaseTransaction");
const MessageRepository = require("./MessageRepository");
const StreamRepository = require("./StreamRepository");
const UserRepository = require("./UserRepository");

class DatabaseTransaction extends BaseDatabaseTransaction {
    constructor() {
        super();
        this.userRepository = new UserRepository();
        this.streamRepository = new StreamRepository();
        this.messageRepository = new MessageRepository();
    }
}

module.exports = DatabaseTransaction