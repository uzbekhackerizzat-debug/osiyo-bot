const { Scenes } = require('telegraf');
const db = require('../database/db');
const { getLocale } = require('../locales');

const adminReplyScene = new Scenes.WizardScene(
  'admin_reply_scene',
  // Step 1: Prompt admin for reply text
  async (ctx) => {
    const ticketId = ctx.wizard.state.ticketId;
    await ctx.replyWithHTML(
      `✍️ <b>#${ticketId} raqamli murojaatga javob yozing:</b>\n\n<i>Bekor qilish uchun /cancel deb yozing.</i>`
    );
    return ctx.wizard.next();
  },

  // Step 2: Receive reply text & send to user
  async (ctx) => {
    const ticketId = ctx.wizard.state.ticketId;
    const text = ctx.message?.text?.trim();

    if (text === '/cancel') {
      await ctx.reply('❌ Javob berish bekor qilindi.');
      return ctx.scene.leave();
    }

    if (!text) {
      await ctx.reply('Iltimos, matn ko\'rinishida javob yozing:');
      return;
    }

    const ticket = db.getTicketById(ticketId);
    if (!ticket) {
      await ctx.reply(`⚠️ #${ticketId} raqamli murojaat topilmadi.`);
      return ctx.scene.leave();
    }

    const adminName = ctx.from.first_name || 'Operator';
    db.addTicketReply(ticketId, {
      sender_id: ctx.from.id,
      sender_name: adminName,
      text: text
    });

    // Notify the user in their language
    const user = db.getUser(ticket.user_id);
    const userLang = user?.language || 'uz';
    const loc = getLocale(userLang);

    const userNotification = userLang === 'ru'
      ? `🔔 <b>Ответ службы поддержки на обращение #${ticket.id}:</b>\n\n` +
        `«${text}»\n\n` +
        `<i>Оператор: Служба поддержки «OSIYO TRADE BIZNES»</i>\n\n` +
        `📋 Просмотреть историю обращения вы можете в разделе «Мои обращения».`
      : `🔔 <b>#${ticket.id} raqamli murojaatingizga qo'llab-quvvatlash xizmati javobi:</b>\n\n` +
        `«${text}»\n\n` +
        `<i>Operator: "OSIYO TRADE BIZNES" Qo'llab-quvvatlash xizmati</i>\n\n` +
        `📋 Murojaat tarixini "Mening murojaatlarim" bo'limida ko'rishingiz mumkin.`;

    try {
      await ctx.telegram.sendMessage(ticket.user_id, userNotification, {
        parse_mode: 'HTML'
      });
      await ctx.replyWithHTML(`✅ Javob foydalanuvchiga (ID: <code>${ticket.user_id}</code>) muvaffaqiyatli yetkazildi!`);
    } catch (err) {
      console.error('Failed to deliver reply to user:', err);
      await ctx.replyWithHTML(`⚠️ Murojaat bazada yangilandi, lekin foydalanuvchiga xabar yetkazib bo'lmadi (botni bloklagan bo'lishi mumkin): ${err.message}`);
    }

    return ctx.scene.leave();
  }
);

module.exports = adminReplyScene;
