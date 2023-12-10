import "dotenv/config.js";

const bot_username = process.env.TELEGRAM_BOT_USERNAME;
const bot_token = process.env.TELEGRAM_BOT_TOKEN;

const bot_commands = [
    {command: 'help', description: 'Справка по командам'},
    {command: 'prompt', description: 'Создать запрос для бота'},
    {command: 'about', description: 'Информация про бота'},
    {command: 'stats', description: 'Статистика'}
]

const bot_options = {
    polling: true
}

function getRegexp(bot_command) {
    return new RegExp(bot_command + `(@${bot_username})? (.)+`);
}

function getCommandStringList() {
    return bot_commands.map(command => `/${command.command} - ${command.description}`);
}

export const
    username = bot_username,
    token = bot_token,
    commands = bot_commands,
    commandsStringList = getCommandStringList,
    options = bot_options,
    regex = getRegexp