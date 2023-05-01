import {Lowdie} from "../lowdie";
import TelegramBot from 'node-telegram-bot-api';

let bot = undefined;

async function loadBot(root: string): Promise<any> {
  const {WEBHOOK_ADDRESS, LOWDIE_TOKEN} = process.env;
  if (LOWDIE_TOKEN === undefined) {
    console.error('LOWDIE_TOKEN not defined');
    throw 'Token environment variable not defined, please add LOWDIE_TOKEN to your environment.'
  }

  const lowdie = new Lowdie();

  const bot = new TelegramBot(LOWDIE_TOKEN);
  await bot.setWebHook(WEBHOOK_ADDRESS, {certificate: root + '/crt.pem'});

  bot.on('message', async (msg) => {
    const chatId = msg['chat'].id;

    const answers = lowdie.answer(chatId, msg.text.trim());
    for (const answer of answers) {
      const input = answer.input;

      let sendOptions: TelegramBot.SendMessageOptions;
      if (input == null) {
        sendOptions = {parse_mode: 'Markdown'};
      } else {
        switch (input.type) {
          case 'none':
            sendOptions = {
              parse_mode: 'Markdown',
              reply_markup: {
                keyboard: [],
                one_time_keyboard: true,
              },
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
  });
  // TODO
  // bot.on('callback_query', async (query) => {
  //   const chatId = query.message['chat'].id;
  //
  //   const action = query.data;
  //   await bot.answerCallbackQuery(query.id, {});
  // });
  bot.on('polling_error', (m) => console.error(m));

  return bot;
}

export default async function (context, request) {
  if (bot === undefined) {
    bot = await loadBot(context.executionContext.functionDirectory);
  }

  if (request.body) {
    bot.processUpdate(request.body);
    context.res = {status: 200, body: 'ok'};
  } else {
    context.res = {status: 404, body: 'error'};
  }
}