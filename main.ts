import "dotenv/config.js";
import OpenAI from "openai";
import TelegramBot from "node-telegram-bot-api";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const token: string = process.env.TELEGRAM_BOT_TOKEN as string;
console.log(token);

const options = {
    polling: true
}

const bot: TelegramBot = new TelegramBot(token, options);

bot.on('text', async (msg) => {
    const text = msg.text;
    console.log(text);

    const chatCompletion = await openai.chat.completions.create({
        messages: [{role: 'user', content: 'this is a test'}],
        model: 'gpt-3.5-turbo'
    });

    console.log(chatCompletion);
})

export default bot;