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
  await ctx.reply(loc.main_menu_title, mainMenuKeyboard(lang));
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`[Telegraf Error] update type: ${ctx.updateType}`, err);
});

// Start bot
(async () => {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    const me = await bot.telegram.getMe();
    console.log('----------------------------------------------------');
    console.log(`🚀 OSIYO TRADE BIZNES bot (@${me.username}) muvaffaqiyatli ishga tushdi!`);
    console.log(`📌 Bot nomi: ${me.first_name}`);
    console.log(`📌 Node.js: ${process.version}`);
    console.log('----------------------------------------------------');
    await bot.launch({ dropPendingUpdates: true });
  } catch (err) {
    console.error('❌ Botni ishga tushirishda xatolik yuz berdi:', err.message);
  }
})();

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
