import "dotenv/config.js";

const bot_username = process.env.TELEGRAM_BOT_USERNAME;
const bot_token = process.env.TELEGRAM_BOT_TOKEN;

const bot_commands = [
    {command: 'help', description: 'Справка по командам'},
    {command: 'image', description: 'Генерация картинки'},
    {command: 'prompt', description: 'Создать запрос для бота'},
    {command: 'about', description: 'Информация про бота'},
    {command: 'stats', description: 'Статистика'},
    // {command: 'tts', description: 'text-to-speech'},
    // {command: 'stt', description: 'speech-to-text'},
    // {command: 'analysis', description: 'text-to-speech'},
    // {command: 'transcript', description: 'video transcript'},
    // {command: 'summary', description: 'video summary'},
]

const bot_options = {
    polling: true
}

function getRegexp(bot_command) {
    return new RegExp(bot_command + `(@${bot_username})? (.)+`);
}

export const getCommandStringList = () => {
    return bot_commands.map(command => `/${command.command} - ${command.description}`);
}

export const
    username = bot_username,
    token = bot_token,
    commands = bot_commands,
    options = bot_options,
    regex = getRegexp