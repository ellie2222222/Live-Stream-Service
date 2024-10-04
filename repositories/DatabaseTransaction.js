import BaseDatabaseTransaction from "./BaseDatabaseTransaction.js";
import MessageRepository from "./MessageRepository.js";
import StreamRepository from "./StreamRepository.js";
import UserRepository from "./UserRepository.js";

class DatabaseTransaction extends BaseDatabaseTransaction {
    constructor() {
        super();
        this.userRepository = new UserRepository();
        this.streamRepository = new StreamRepository();
        this.messageRepository = new MessageRepository();
    }
}

export default DatabaseTransaction;