import bot from '../main.js';
import { commands as botCommandsFromConfig } from '../config/bot_config.js';
import { logger } from '../config/logger_config.js';
import { getBotCommandsFromConfig } from '../init.js';
import * as HelpController from './help.js';
import * as TextController from './text.js';
import * as StringUtils from '../utils/StringUtils.js';

export async function processCommand(msg, chatHistoryMap) {
    const msgText = msg.text;
    const command = msgText.split(" ")[0];
    const option = msgText.substring(msgText.indexOf(" "));
    console.log('command: ', command);
    if(option) console.log('option: ', option);

    switch(command) {
        case '/help': HelpController.createHelpMessage(msg, option); break;
        case '/prompt': TextController.promptCommandHandler(msg, option, chatHistoryMap); break;
        default: sendUnknownCommandMessage(msg);
    }
}

async function sendUnknownCommandMessage(msg) {
    const chatId = msg.chat.id;
    const commandList = await getCommandListDescription();

    const msgText = `Неизвестная команда! Выберите команду из следующего списка:\n${commandList.join('\n')}`   
    const formattedMsgText = StringUtils.formatString(msgText);
    const msgOptions = {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: msg.message_thread_id
    }

    bot.sendMessage(chatId, formattedMsgText, msgOptions).then(() => {
        console.log('msg sent')
    }).catch(error => {
        console.error('error during sending of the message;');
        const errorDescription = error.response.body.description;
        logger.error(errorDescription);

        bot.sendMessage(chatId, errorDescription).then(() => logger.info('error msg sent')).catch(error => logger.error('cant send error msg'))
    })
}

async function getCommandListDescription() {
    const commandList = botCommandsFromConfig;
    return commandList.map(commandObject => `/${commandObject.command} - ${commandObject.description}`)
}