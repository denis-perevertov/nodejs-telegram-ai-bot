import "dotenv/config.js";

const bot_username = process.env.TELEGRAM_BOT_USERNAME;
const bot_token = process.env.TELEGRAM_BOT_TOKEN;

const bot_commands = {
    "prompt": `/prompt`
}

const bot_options = {
    polling: true
}

function getRegexp(bot_command) {
    return new RegExp(bot_command + `(@${bot_username})? (.)+`);
}

export const
    username = bot_username,
    token = bot_token,
    commands = bot_commands,
    options = bot_options,
    regex = getRegexp