import { initBot, setCommandsFromConfig, getBotCommandsFromConfig } from './init.js';
import * as TextController from './controllers/text.js';
import * as CommandController from './controllers/command.js'

const bot = initBot();

// key: chat ID (personal) | message thread ID (for groups)
// value: text message history between bot and user
const chatHistoryMap = new Map();    

bot.on('text', async (msg) => {
    const text = msg.text;

    const commandRegex = /^\/[a-zA-Z0-9_]/;

    if(text.match(commandRegex)) {
        console.log('MATCHED COMMAND REGEX');
        CommandController.processCommand(msg, chatHistoryMap);
    }
    else {
        TextController.textMessageHandler(msg, chatHistoryMap);
    }
});

// setCommandsFromConfig()

export default bot;
