import TelegramBot from "node-telegram-bot-api";
import phrases from './assets/db/db.json' with {type: "json"};

const bot = new TelegramBot("", { polling: true });

bot.on("new_chat_members", async (msg) => {
    const newMembers = msg.new_chat_members;
    for (const member of newMembers) {
        try {
            console.log(member)
            await bot.sendMessage(msg.chat.id, `Hello ${member.first_name}`);

        } catch (error) {
            console.error("Ошибка при отправке сообщения новому участнику:", error);
        }
    }
});

bot.on("message", async (msg) => {
    if (!msg.text) return;

    console.log(msg)
    console.log("Получено сообщение:", msg.text);

    const foundPhrase = phrases.phrases.find(phrase => {
        const normalizedPhrase = phrase.trim().toLowerCase().replace(/[.,;!?]/g, '');
        const normalizedText = msg.text.trim().toLowerCase().replace(/[.,;!?]/g, '');

        const regex = new RegExp(`(^|\\s)${normalizedPhrase.toLowerCase()}($|\\s)`, 'i');

        const matches = regex.test(normalizedText);

        return matches;
    });
    const urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
    const foundUrl = urlRegex.test(msg.text.toLowerCase());

    const domainRegex = /\b[A-Za-z0-9._%+-]+(?:\.[A-Za-z]{2,6})\b/;
    const foundDomain = domainRegex.test(msg.text.toLowerCase());

    const nonDotDomainRegex = /\b[A-Za-z0-9._%+-]+(?![.])\s+[A-Za-z]{2,6}\b/;
    const foundNonDotDomain = nonDotDomainRegex.test(msg.text.toLowerCase());

    const foundBlockedSymbols = /[$]{1,}/.test(msg.text.toLowerCase());

    let reason = "";

    if (foundPhrase || foundUrl || (foundDomain && !foundNonDotDomain) || foundBlockedSymbols) {
        if (foundPhrase) {
            reason = `Вы прислали запрещённую фразу: ${msg.text}`;
            console.log("Найдено совпадение с фразой:", foundPhrase);
        }
        else if (foundUrl) {
            reason = `Вы прислали ссылку: а это нельзя.`;
            console.log("Найдена ссылка в сообщении.");
        }
        else if (foundDomain) {
            reason = `Вы прислали доменное имя: ${msg.text}.`;
            console.log("Найдена доменная зона в сообщении.");
        }
        else if (foundBlockedSymbols) {
            reason = `Вы использовали запрещённые символы: ${msg.text}.`;
            console.log("Найдены запрещённые символы: $$$");
        }

        try {
            await bot.deleteMessage(msg.chat.id, msg.message_id);
            console.log("Сообщение удалено:", msg.message_id);
            await bot.sendMessage(msg.chat.id, `${msg.from.first_name || undefined}, Так нельзя. Причина: ${reason}`, {
                message_thread_id: msg?.message_thread_id || ""
            });

        } catch (error) {
            console.error("Ошибка при удалении сообщения или отправке ответа:", error);
        }
    } else {
        console.log("Совпадения не найдено.");
    }
});

bot.on('polling_error', console.log)