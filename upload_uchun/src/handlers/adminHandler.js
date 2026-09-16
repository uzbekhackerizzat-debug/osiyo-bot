const db = require('../database/db');
const config = require('../config');
const { getLocale } = require('../locales');
const { mainMenuKeyboard } = require('../keyboards/menus');

function isAdmin(userId) {
  return config.ADMIN_IDS.includes(Number(userId));
}

// Map to track operator awaiting reply: { [operatorUserId]: ticketId }
const waitingGroupReplies = {};

async function sendOperatorReply(ctx, ticket, replyText) {
  const operatorName = ctx.from.first_name || 'Operator';

  db.addTicketReply(ticket.id, {
    sender_id: ctx.from.id,
    sender_name: operatorName,
    text: replyText
  });

  const user = db.getUser(ticket.user_id);
  const userLang = user?.language || ticket.language || 'uz';
  const isRu = userLang === 'ru';

  const userNotification = isRu
    ? `🔔 <b>Ответ службы поддержки на обращение #${ticket.id}:</b>\n\n` +
      `📝 <b>Ваш вопрос:</b>\n<i>«${ticket.description}»</i>\n\n` +
      `💬 <b>Ответ оператора:</b>\n«${replyText}»\n\n` +
      `<i>Оператор: Служба поддержки «OSIYO TRADE BIZNES»</i>\n\n` +
      `💬 <i>Если у вас остались вопросы, вы можете написать прямо сюда. Если вопрос решен, нажмите кнопку ниже для закрытия обращения:</i>`
    : `🔔 <b>#${ticket.id} raqamli murojaatingizga qo‘llab-quvvatlash xizmati javobi:</b>\n\n` +
      `📝 <b>Sizning savolingiz:</b>\n<i>«${ticket.description}»</i>\n\n` +
      `💬 <b>Operator javobi:</b>\n«${replyText}»\n\n` +
      `<i>Operator: "OSIYO TRADE BIZNES" Qo‘llab-quvvatlash xizmati</i>\n\n` +
      `💬 <i>Savolingiz qolgan bo‘lsa, bemalol yozishingiz mumkin. Agar masala hal bo‘lgan bo‘lsa, quyidagi tugma orqali murojaatni yoping:</i>`;

  const userCloseKb = {
    inline_keyboard: [
      [
        {
          text: isRu ? '✅ Закрыть обращение (Вопрос решен)' : '✅ Murojaatni yopish (Muammo hal bo‘ldi)',
          callback_data: `user_close_ticket_${ticket.id}`
        }
      ]
    ]
  };

  try {
    await ctx.telegram.sendMessage(ticket.user_id, userNotification, {
      parse_mode: 'HTML',
      reply_markup: userCloseKb
    });

    const confirmMsg = `✅ <b>#${ticket.id}</b> raqamli murojaatga javob foydalanuvchiga muvaffaqiyatli yetkazildi!`;
    const actionKb = {
      inline_keyboard: [
        [
          { text: '✍️ Yana javob yozish', callback_data: `admin_reply_${ticket.id}` },
          { text: '✅ Murojaatni yopish', callback_data: `admin_status_resolved_${ticket.id}` }
        ],
        [
          { text: '📋 Barcha ochiq murojaatlar', callback_data: 'list_open_tickets' }
        ]
      ]
    };

    if (ctx.message?.message_id) {
      await ctx.replyWithHTML(confirmMsg, {
        reply_to_message_id: ctx.message.message_id,
        reply_markup: actionKb
      });
    } else {
      await ctx.replyWithHTML(confirmMsg, { reply_markup: actionKb });
    }
  } catch (err) {
    console.error('Error sending reply to user:', err);
    await ctx.replyWithHTML(`⚠️ Murojaat saqlandi, lekin foydalanuvchiga yetkazib bo‘lmadi: ${err.message}`);
  }
}

async function renderOpenTicketsList(ctx) {
  const openTickets = db.getOpenTickets();

  if (openTickets.length === 0) {
    const text = `🎉 <b>Hozircha barcha murojaatlar ko‘rib chiqilgan va yopilgan!</b>\nOchiq murojaatlar mavjud emas.`;
    if (ctx.callbackQuery) {
      return ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '🔄 Ro‘yxatni yangilash', callback_data: 'list_open_tickets' }]]
        }
      });
    }
    return ctx.replyWithHTML(text);
  }

  let text = `📋 <b>OCHIQ (YOPILMAGAN) MUROJAATLAR RO‘YXATI (${openTickets.length} ta):</b>\n\n`;
  const keyboardButtons = [];

  openTickets.slice(0, 10).forEach(t => {
    const statusIcon = t.status === 'in_progress' ? '🔵 Jarayonda' : '🟡 Yangi';
    const shortDesc = (t.description || '').slice(0, 80);
    text += `• <b>#${t.id}</b> | STIR: <code>${t.inn}</code> | Tel: <code>${t.phone}</code> [${statusIcon}]\n`;
    text += `  📝 <i>«${shortDesc}${t.description.length > 80 ? '...' : ''}»</i>\n`;

    if (t.replies && t.replies.length > 0) {
      const last = t.replies[t.replies.length - 1];
      const shortReply = (last.text || '').slice(0, 60);
      const icon = last.sender_name === 'Mijoz' ? '👤' : '👨‍💻';
      text += `  ${icon} <b>So‘nggi (${last.sender_name}):</b> <i>«${shortReply}${last.text.length > 60 ? '...' : ''}»</i>\n`;
    }
    text += `\n`;

    keyboardButtons.push([
      { text: `✍️ #${t.id} ga javob`, callback_data: `admin_reply_${t.id}` },
      { text: `✅ #${t.id} ni yopish`, callback_data: `admin_status_resolved_${t.id}` }
    ]);
  });

  keyboardButtons.push([
    { text: '🔄 Ro‘yxatni yangilash', callback_data: 'list_open_tickets' }
  ]);

  const opts = {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboardButtons }
  };

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, opts);
      return ctx.answerCbQuery('Ro‘yxat yangilandi');
    } catch (e) {
      return ctx.answerCbQuery();
    }
  }
  return ctx.replyWithHTML(text, opts);
}

function setupAdminHandler(bot) {
  // /admin dashboard command
  bot.command('admin', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      return ctx.reply('⛔️ Kechirasiz, sizda admin huquqlari mavjud emas.');
    }

    const users = db.getAllUsers();
    const tickets = db.getTickets();

    const newTickets = tickets.filter(t => t.status === 'new').length;
    const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;

    let statsText = `📊 <b>OSIYO TRADE BIZNES BOT — ADMIN BOSHQARUV PANELI</b>\n\n` +
      `👥 <b>Jami foydalanuvchilar:</b> ${users.length} ta\n` +
      `📨 <b>Jami murojaatlar:</b> ${tickets.length} ta\n` +
      `• 🟡 Yangi: ${newTickets} ta\n` +
      `• 🔵 Jarayonda: ${inProgressTickets} ta\n` +
      `• 🟢 Hal qilingan / Yopilgan: ${resolvedTickets} ta\n\n` +
      `📌 <b>Tezkor buyruqlar:</b>\n` +
      `<code>/tickets</code> — Barcha ochiq murojaatlarni ko‘rish\n` +
      `<code>/reply &lt;ID&gt; &lt;javob matni&gt;</code> — Murojaatga tezkor javob yuborish\n` +
      `<i>Masalan:</i> <code>/reply 3 Tizimda sozlash yakunlandi</code>\n\n` +
      `🕒 <i>So'nggi 5 ta murojaat:</i>\n`;

    const recentTickets = [...tickets].reverse().slice(0, 5);
    if (recentTickets.length === 0) {
      statsText += `<i>Hozircha murojaatlar yo'q.</i>`;
    } else {
      recentTickets.forEach(t => {
        statsText += `• #${t.id} | STIR: <code>${t.inn}</code> | [${t.status}]\n`;
      });
    }

    await ctx.replyWithHTML(statsText);
  });

  // /tickets or /ochiq or /murojaatlar command
  bot.command(['tickets', 'ochiq', 'murojaatlar'], async (ctx) => {
    await renderOpenTicketsList(ctx);
  });

  // Action: list_open_tickets
  bot.action('list_open_tickets', async (ctx) => {
    await renderOpenTicketsList(ctx);
  });

  // /reply command for direct reply: /reply 3 Sizning muammoingiz hal qilindi
  bot.command('reply', async (ctx) => {
    const parts = ctx.message.text.split(' ');
    if (parts.length < 3) {
      return ctx.replyWithHTML('ℹ️ <b>Foydalanish:</b>\n<code>/reply &lt;ID&gt; &lt;JAVOB_MATNI&gt;</code>\n\n<i>Masalan:</i> <code>/reply 3 Tizimda sozlash yakunlandi</code>');
    }

    const ticketId = parts[1].trim();
    const replyText = parts.slice(2).join(' ').trim();

    const ticket = db.getTicketById(ticketId);
    if (!ticket) {
      return ctx.reply(`⚠️ #${ticketId} raqamli murojaat topilmadi.`);
    }

    await sendOperatorReply(ctx, ticket, replyText);
  });

  // Admin button: ✍️ Javob berish
  bot.action(/^admin_reply_(.+)$/, async (ctx) => {
    const ticketId = ctx.match[1];
    await ctx.answerCbQuery();

    const ticket = db.getTicketById(ticketId);
    if (!ticket) {
      return ctx.reply(`⚠️ #${ticketId} raqamli murojaat topilmadi.`);
    }

    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      return ctx.reply(`⚠️ #${ticketId} raqamli murojaat allaqachon yopilgan.`);
    }

    // In private chat: open wizard scene
    if (ctx.chat.type === 'private') {
      if (!isAdmin(ctx.from.id)) {
        return ctx.reply('⛔️ Ruxsat berilmagan!');
      }
      return ctx.scene.enter('admin_reply_scene', { ticketId });
    }

    // In group chat: prompt operator and set waiting state
    waitingGroupReplies[ctx.from.id] = ticketId;
    const operatorName = ctx.from.first_name || 'Operator';
    const tag = ctx.from.username ? `@${ctx.from.username}` : `<b>${operatorName}</b>`;

    await ctx.replyWithHTML(
      `✍️ ${tag}, <b>#${ticketId}</b>-raqamli murojaatga javobingizni shu yerga yozing:\n\n` +
      `<i>(Javobingizni guruhga oddiy xabar sifatida yuboring. Bekor qilish uchun: /cancel)</i>`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ Bekor qilish', callback_data: `cancel_admin_reply_${ctx.from.id}` }]
          ]
        }
      }
    );
  });

  // Cancel operator reply waiting state
  bot.action(/^cancel_admin_reply_(.+)$/, async (ctx) => {
    const adminId = ctx.match[1];
    if (String(ctx.from.id) === String(adminId) || isAdmin(ctx.from.id)) {
      delete waitingGroupReplies[adminId];
      await ctx.answerCbQuery('Bekor qilindi');
      await ctx.editMessageText('❌ Javob berish bekor qilindi.');
    } else {
      await ctx.answerCbQuery('Faqat javob berayotgan operator bekor qila oladi.', { show_alert: true });
    }
  });

  // Group reply listener: when operator replies in group
  bot.on('message', async (ctx, next) => {
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
      const text = ctx.message?.text?.trim() || '';

      // Check /cancel in group
      if (text === '/cancel' && waitingGroupReplies[ctx.from.id]) {
        delete waitingGroupReplies[ctx.from.id];
        return ctx.reply('❌ Javob berish bekor qilindi.');
      }

      // Check if this operator was waiting to reply to a ticket
      if (waitingGroupReplies[ctx.from.id] && text && !text.startsWith('/')) {
        const ticketId = waitingGroupReplies[ctx.from.id];
        delete waitingGroupReplies[ctx.from.id];

        const ticket = db.getTicketById(ticketId);
        if (ticket) {
          return sendOperatorReply(ctx, ticket, text);
        }
      }

      // Or if operator swiped/replied to a ticket message
      if (ctx.message?.reply_to_message && text && !text.startsWith('/')) {
        const replyMsg = ctx.message.reply_to_message;
        const textToSearch = replyMsg.text || replyMsg.caption || '';
        const match = textToSearch.match(/#(\d+)/i);

        if (match) {
          const ticketId = match[1];
          const ticket = db.getTicketById(ticketId);
          if (ticket) {
            return sendOperatorReply(ctx, ticket, text);
          }
        }
      }
    }
    return next();
  });

  // Admin button: ⏳ Jarayonga olish
  bot.action(/^admin_status_in_progress_(.+)$/, async (ctx) => {
    const ticketId = ctx.match[1];
    const updated = db.updateTicketStatus(ticketId, 'in_progress');
    if (!updated) {
      return ctx.answerCbQuery('Murojaat topilmadi!', { show_alert: true });
    }

    await ctx.answerCbQuery(`Murojaat #${ticketId} jarayonga olindi!`);
    await ctx.replyWithHTML(`🔵 Murojaat <b>#${ticketId}</b> holati <i>«Jarayonda»</i> ga o'zgartirildi.`);
  });

  // Admin button: ✅ Yopish (Resolved)
  bot.action(/^admin_status_resolved_(.+)$/, async (ctx) => {
    const ticketId = ctx.match[1];
    await ctx.answerCbQuery(`Murojaat #${ticketId} yopildi!`);

    const updated = db.updateTicketStatus(ticketId, 'resolved');
    if (!updated) {
      return ctx.replyWithHTML(`⚠️ #${ticketId} raqamli murojaat topilmadi.`);
    }

    await ctx.replyWithHTML(
      `🟢 <b>#${ticketId}</b> raqamli murojaat operator tomonidan <b>yopildi (hal qilindi)</b>.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Barcha ochiq murojaatlar', callback_data: 'list_open_tickets' }]
          ]
        }
      }
    );

    // Notify user in their language
    try {
      const user = db.getUser(updated.user_id);
      const isRu = user?.language === 'ru';
      const msg = isRu
        ? `✅ <b>Ваше обращение #${updated.id} закрыто специалистом службы поддержки.</b>\n\nСпасибо за обращение в «OSIYO TRADE BIZNES»!`
        : `✅ <b>#${updated.id}-raqamli murojaatingiz qo‘llab-quvvatlash xizmati tomonidan hal qilindi va yopildi.</b>\n\n"OSIYO TRADE BIZNES" xizmatidan foydalanganingiz uchun rahmat!`;
      await ctx.telegram.sendMessage(updated.user_id, msg, { parse_mode: 'HTML' });
    } catch (e) {}
  });

  // User button: ✅ Murojaatni yopish (Muammo hal bo'ldi)
  bot.action(/^user_close_ticket_(.+)$/, async (ctx) => {
    const ticketId = ctx.match[1];
    await ctx.answerCbQuery();

    const ticket = db.updateTicketStatus(ticketId, 'resolved');
    if (!ticket) return;

    const user = db.getUser(ticket.user_id);
    const isRu = (ctx.session?.lang || user?.language) === 'ru';

    const userMsg = isRu
      ? `✅ <b>Обращение #${ticketId} закрыто.</b>\n\nСпасибо за обращение в службу поддержки «OSIYO TRADE BIZNES»!`
      : `✅ <b>#${ticketId}-raqamli murojaatingiz yopildi.</b>\n\n"OSIYO TRADE BIZNES" xizmatidan foydalanganingiz uchun rahmat!`;

    await ctx.replyWithHTML(userMsg, mainMenuKeyboard(isRu ? 'ru' : 'uz'));

    // Notify support group
    const targetGroup = db.getSetting('support_group_id') || config.SUPPORT_GROUP_ID;
    if (targetGroup) {
      try {
        await ctx.telegram.sendMessage(
          targetGroup,
          `🟢 <b>#${ticketId}-raqamli murojaat mijoz tomonidan yopildi (Muammo hal bo‘ldi deb belgilandi).</b>`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📋 Barcha ochiq murojaatlar', callback_data: 'list_open_tickets' }]
              ]
            }
          }
        );
      } catch (e) {}
    }
  });
}

module.exports = {
  setupAdminHandler,
  isAdmin
};
