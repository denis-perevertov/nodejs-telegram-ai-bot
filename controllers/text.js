import bot from '../main.js'
import { openai, ai_model } from '../config/openai_config.js';
import { logger } from '../config/logger_config.js';

export async function promptEmptyCommandHandler(msg, chatHistoryMap) {
    logger.info("EMPTY PROMPT HANDLER ACTIVATED");

    const chatId = msg.chat.id;
    const msgId = msg.message_id;

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

    bot.sendMessage(chatId, msgText, {reply_to_message_id: msgId}).then(() => logger.info("msg sent"));
}

export async function promptCommandHandler(msg, prompt, chatHistoryMap) {

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
        chatHistoryMap.set(chatHistoryId, [{role: 'user', content: msgText}]);
    }
    else {
        chatHistoryMap.get(chatHistoryId).push({role: 'user', content: msgText});
    }

    console.log('current chat history: ', chatHistoryMap);

    const msgOptions = {
        parse_mode: 'MarkdownV2',
        reply_to_message_id: msgId
    }

    const chatCompletion = await sendMessageWithPlaceholder(chatId, chatHistoryId, chatHistoryMap, msgOptions);

    const botAnswer = chatCompletion.choices[0];

    try {
        logger.info("sending message...");
        bot.sendMessage(
            chatId, 
            createPromptMessage(msgSender, botAnswer.message.content), 
            msgOptions
        ).then(
            (msg) => {console.log('msg sent'); console.log(msg);}
        )
    
        chatHistoryMap.get(chatHistoryId).push(botAnswer.message);
    } catch (err) {
        console.error(err);
        bot.sendMessage(
            chatId, 
            `Error creating message: ${err}`
        ).then(
            (msg) => {console.log('error msg sent'); console.log(msg);}
        )
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
        chatHistoryMap.set(chatHistoryId, [{role: 'user', content: msgText}]);
    }
    else { 
        chatHistoryMap.get(chatHistoryId).push({role: 'user', content: msgText});
    }

    logger.debug('chat history map: ', chatHistoryMap);

    const chatCompletion = await sendMessageWithPlaceholder(chatId, chatHistoryId, chatHistoryMap, msgOptions);

    const botAnswer = chatCompletion.choices[0];

    try {
        logger.info("sending message...");
        bot.sendMessage(
            chatId, 
            createPromptMessage(msgSender, botAnswer.message.content), 
            msgOptions
        ).then(
            (msg) => {console.log('msg sent'); console.log(msg);}
        )
    
        chatHistoryMap.get(chatHistoryId).push(botAnswer.message);
    } catch (err) {
        console.error(err);
        bot.sendMessage(
            chatId, 
            `Error creating message: ${err}`
        ).then(
            (msg) => {console.log('error msg sent'); console.log(msg);}
        )
    }
    
}

// Sending&refreshing placeholder message while the main content is loading
async function sendMessageWithPlaceholder(chatId, chatHistoryId, chatHistoryMap, msgOptions) {

    let placeholderMsgID;
    let intervalID;
    let progressBar = "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜"
    console.log('length: ', progressBar.length);
    let emptySymbol = "⬜";
    let filledSymbol = "🟩"
    let currentSymbolType = filledSymbol;
    let index = 0;
    let placeholderText = `Создаю ответ\\.\\.\\.\n${progressBar}`
    await bot.sendMessage(chatId, placeholderText, msgOptions).then(result => placeholderMsgID = result.message_id);
    logger.info('generating bot response...')
    const beginTime = new Date().getTime();
    intervalID = setInterval(() => {
        // progressBar = progressBar.substring(0, index) + currentSymbolType + progressBar.substring(index+1);
        // progressBar = '';
        const symbols = [...progressBar]
        for(let i = 0; i < index; i++) {
            symbols[i] = filledSymbol
        }
        for(let j = index; j < 10; j++) {
            symbols[j] = emptySymbol;
        }
        progressBar = [...symbols].join('');
        // progressBar += filledSymbol;
        if(++index > 9) {
            index = 0;
            currentSymbolType = (currentSymbolType == filledSymbol) ? emptySymbol : filledSymbol;
        }
        placeholderText = `Создаю ответ...\n${progressBar}`
        console.log('progress bar : ', progressBar);
        bot.editMessageText(placeholderText, {chat_id: chatId, message_id: placeholderMsgID}).then(() => console.log('msg edited'));
    }, 1000);
    const chatCompletion = await openai.chat.completions.create({
        messages: [...chatHistoryMap.get(chatHistoryId)],
        model: ai_model
    });
    const endTime = new Date().getTime();
    logger.info("creation time: " + Math.abs(endTime - beginTime) + " ms");
    clearInterval(intervalID);
    bot.deleteMessage(chatId, placeholderMsgID)

    return chatCompletion;
}

// Format bot answer message
function createPromptMessage(sender, content) {

    const tokenCount = content.split(' ').length;
    const tokenCost = 0.000001;
    const msgCost = formatString((tokenCost * tokenCount).toFixed(6).toString());
    const formattedUsername = formatString(`${sender.first_name} ${sender.last_name}${sender.username ? ` - @${sender.username}` : ''}${` - *ID *${sender.id}`}`);
    const formattedContent = formatString(content);
    const formattedDatetime = formatString(formatDatetime(new Date()));

    const usernameString = `*Имя пользователя: *${formattedUsername}`;
    const datetimeString = `*Дата: *${formattedDatetime}`;
    const separatorString = '\\-\\-\\-';
    const contentString = `*Ответ: *${formattedContent}`;
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

    return promptMsg;
}

// Format string for markdown parse mode - escape any special characters with backslashes
function formatString(str) {
    const specialCharacters = ['_', '-', '.', '!', '(', ')', '[', ']'];
    // for(const char of specialCharacters) {
    //     str = str.replaceAll(new RegExp(char, 'g'), `\\${char}`)
    // }
    return str
    .replace(/\_/g, "\\_")
    .replace(/\-/g, "\\-")
    .replace(/\./g, "\\.")
    .replace(/\!/g, "\\!")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

// Format datetime to string
function formatDatetime(datetime) {
    return `${datetime.getFullYear()}-${(datetime.getMonth()+1).toString().padStart(2, '0')}-${datetime.getDate().toString().padStart(2, '0')} ${datetime.getHours().toString().padStart(2, '0')}:${datetime.getMinutes().toString().padStart(2, '0')}`
}
