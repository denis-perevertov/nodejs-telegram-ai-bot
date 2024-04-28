import bot from '../main.js'
import { openai, chat_model, tools } from '../config/openai_config.js';
import { logger } from '../config/logger_config.js';
import * as ImageController from './image.js';
import * as ToolController from './tool.js';
import * as StringUtils from '../utils/StringUtils.js'
import MessageService from '../services/messages.js';

export async function sendEmptyPromptMessage(msg, chatHistoryMap) {
    logger.info("EMPTY PROMPT HANDLER ACTIVATED");

    const chatId = msg.chat.id;
    const msgId = msg.message_id;

    /*
const msgText = 
`
Введите запрос для бота. 
Через команду: /prompt [текст запроса]
В группе: Ответьте на это сообщение своим запросом
В личной переписке: Отвечать на сообщения необязательно.

Рекомендации:

1. Будьте ясными и конкретными: При формулировании запроса старайтесь быть точными и ясно выражать свою мысль. Это поможет чатботу лучше понять ваше намерение и предоставить точные и полезные ответы.

2. Используйте ключевые слова: Помогите чатботу понять контекст вашего вопроса, используя ключевые слова или фразы, связанные с вашей проблемой или интересующей вас темой.

3. Избегайте слишком сложных вопросов: Сложные или запутанные вопросы могут затруднить понимание чатботом, поэтому старайтесь формулировать простые и понятные вопросы.

4. Проверьте орфографию и пунктуацию: Правильное написание и использование пунктуации помогут чатботу лучше интерпретировать ваш запрос и предоставить соответствующий ответ.

5. Используйте вежливую и четкую речь: Будьте вежливы и используйте понятные фразы. Это поможет установить эффективное общение с чатботом и получить более точную информацию.

6. Подробнее объясните, если необходимо: Если ваш запрос требует дополнительных объяснений или контекста, не стесняйтесь расширить свой вопрос для более четкого понимания.

7. Будьте терпеливы: Некоторые чатботы могут требовать некоторого времени для обработки запросов или предоставления ответов. Будьте терпеливы и дайте боту время обработать вашу информацию.

`
    */

    const msgText = 'Введите свой запрос!'

    bot.sendMessage(chatId, msgText, {reply_to_message_id: msgId}).then(() => logger.info("msg sent"));
}

export async function promptCommandHandler(msg, prompt, chatHistoryMap) {

    if(!prompt) {
        sendEmptyPromptMessage(msg);
        return;
    }

    logger.info("PROMPT HANDLER ACTIVATED")

    const chatId = msg.chat.id;
    const msgSender = msg.from;
    const msgId = msg.message_id;
    const msgThreadId = msg.message_thread_id;
    const msgText = prompt;

    console.log('msg text:', msgText);

    const chatHistoryId = `${chatId}${msgThreadId ? `_${msgThreadId}` : ''}`;
    console.log(chatHistoryId);

    if(!chatHistoryMap.has(chatHistoryId)) {
        MessageService.getMessageHistory(chatHistoryId).then(result => {
            console.log('found message history');
            chatHistoryMap.set(chatHistoryId, [...result.map(msg => ({role: msg.role, content: msg.content})), {role: 'user', content: msgText}]);
        });
        
    }
    else { 
        chatHistoryMap.get(chatHistoryId).push({role: 'user', content: msgText});
    }

    MessageService.saveMessage(chatHistoryId, {role: 'user', content: msgText})

    console.log('current chat history: ', chatHistoryMap);

    const msgOptions = {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: msgId
    }

    let loadingMsg = await sendLoadingMessage(chatId, msgOptions);
    const chatCompletion = await generateMessage(chatId, chatHistoryId, chatHistoryMap, msgOptions);
    clearInterval(loadingMsg.interval);
    await completeLoadingMessageStep(chatId, msgOptions, loadingMsg, 'Создаю ответ...')

    const botAnswer = chatCompletion.choices[0];

    try {
        loadingMsg = await sendLoadingMessage(chatId, msgOptions, loadingMsg.id, loadingMsg.text, 'Отправляю созданный ответ...')
        await bot.sendMessage(
            chatId, 
            formatPromptMessage(msgSender, botAnswer.message.content), 
            msgOptions
        ).then(
            (msg) => {
                console.log('msg sent'); 
                // console.log(msg);
            }
        )
    
        chatHistoryMap.get(chatHistoryId).push(botAnswer.message);
        MessageService.saveMessage(chatHistoryId, botAnswer.message)
    } catch (err) {
        console.error(err);
        await bot.sendMessage(
            chatId, 
            `Error creating message: ${err}`
        ).then(
            (msg) => {
                console.log('error msg sent'); 
                // console.log(msg);
            }
        )
    } finally {
        clearInterval(loadingMsg.interval);
        deleteMessage(chatId, loadingMsg.id);
    }

}

export async function textMessageHandler(msg, chatHistoryMap) {
    logger.info("TEXT MSG HANDLER ACTIVATED");

    const chatId = msg.chat.id;
    const msgSender = msg.from;
    const msgId = msg.message_id;
    const msgThreadId = msg.message_thread_id;
    const msgText = msg.text;

    const msgOptions = {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: msgId
    }

    const chatHistoryId = `${chatId}${msgThreadId ? `_${msgThreadId}` : ''}`;
    logger.info("CHAT ID / MESSAGE THREAD ID: " + chatHistoryId);

    if(!chatHistoryMap.has(chatHistoryId)) {
        MessageService.getMessageHistory(chatHistoryId).then(result => {
            console.log('found message history');
            chatHistoryMap.set(chatHistoryId, [...result.map(msg => ({role: msg.role, content: msg.content})), {role: 'user', content: msgText}]);
        });
        
    }
    else { 
        chatHistoryMap.get(chatHistoryId).push({role: 'user', content: msgText});
    }

    MessageService.saveMessage(chatHistoryId, {role: 'user', content: msgText})

    console.log('-- chat history map --');
    console.log(chatHistoryMap);

    logger.debug('chat history map: ', chatHistoryMap);

    let loadingMsg = await sendLoadingMessage(chatId, msgOptions);
    const chatCompletion = await generateMessage(chatId, chatHistoryId, chatHistoryMap, msgOptions);
    clearInterval(loadingMsg.interval);
    await completeLoadingMessageStep(chatId, msgOptions, loadingMsg, 'Создаю ответ...')

    const botAnswer = chatCompletion.choices[0];

    console.log('bot answer: ', botAnswer);

    if(botAnswer.message.tool_calls) {
        ToolController.processToolCalls(msg, botAnswer.message.tool_calls, loadingMsg)
    }
    else {
        try {
            loadingMsg = await sendLoadingMessage(chatId, msgOptions, loadingMsg.id, loadingMsg.text, 'Отправляю созданный ответ...')
            await bot.sendMessage(
                chatId, 
                formatPromptMessage(msgSender, botAnswer.message.content), 
                msgOptions
            ).then(
                (msg) => {
                    console.log('msg sent'); 
                    // console.log(msg);
                }
            )
        
            chatHistoryMap.get(chatHistoryId).push(botAnswer.message);
            MessageService.saveMessage(chatHistoryId, botAnswer.message)
        } catch (err) {
            console.error(err);
            await bot.sendMessage(
                chatId, 
                `Error creating message: ${err}`
            ).then(
                (msg) => {
                    console.log('error msg sent'); 
                    // console.log(msg);
                }
            )
        } finally {
            clearInterval(loadingMsg.interval);
            deleteMessage(chatId, loadingMsg.id);
        }
    }
}


// Sending&refreshing placeholder message while the main content is loading
async function generateMessage(chatId, chatHistoryId, chatHistoryMap, msgOptions) {

    const beginTime = new Date().getTime();
    const chatCompletion = await openai.chat.completions.create({
        messages: [...chatHistoryMap.get(chatHistoryId)],
        model: chat_model,
        tools: tools
    });
    const endTime = new Date().getTime();
    logger.info("creation time: " + Math.abs(endTime - beginTime) + " ms");

    return chatCompletion;
}

/**
 * Method creating a loading message to showcase progress in creating a bot response.
 * Can be used with existing loading message data(id, text) to create multi-step messages.
 * To complete a step, use the {@link completeLoadingMessageStep} method
 * @param {string} chatId - Telegram Chat ID, where the loading message must appear
 * @param {object} msgOptions - Message Options: parseMode, replyToMessageId, etc
 * @param {string} prevMessageId - ID of the previously created loading message, for multi-step messages
 * @param {string} prevMessageText - Text of the previously created loading message, for multi-step messages
 * @param {string} currentStepText - Text of the current step for a loading message
 */
export async function sendLoadingMessage(chatId, msgOptions, prevMessageId, prevMessageText, currentStepText = 'Создаю ответ...') {
    let loadingMsgID = prevMessageId; // insert previous message for multi-step loading message
    let intervalID;
    let progressBar = "⬜⬜⬜⬜⬜"
    console.log('length: ', progressBar.length);
    let emptySymbol = "⬜";
    let filledSymbol = "🟩"
    let currentSymbolType = filledSymbol;
    let index = 1;
    let currentText = `${prevMessageText || ''}${currentStepText}`
    let loadingMsgTextWithProgressBar = `${currentText} ${progressBar}` // insert previous message text for multi-step loading message
    // create new loading message , if it was not created before
    if(!loadingMsgID) {
        await bot.sendMessage(chatId, loadingMsgTextWithProgressBar).then(result => {loadingMsgID = result.message_id});
    }
    intervalID = setInterval(() => {
        const symbols = [...progressBar]
        for(let i = 0; i < index; i++) {
            symbols[i] = filledSymbol
        }
        for(let j = index; j < 5; j++) {
            symbols[j] = emptySymbol;
        }
        progressBar = [...symbols].join('');
        if(++index > 5) {
            index = 0;
            currentSymbolType = (currentSymbolType == filledSymbol) ? emptySymbol : filledSymbol;
        }
        loadingMsgTextWithProgressBar = `${prevMessageText || ''}${currentStepText} ${progressBar}`
        bot.editMessageText(loadingMsgTextWithProgressBar, {chat_id: chatId, message_id: loadingMsgID});
    }, 1000);

    return { 
        interval: intervalID,
        id: loadingMsgID,
        text: currentText,
        prevMessageText: prevMessageText
     };
}

export async function completeLoadingMessageStep(chatId, msgOptions, loadingMsg) {
    const { id: prevMessageId, text } = loadingMsg;
    const completedSymbol = "✅";
    const editedText = `${text} ${completedSymbol}\n`
    await bot.editMessageText(editedText, {chat_id: chatId, message_id: prevMessageId});
    loadingMsg.text = editedText;
}

export async function deleteMessage(chatId, messageId) {
    bot.deleteMessage(chatId, messageId)
        .then(() => logger.info("msg deleted"))
        .catch((err) => {logger.error('could not delete message'); logger.error(err)});
}

export async function sendErrorMessage(chatId, errorText) {
    const text = `
    Возникла ошибка:
    ${errorText}
    `
    bot.sendMessage(chatId, text)
        .then(() => logger.info('error msg sent'))
        .catch(() => logger.error('could not send error message!'));
}

// Format bot answer message
function formatPromptMessage(sender, content, adminMode = false) {

    if(!adminMode) {
        return StringUtils.formatString(content);
    }
    else {
        const tokenCount = content.split(' ').length;
        const tokenCost = 0.000001;
        const msgCost = (tokenCost * tokenCount).toFixed(6).toString()
        const username = `${sender.first_name} ${sender.last_name}${sender.username ? ` - @${sender.username}` : ''}${` - *ID *${sender.id}`}`
        const datetime = StringUtils.formatDatetime(new Date())
    
        const usernameString = `*Имя пользователя: *${username}`;
        const datetimeString = `*Дата: *${datetime}`;
        const separatorString = '---';
        const contentString = `*Ответ: *${content}`;
        const wordCountString = `*Слов: *${tokenCount} слов`;
        const msgCostString = `*Примерная стоимость сообщения: *$${msgCost}`
        
        const promptMsg = 
`
${usernameString}
${datetimeString}
${separatorString}
${contentString}
${separatorString}
${wordCountString}
${msgCostString}
`
        console.log('promptMsg: ', promptMsg);

        return StringUtils.formatString(promptMsg);
    }

    
}

