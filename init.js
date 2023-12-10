import {token, options} from './bot_config.js';
import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(token, options);
console.log('Telegram bot started');

export default bot;