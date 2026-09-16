const db = require('../database/db');
const config = require('../config');
const { getLocale } = require('../locales');

function isAdmin(userId) {
  return config.ADMIN_IDS.includes(Number(userId));
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
      `• 🟢 Hal qilingan / Javob berilgan: ${resolvedTickets} ta\n\n` +
      `📌 <b>Tezkor buyruqlar:</b>\n` +
      `<code>/reply &lt;ID&gt; &lt;javob matni&gt;</code> — Murojaatga tezkor javob yuborish\n` +
      `<i>Masalan:</i> <code>/reply AB-1001 Xatolik bartaraf etildi</code>\n\n` +
      `🕒 <i>So'nggi 5 ta murojaat:</i>\n`;

    const recentTickets = [...tickets].reverse().slice(0, 5);
    if (recentTickets.length === 0) {
      statsText += `<i>Hozircha murojaatlar yo'q.</i>`;
    } else {
      recentTickets.forEach(t => {
        statsText += `• #${t.id} | STIR: <code>${t.inn}</code> | Guruh: ${t.product_group} | [${t.status}]\n`;
      });
    }

    await ctx.replyWithHTML(statsText);
  });

  // /reply command for direct reply: /reply AB-1001 Sizning muammoingiz hal qilindi
  bot.command('reply', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      return ctx.reply('⛔️ Ushbu buyruq faqat administratorlar uchun.');
    }

    const parts = ctx.message.text.split(' ');
    if (parts.length < 3) {
      return ctx.replyWithHTML('ℹ️ <b>Foydalanish:</b>\n<code>/reply &lt;TICKET_ID&gt; &lt;JAVOB_MATNI&gt;</code>\n\n<i>Masalan:</i> <code>/reply AB-1001 Tizimda sozlash yakunlandi</code>');
    }

    const ticketId = parts[1].trim().toUpperCase();
    const replyText = parts.slice(2).join(' ').trim();

    const ticket = db.getTicketById(ticketId);
    if (!ticket) {
      return ctx.reply(`⚠️ #${ticketId} raqamli murojaat topilmadi.`);
    }

    db.addTicketReply(ticketId, {
      sender_id: ctx.from.id,
      sender_name: ctx.from.first_name || 'Operator',
      text: replyText
    });

    // Notify user in their language
    const user = db.getUser(ticket.user_id);
    const userLang = user?.language || 'uz';

    const userNotification = userLang === 'ru'
      ? `🔔 <b>Ответ службы поддержки на обращение #${ticket.id}:</b>\n\n` +
        `📝 <b>Ваш вопрос:</b>\n<i>«${ticket.description}»</i>\n\n` +
        `💬 <b>Ответ оператора:</b>\n«${replyText}»\n\n` +
        `<i>Оператор: Служба поддержки «OSIYO TRADE BIZNES»</i>`
      : `🔔 <b>#${ticket.id} raqamli murojaatingizga qo'llab-quvvatlash xizmati javobi:</b>\n\n` +
        `📝 <b>Sizning savolingiz:</b>\n<i>«${ticket.description}»</i>\n\n` +
        `💬 <b>Operator javobi:</b>\n«${replyText}»\n\n` +
        `<i>Operator: "OSIYO TRADE BIZNES" Qo'llab-quvvatlash xizmati</i>`;

    try {
      await ctx.telegram.sendMessage(ticket.user_id, userNotification, {
        parse_mode: 'HTML'
      });
      await ctx.replyWithHTML(`✅ Javob foydalanuvchiga muvaffaqiyatli yetkazildi (#${ticket.id})!`);
    } catch (err) {
      console.error('Error sending reply to user:', err);
      await ctx.replyWithHTML(`⚠️ Murojaat saqlandi, lekin foydalanuvchiga yetkazib bo'lmadi: ${err.message}`);
    }
  });

  // Admin button: ✍️ Javob berish
  bot.action(/^admin_reply_(.+)$/, async (ctx) => {
    const ticketId = ctx.match[1];
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
      return ctx.answerCbQuery(`✍️ Ushbu #${ticketId} xabarga "Reply" (Javob) qilib javobingizni yozing!`, { show_alert: true });
    }

    if (!isAdmin(ctx.from.id)) {
      return ctx.answerCbQuery('⛔️ Ruxsat berilmagan!', { show_alert: true });
    }

    await ctx.answerCbQuery();
    await ctx.scene.enter('admin_reply_scene', { ticketId });
  });

  // Group reply listener: when operator replies to ticket in group
  bot.on('message', async (ctx, next) => {
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
      if (ctx.message?.reply_to_message && ctx.message.text && !ctx.message.text.startsWith('/')) {
        const replyMsg = ctx.message.reply_to_message;
        const textToSearch = replyMsg.text || replyMsg.caption || '';
        const match = textToSearch.match(/YANGI MUROJAAT #(\d+)/i) || textToSearch.match(/#(\d+)/);

        if (match) {
          const ticketId = match[1];
          const ticket = db.getTicketById(ticketId);
          if (ticket) {
            const replyText = ctx.message.text.trim();
            const operatorName = ctx.from.first_name || 'Operator';

            db.addTicketReply(ticketId, {
              sender_id: ctx.from.id,
              sender_name: operatorName,
              text: replyText
            });

            const user = db.getUser(ticket.user_id);
            const isRu = user?.language === 'ru';
            const userNotification = isRu
              ? `🔔 <b>Ответ службы поддержки на обращение #${ticket.id}:</b>\n\n` +
                `📝 <b>Ваш вопрос:</b>\n<i>«${ticket.description}»</i>\n\n` +
                `💬 <b>Ответ оператора:</b>\n«${replyText}»\n\n` +
                `<i>Оператор: Служба поддержки «OSIYO TRADE BIZNES»</i>`
              : `🔔 <b>#${ticket.id} raqamli murojaatingizga qo'llab-quvvatlash xizmati javobi:</b>\n\n` +
                `📝 <b>Sizning savolingiz:</b>\n<i>«${ticket.description}»</i>\n\n` +
                `💬 <b>Operator javobi:</b>\n«${replyText}»\n\n` +
                `<i>Operator: "OSIYO TRADE BIZNES" Qo'llab-quvvatlash xizmati</i>`;

            try {
              await ctx.telegram.sendMessage(ticket.user_id, userNotification, { parse_mode: 'HTML' });
              await ctx.replyWithHTML(`✅ <b>#${ticket.id}</b> raqamli murojaatga javob foydalanuvchiga yetkazildi!`, {
                reply_to_message_id: ctx.message.message_id
              });
            } catch (err) {
              await ctx.reply(`⚠️ Javobni foydalanuvchiga yetkazib bo'lmadi: ${err.message}`);
            }
            return;
          }
        }
      }
    }
    return next();
  });

  // Admin button: ⏳ Jarayonga olish
  bot.action(/^admin_status_in_progress_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      return ctx.answerCbQuery('⛔️ Ruxsat berilmagan!', { show_alert: true });
    }

    const ticketId = ctx.match[1];
    const updated = db.updateTicketStatus(ticketId, 'in_progress');
    if (!updated) {
      return ctx.answerCbQuery('Murojaat topilmadi!', { show_alert: true });
    }

    await ctx.answerCbQuery(`Murojaat #${ticketId} jarayonga olindi!`);
    await ctx.replyWithHTML(`🔵 Murojaat <b>#${ticketId}</b> holati <i>«Jarayonda»</i> ga o'zgartirildi.`);

    // Optionally notify user
    try {
      const user = db.getUser(updated.user_id);
      const isRu = user?.language === 'ru';
      const msg = isRu
        ? `ℹ️ Ваше обращение <b>#${updated.id}</b> принято в обработку специалистом службы поддержки.`
        : `ℹ️ Sizning <b>#${updated.id}</b> raqamli murojaatingiz qo'llab-quvvatlash xizmati mutaxassisi tomonidan ko'rib chiqish jarayoniga olindi.`;
      await ctx.telegram.sendMessage(updated.user_id, msg, { parse_mode: 'HTML' });
    } catch (e) {}
  });

  // Admin button: ✅ Yopish (Resolved)
  bot.action(/^admin_status_resolved_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      return ctx.answerCbQuery('⛔️ Ruxsat berilmagan!', { show_alert: true });
    }

    const ticketId = ctx.match[1];
    const updated = db.updateTicketStatus(ticketId, 'resolved');
    if (!updated) {
      return ctx.answerCbQuery('Murojaat topilmadi!', { show_alert: true });
    }

    await ctx.answerCbQuery(`Murojaat #${ticketId} yopildi!`);
    await ctx.replyWithHTML(`🟢 Murojaat <b>#${ticketId}</b> holati <i>«Hal qilingan (Resolved)»</i> ga o'zgartirildi.`);
  });
}

module.exports = {
  setupAdminHandler,
  isAdmin
};
