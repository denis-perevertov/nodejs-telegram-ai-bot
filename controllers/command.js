import bot from '../main.js';
import { commands as botCommandsFromConfig } from '../config/bot_config.js';
import { logger } from '../config/logger_config.js';
import { getBotCommandsFromConfig } from '../init.js';
import * as StartController from './start.js';
import * as HelpController from './help.js';
import * as ImageController from './image.js';
import * as TextController from './text.js';
import * as AboutController from './about.js';
import * as StatsController from './stats.js';
import * as AudioController from './audio.js';
import * as TranscriptController from './transcript.js';
import * as StringUtils from '../utils/StringUtils.js';

export async function processCommand(msg, chatHistoryMap) {

    ImageController.resetPromptFlags();

    const msgText = msg.text;
    const command = msgText.split(" ")[0];
    const option = msgText.indexOf(' ') < 0 ? '' : msgText.substring(msgText.indexOf(' '));
    console.log('command: ', command);
    if(option) console.log('option: ', option);

    switch(command) {
        case '/start': StartController.showStartMenu(msg); break;
        case '/help': HelpController.createHelpMessage(msg, option); break;
        case '/image': ImageController.createImageMessage(msg, option); break;
        case '/prompt': TextController.promptCommandHandler(msg, option, chatHistoryMap); break;
        case '/about': AboutController.createAboutMessage(msg, option); break;
        case '/stats': StatsController.createStatsMessage(msg, option); break;
        case '/audio': AudioController.createAudioMessage(msg); break;
        case '/transcript': TranscriptController.createTranscriptMessage(msg, option); break;
        case '/summary': TranscriptController.createTranscriptSummaryMessage(msg, option); break;
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