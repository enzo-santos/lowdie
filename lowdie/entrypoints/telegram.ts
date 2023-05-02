import Lowdie, {LowdieAnswer} from "../lowdie";
import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import functions from '@google-cloud/functions-framework';

let bot: TelegramBot | undefined;

async function onSendMessage(bot: TelegramBot, chatId: number, answer: LowdieAnswer): Promise<void> {
  const input = answer.input;

  let sendOptions: TelegramBot.SendMessageOptions;
  if (input == null) {
    sendOptions = {parse_mode: 'Markdown'};
  } else {
    switch (input.type) {
      case 'none':
        sendOptions = {
          parse_mode: 'Markdown',
          reply_markup: {keyboard: [], one_time_keyboard: true},
        };
        break;
      case 'text':
        sendOptions = {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: this.options.map((text) => [{text: text}]),
            one_time_keyboard: true,
          },
        };
        break;
      case 'card':
        sendOptions = {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: this.options.map((text) => [{text: text, callback_data: text}]),
          },
        };
        break;
    }
  }
  await bot.sendMessage(chatId, answer.text, sendOptions);
}

async function loadBot(url: URL, root: string): Promise<any> {
  dotenv.config();

  const {WEBHOOK_ADDRESS, LOWDIE_TOKEN} = process.env;
  const webhookAddress = WEBHOOK_ADDRESS ?? url.href;
  if (LOWDIE_TOKEN == null) {
    console.error('LOWDIE_TOKEN not defined');
    throw 'Token environment variable not defined, please add LOWDIE_TOKEN to your environment.'
  }
  if (webhookAddress == null) {
    console.error('WEBHOOK_ADDRESS not defined');
    throw 'Webhook environment variable not defined, please add WEBHOOK_ADDRESS to your environment.'
  }

  const lowdie = new Lowdie();

  const bot = new TelegramBot(LOWDIE_TOKEN);
  await bot.setWebHook(WEBHOOK_ADDRESS, {certificate: root + '/crt.pem'});

  bot.on('message', async (msg) => {
    const chatId = msg['chat'].id;

    const answers = lowdie.answer(chatId, msg.text.trim());
    for (const answer of answers) {
      await onSendMessage(bot, chatId, answer);
    }
  });
  bot.on('callback_query', async (query) => {
    const chatId = query.message['chat'].id;

    await bot.answerCallbackQuery(query.id, {});
    const answers = lowdie.answer(chatId, query.data.trim());
    for (const answer of answers) {
      await onSendMessage(bot, chatId, answer);
    }
  });
  bot.on('polling_error', (m) => console.error(m));

  return bot;
}

export const lowdieTelegramWebhook: functions.HttpFunction = async (request, _) => {
  if (bot == null) {
    bot = await loadBot(new URL(request.originalUrl, request.protocol + '://' + request.get('host')), '.');
  }

  const body: any | undefined = request.rawBody?.toJSON();
  if (body) {
    bot.processUpdate(body);
    // response.status(200);
    // response.status(200);
    // context.res = {status: 200, body: 'ok'};
  } else {
    // context.res = {status: 404, body: 'error'};
  }
};