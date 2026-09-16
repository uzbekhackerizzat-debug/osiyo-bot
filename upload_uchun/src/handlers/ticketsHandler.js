const { Markup } = require('telegraf');
const db = require('../database/db');
const { getLocale } = require('../locales');

function setupTicketsHandler(bot) {
  // Callback query to view details of a specific ticket
  bot.action(/^view_ticket_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const ticketId = ctx.match[1];
    const lang = ctx.session?.lang || 'uz';
    const loc = getLocale(lang);

    const ticket = db.getTicketById(ticketId);
    if (!ticket) {
      await ctx.reply('⚠️ Murojaat topilmadi / Обращение не найдено.');
      return;
    }

    const statusMap = {
      new: loc.status_new,
      in_progress: loc.status_in_progress,
      resolved: loc.status_resolved,
      closed: loc.status_closed
    };

    let repliesText = loc.no_replies_yet;
    if (ticket.replies && ticket.replies.length > 0) {
      repliesText = ticket.replies.map((r, i) => {
        const time = new Date(r.sent_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });
        return `${i + 1}. [${time}] <b>${r.sender_name}:</b>\n«${r.text}»`;
      }).join('\n\n');
    }

    const dateFormatted = new Date(ticket.created_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

    const detailText = loc.ticket_detail
      .replace('{id}', ticket.id)
      .replace('{status}', statusMap[ticket.status] || ticket.status)
      .replace('{inn}', ticket.inn)
      .replace('{group}', ticket.product_group)
      .replace('{phone}', ticket.phone)
      .replace('{date}', dateFormatted)
      .replace('{desc}', ticket.description)
      .replace('{replies}', repliesText);

    await ctx.replyWithHTML(detailText);
  });
}

function renderUserTickets(ctx, lang) {
  const loc = getLocale(lang);
  const tickets = db.getUserTickets(ctx.from.id);

  if (tickets.length === 0) {
    return ctx.replyWithHTML(loc.no_tickets);
  }

  const statusMap = {
    new: loc.status_new,
    in_progress: loc.status_in_progress,
    resolved: loc.status_resolved,
    closed: loc.status_closed
  };

  const inlineButtons = tickets.slice(0, 10).map(t => {
    return [Markup.button.callback(`📄 #${t.id} (${statusMap[t.status] || t.status})`, `view_ticket_${t.id}`)];
  });

  return ctx.replyWithHTML(
    `${loc.my_tickets_title}\n\n<i>Murojaat tafsilotlarini ko'rish uchun quyidagi ro'yxatdan keraklisini bosing:</i>`,
    Markup.inlineKeyboard(inlineButtons)
  );
}

module.exports = {
  setupTicketsHandler,
  renderUserTickets
};
