const { Telegraf, Scenes, session } = require('telegraf');
const config = require('./config');
const db = require('./database/db');
const { getLocale, locales } = require('./locales');
const { languageKeyboard, mainMenuKeyboard, faqInlineKeyboard } = require('./keyboards/menus');

// Scenes
const ticketWizard = require('./scenes/ticketWizard');
const checkCodeScene = require('./scenes/checkCodeScene');
const adminReplyScene = require('./scenes/adminReplyScene');

// Handlers
const { setupFAQHandler } = require('./handlers/faqHandler');
const { setupTicketsHandler, renderUserTickets } = require('./handlers/ticketsHandler');
const { setupAdminHandler } = require('./handlers/adminHandler');

if (!config.BOT_TOKEN) {
  console.error('\n❌ XATOLIK: BOT_TOKEN ko\'rsatilmagan!');
  console.error('Iltimos, .env faylida BOT_TOKEN=... parametrini kiriting.\n');
  process.exit(1);
}

const bot = new Telegraf(config.BOT_TOKEN);

// Configure Stages & Scenes
const stage = new Scenes.Stage([ticketWizard, checkCodeScene, adminReplyScene]);

// Middlewares
bot.use(session());
bot.use(stage.middleware());

// User tracking & Language middleware
bot.use(async (ctx, next) => {
  if (ctx.from) {
    let user = db.getUser(ctx.from.id);
    if (!user) {
      user = db.saveUser({
        id: ctx.from.id,
        first_name: ctx.from.first_name || '',
        username: ctx.from.username || '',
        language: ctx.session?.lang || 'uz'
      });
    }

    if (!ctx.session) ctx.session = {};
    ctx.session.lang = user.language || 'uz';
  }
  return next();
});

// /start command
bot.start(async (ctx) => {
  const user = db.getUser(ctx.from.id);

  // If user hasn't explicitly chosen language yet
  if (!user || !user.language_set) {
    return ctx.replyWithHTML(locales.uz.choose_language, languageKeyboard());
  }

  const lang = user.language || 'uz';
  const loc = getLocale(lang);
  return ctx.replyWithHTML(loc.welcome, mainMenuKeyboard(lang));
});

// Language selection callbacks
bot.action('set_lang_uz', async (ctx) => {
  await ctx.answerCbQuery();
  db.saveUser({ id: ctx.from.id, language: 'uz', language_set: true });
  if (ctx.session) ctx.session.lang = 'uz';

  await ctx.replyWithHTML(locales.uz.lang_selected);
  await ctx.replyWithHTML(locales.uz.welcome, mainMenuKeyboard('uz'));
});

bot.action('set_lang_ru', async (ctx) => {
  await ctx.answerCbQuery();
  db.saveUser({ id: ctx.from.id, language: 'ru', language_set: true });
  if (ctx.session) ctx.session.lang = 'ru';

  await ctx.replyWithHTML(locales.ru.lang_selected);
  await ctx.replyWithHTML(locales.ru.welcome, mainMenuKeyboard('ru'));
});

// Main menu listeners (Only 3 buttons: Yangi murojaat, Mening murojaatlarim, Tilni o'zgartirish)
bot.hears([locales.uz.menu_new_ticket, locales.ru.menu_new_ticket, /yangi murojaat/i, /создать обращение/i], async (ctx) => {
  await ctx.scene.enter('ticket_wizard');
});

bot.hears([locales.uz.menu_my_tickets, locales.ru.menu_my_tickets, /mening murojaatlarim/i, /мои обращения/i], async (ctx) => {
  const lang = ctx.session?.lang || 'uz';
  await renderUserTickets(ctx, lang);
});

bot.hears([locales.uz.menu_change_lang, locales.ru.menu_change_lang, /til/i, /язык/i], async (ctx) => {
  await ctx.replyWithHTML(locales.uz.choose_language, languageKeyboard());
});

// Register specialized handlers
setupFAQHandler(bot);
setupTicketsHandler(bot);
setupAdminHandler(bot);

// Group management & ID helpers
bot.command(['id', 'chatid', 'groupid'], async (ctx) => {
  await ctx.replyWithHTML(
    `🆔 <b>Chat ID:</b> <code>${ctx.chat.id}</code>\n` +
    `📂 <b>Chat turi:</b> ${ctx.chat.type}\n` +
    `📌 <b>Nomi:</b> ${ctx.chat.title || ctx.chat.first_name || 'Noma\'lum'}`
  );
});

bot.command('setgroup', async (ctx) => {
  if (ctx.chat.type === 'private') {
    return ctx.reply('⚠️ Ushbu buyruqni murojaatlar kelib tushishi kerak bo\'lgan guruh ichida yozing.');
  }

  const { isAdmin } = require('./handlers/adminHandler');
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('⛔️ Faqat bot administratori guruhni sozlay oladi.');
  }

  db.setSetting('support_group_id', ctx.chat.id);
  await ctx.replyWithHTML(
    `✅ <b>Guruh muvaffaqiyatli ulandi!</b>\n\n` +
    `🆔 Guruh ID: <code>${ctx.chat.id}</code>\n` +
    `Endi barcha yangi murojaatlar ushbu guruhga kelib tushadi.`
  );
});

// Detect when bot is added to a group
bot.on('new_chat_members', async (ctx) => {
  const isBotAdded = ctx.message.new_chat_members.some(m => m.id === ctx.botInfo.id);
  if (isBotAdded) {
    db.setSetting('support_group_id', ctx.chat.id);
    console.log(`📢 Bot guruhga qo'shildi! Nomi: "${ctx.chat.title}", ID: ${ctx.chat.id}`);
    await ctx.replyWithHTML(
      `👋 <b>Assalomu alaykum!</b>\n\n` +
      `<b>OSIYO TRADE BIZNES</b> qo'llab-quvvatlash xizmati boti guruhga muvaffaqiyatli ulandi!\n` +
      `🆔 Guruh ID raqami: <code>${ctx.chat.id}</code>\n\n` +
      `<i>Barcha yangi murojaatlar ushbu guruhga kelib tushadi. Bot admin huquqiga ega ekanligiga ishonch hosil qiling.</i>`
    );
  }
});

// Fallback message handler (only for private chats)
bot.on('message', async (ctx) => {
  if (ctx.chat.type !== 'private') return; // Do not spam groups
  const lang = ctx.session?.lang || 'uz';
  const loc = getLocale(lang);
  const text = ctx.message?.text?.trim() || '';

  // Agar mijozning ochiq (yopilmagan) murojaati bo'lsa, xabar to'g'ridan-to'g'ri guruhga yuboriladi
  const activeTicket = db.getUserActiveTicket(ctx.from.id);
  if (activeTicket && !text.startsWith('/')) {
    const isRu = lang === 'ru';
    const userMsgDesc = text || ctx.message?.caption || (ctx.message?.photo ? '(Rasm biriktirildi)' : '(Fayl biriktirildi)');

    // Murojaat mazmuniga ham qo'shimcha sifatida saqlaymiz
    db.appendTicketDescription(activeTicket.id, userMsgDesc);

    db.addTicketReply(activeTicket.id, {
      sender_id: ctx.from.id,
      sender_name: ctx.from.first_name || 'Mijoz',
      text: userMsgDesc
    });

    const targetGroup = db.getSetting('support_group_id') || config.SUPPORT_GROUP_ID;
    if (targetGroup) {
      const groupMsg = isRu
        ? `💬 <b>ДОПОЛНИТЕЛЬНОЕ СООБЩЕНИЕ ПО ОБРАЩЕНИЮ #${activeTicket.id}:</b>\n\n` +
          `👤 <b>Пользователь:</b> ${ctx.from.first_name} (@${ctx.from.username || 'нет'}) [ID: <code>${ctx.from.id}</code>]\n` +
          `🏢 <b>ИНН / ПИНФЛ:</b> <code>${activeTicket.inn}</code>\n` +
          `📞 <b>Телефон:</b> <code>${activeTicket.phone}</code>\n\n` +
          `📝 <b>Сообщение:</b>\n${userMsgDesc}`
        : `💬 <b>#${activeTicket.id}-MUROJAATGA MIJOZDAN QO‘SHIMCHA XABAR:</b>\n\n` +
          `👤 <b>Foydalanuvchi:</b> ${ctx.from.first_name} (@${ctx.from.username || 'yo‘q'}) [ID: <code>${ctx.from.id}</code>]\n` +
          `🏢 <b>STIR / JShShIR:</b> <code>${activeTicket.inn}</code>\n` +
          `📞 <b>Telefon:</b> <code>${activeTicket.phone}</code>\n\n` +
          `📝 <b>Xabar mazmuni:</b>\n${userMsgDesc}`;

      const replyKb = {
        inline_keyboard: [
          [
            { text: '✍️ Javob berish', callback_data: `admin_reply_${activeTicket.id}` },
            { text: '✅ Murojaatni yopish', callback_data: `admin_status_resolved_${activeTicket.id}` }
          ],
          [
            { text: '📋 Barcha ochiq murojaatlar', callback_data: 'list_open_tickets' }
          ]
        ]
      };

      try {
        if (ctx.message?.photo) {
          const photo = ctx.message.photo[ctx.message.photo.length - 1];
          await ctx.telegram.sendPhoto(targetGroup, photo.file_id, { caption: groupMsg, parse_mode: 'HTML', reply_markup: replyKb });
        } else if (ctx.message?.document) {
          await ctx.telegram.sendDocument(targetGroup, ctx.message.document.file_id, { caption: groupMsg, parse_mode: 'HTML', reply_markup: replyKb });
        } else {
          await ctx.telegram.sendMessage(targetGroup, groupMsg, { parse_mode: 'HTML', reply_markup: replyKb });
        }
      } catch (err) {
        console.error('Failed to forward client message to group:', err.message);
      }
    }

    const ackMsg = isRu
      ? `✅ <b>Ваше сообщение передано операторам по обращению #${activeTicket.id}.</b>\nПожалуйста, дождитесь ответа оператора.`
      : `✅ <b>#${activeTicket.id}-raqamli murojaatingiz bo‘yicha xabaringiz operatorlarga yetkazildi.</b>\nIltimos, operator javobini kuting.`;

    const closeKb = {
      inline_keyboard: [
        [
          {
            text: isRu ? '✅ Закрыть обращение (Вопрос решен)' : '✅ Murojaatni yopish (Muammo hal bo‘ldi)',
            callback_data: `user_close_ticket_${activeTicket.id}`
          }
        ]
      ]
    };

    return ctx.replyWithHTML(ackMsg, { reply_markup: closeKb });
  }

  await ctx.reply(loc.main_menu_title, mainMenuKeyboard(lang));
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`[Telegraf Error] update type: ${ctx?.updateType}`, err);
});

// Process-level safety: prevent crash on unhandled rejections or network blips
process.on('uncaughtException', (err) => {
  console.error('⚠️ [Uncaught Exception]:', err.message);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Unhandled Rejection]:', reason);
});

// Start HTTP health server for Render / Cloud hosting (Port 10000 is default on Render)
const http = require('http');
const PORT = parseInt(process.env.PORT || '10000', 10);
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('OK - OSIYO TRADE BIZNES Bot is running 24/7!\n');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Web health server running on port ${PORT}`);
});

// Start bot
(async () => {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: false });
    const me = await bot.telegram.getMe();
    console.log('----------------------------------------------------');
    console.log(`🚀 OSIYO TRADE BIZNES bot (@${me.username}) muvaffaqiyatli ishga tushdi!`);
    console.log(`📌 Bot nomi: ${me.first_name}`);
    console.log(`📌 Node.js: ${process.version}`);
    console.log(`📌 Port: ${PORT}`);
    console.log('----------------------------------------------------');
    await bot.launch();
  } catch (err) {
    console.error('❌ Botni ishga tushirishda xatolik yuz berdi:', err.message);
  }
})();

// Graceful stop
process.once('SIGINT', () => {
  server.close();
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  server.close();
  bot.stop('SIGTERM');
});

