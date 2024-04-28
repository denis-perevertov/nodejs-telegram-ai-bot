import { initBot, setCommandsFromConfig, getBotCommandsFromConfig } from './init.js';
import db, * as Collections from './db.js';
import * as TextController from './controllers/text.js';
import * as CommandController from './controllers/command.js'
import * as CallbackController from './controllers/callback.js'
import * as ImageController from './controllers/image.js'
import * as LoginController from './controllers/login.js';
import * as StartController from './controllers/start.js';
import UserService from './services/users.js';
import { logger } from './config/logger_config.js';
import { token } from './config/bot_config.js';
import fs from 'fs';
import request from 'request';
import path from 'path';
import ffmpeg from 'ffmpeg';
import { YoutubeTranscript } from 'youtube-transcript';

// YoutubeTranscript.fetchTranscript('Z6nkEZyS9nA', {lang: 'ru'}).then(console.log);

const bot = initBot();

// key: chat ID (personal) | message thread ID (for groups)
// value: text message history between bot and user
const chatHistoryMap = new Map();


// key: chat ID (personal) | message thread ID (for groups)
// value: object containing all of special action flags -> create image / edit image / create voice / etc etc etc
const chatActionsMap = new Map();

// console.log('FFMPEG');
// try {
//     new ffmpeg('file.mp3', (err, audio) => {
//         if(!err) {
//             audio.setAudioQuality(4);
//             audio.setAudioBitRate(128);
//             console.log('audio: ', audio);
//             audio.save('file.ogg', (err, file) => {
//                 if(!err) {
//                     console.log('file: ', file);
//                 }
//                 else console.error(err);
//             })
//         }
//         else console.error(err);
//     })
// } catch (e) {
// 	console.log(e.code);
// 	console.log(e.msg);
// }

bot.on('voice', async (msg) => {
    if(!(await UserService.userIsRegistered(msg.from.id))) {
        StartController.showRegisterMessage(msg);
        return;
    }
    bot.sendMessage(msg.chat.id, 'voice received');
})

bot.on('audio', async (msg) => {
    if(!(await UserService.userIsRegistered(msg.from.id))) {
        StartController.showRegisterMessage(msg);
        return;
    }
    bot.sendMessage(msg.chat.id, 'audio received');
})

bot.on('contact', async (msg) => {
    LoginController.register(msg);
})

bot.on('document', async (msg) => {
    if(!(await UserService.userIsRegistered(msg.from.id))) {
        StartController.showRegisterMessage(msg);
        return;
    }
    ImageController.editImage(msg, msg.document.file_id, 'twist the photo')
})

bot.on('callback_query', async (query) => {
    if(!(await UserService.userIsRegistered(query.message.from.id))) {
        StartController.showRegisterMessage(query.message);
        return;
    }
    CallbackController.processCallbackData(query);
})

bot.on('photo', async (msg) => {

    if(!(await UserService.userIsRegistered(msg.from.id))) {
        StartController.showRegisterMessage(msg);
        return;
    }

    console.log('message: ', msg);
    const chatId = msg.chat.id;
    const fileId = msg.photo[msg.photo.length - 1].file_id;

    const flags = chatActionsMap.get(chatId);
    if(flags) {
        // todo add flags
    }
    else {
        chatActionsMap.set(chatId, {
            createNewImage: false,
            editImage: false,
        });
    }
    if(ImageController.editImagePromptMsgID) {
        if(msg.caption) {
            ImageController.editImage(msg, fileId, msg.caption);
        }
        else {
            bot.sendMessage(chatId, 'Отправьте фотографию с подписью');
        }
    }
    else {
        bot.getFile(fileId).then(async result => {
            console.log('result: ', result);
            if(result && result.file_path) {
                const path = `${fileId}.jpg`
                const downloadURL = `https://api.telegram.org/file/bot${token}/${result.file_path}`;
    
                request(downloadURL).pipe(fs.createWriteStream(path)).on('close', () => {
                    const stream = fs.createReadStream(path);
                    bot.sendPhoto(chatId, stream)
                            .then( result => console.log('result: ', result))
                            .catch(error => console.error(error))
                            .finally(() => fs.unlink(path, () => console.log('file deleted')));
                });
            }
        });
    }
    
})

bot.on('text', async (msg) => {

    if(!(await UserService.userIsRegistered(msg.from.id))) {
        StartController.showRegisterMessage(msg);
        return;
    }
    else {
        const text = msg.text;
        const commandRegex = /^\/[a-zA-Z0-9_]/;
    
        if(text.match(commandRegex)) {
            CommandController.processCommand(msg, chatHistoryMap);
        }
        else {
            if(ImageController.createImagePromptMsgID) {
                ImageController.drawImage(msg, text);
            }
            else {
                TextController.textMessageHandler(msg, chatHistoryMap);
            }
        }
    }
});


export default bot;
