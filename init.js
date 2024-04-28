import { token, options, commands } from './config/bot_config.js';
import TelegramBot from "node-telegram-bot-api";

export function initBot() {
    const bot = new TelegramBot(token, options);
    console.log('Telegram bot started');

    setCommandsFromConfig(bot);

    return bot;
}

export function setCommandsFromConfig(bot) {
    bot.setMyCommands(commands).then(result => {
        console.log('commands set');
    })
}

export async function getBotCommandsFromConfig(bot) {
    const commandList = await bot.getMyCommands().then(result => {
        console.log('fetched commands');
        console.log(result);
        return result;
    });
    return commandList;
}
