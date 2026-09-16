const { Scenes } = require('telegraf');
const db = require('../database/db');
const { getLocale } = require('../locales');
const {
  mainMenuKeyboard,
  cancelKeyboard,
  phoneRequestKeyboard,
  adminTicketInlineKeyboard
} = require('../keyboards/menus');
const config = require('../config');

const ticketWizard = new Scenes.WizardScene(
  'ticket_wizard',

  // 1-qadam: STIR / JShShIR kiritish
  async (ctx) => {
    const lang = ctx.session?.lang || 'uz';
    const loc = getLocale(lang);

    ctx.wizard.state.ticketData = {
      user_id: ctx.from.id,
      user_first_name: ctx.from.first_name || '',
      user_username: ctx.from.username || '',
      attachments: []
    };

    await ctx.reply(loc.step_1_stir, cancelKeyboard(lang));
    return ctx.wizard.next();
  },

  // 2-qadam: STIR qabul qilish, Telefon raqam so'rash
  async (ctx) => {
    const lang = ctx.session?.lang || 'uz';
    const loc = getLocale(lang);
    const text = ctx.message?.text?.trim() || '';

    if (text === loc.btn_cancel || text === '/cancel') {
      await ctx.reply(loc.ticket_cancelled, mainMenuKeyboard(lang));
      return ctx.scene.leave();
    }

    // Faqat raqamlar: aynan 9 yoki 14 xonali sonlar bo'lishi shart!
    const cleanInn = text.replace(/[\s-]/g, '');
    if (!/^\d{9}$/.test(cleanInn) && !/^\d{14}$/.test(cleanInn)) {
      const errorMsg = lang === 'ru'
        ? "⚠️ Пожалуйста, введите только 9 или 14 цифр (буквы и символы не принимаются):"
        : "⚠️ Iltimos, faqat 9 yoki 14 xonali son kiriting (harflar yoki belgilar qabul qilinmaydi):";
      await ctx.reply(errorMsg, cancelKeyboard(lang));
      return;
    }

    ctx.wizard.state.ticketData.inn = cleanInn;
    await ctx.reply(loc.step_2_phone, phoneRequestKeyboard(lang));
    return ctx.wizard.next();
  },

  // 3-qadam: Telefon raqamni qabul qilish, Murojaat matnini so'rash
  async (ctx) => {
    const lang = ctx.session?.lang || 'uz';
    const loc = getLocale(lang);
    let rawPhone = '';

    if (ctx.message?.text === loc.btn_cancel || ctx.message?.text === '/cancel') {
      await ctx.reply(loc.ticket_cancelled, mainMenuKeyboard(lang));
      return ctx.scene.leave();
    }

    if (ctx.message?.contact) {
      rawPhone = ctx.message.contact.phone_number || '';
    } else if (ctx.message?.text) {
      rawPhone = ctx.message.text.trim();
    }

    // Telefon raqam tekshiruvi: faqat raqamlar, faqat 991234567, +998991234567 yoki 998991234567
    const cleanPhone = rawPhone.replace(/[\s\-()]/g, '');
    let finalPhone = '';

    if (/^\d{9}$/.test(cleanPhone)) {
      finalPhone = `+998${cleanPhone}`;
    } else if (/^\+998\d{9}$/.test(cleanPhone)) {
      finalPhone = cleanPhone;
    } else if (/^998\d{9}$/.test(cleanPhone)) {
      finalPhone = `+${cleanPhone}`;
    } else {
      const errorMsg = lang === 'ru'
        ? "⚠️ Номер телефона введен неверно!\n\nПожалуйста, введите номер без букв и символов, только в одном из следующих форматов:\n• <code>991234567</code>\n• <code>+998991234567</code>\n• <code>998991234567</code>"
        : "⚠️ Telefon raqami noto‘g‘ri kiritildi!\n\nIltimos, harf yoki keraksiz belgilarsiz, faqat quyidagi formatlardan birida kiriting:\n• <code>991234567</code>\n• <code>+998991234567</code>\n• <code>998991234567</code>";
      await ctx.replyWithHTML(errorMsg, phoneRequestKeyboard(lang));
      return;
    }

    ctx.wizard.state.ticketData.phone = finalPhone;

    // To'g'ridan-to'g'ri murojaat matnini so'raymiz
    const promptText = lang === 'ru'
      ? "3️⃣ Опишите ваш вопрос или проблему как можно подробнее, при необходимости прикрепите файл:"
      : "3️⃣ Savolingizni yoki muammoni imkon qadar aniq yozing, zarurat bo‘lsa, faylni biriktiring:";

    await ctx.reply(promptText, cancelKeyboard(lang));
    return ctx.wizard.next();
  },

  // 4-qadam: Murojaat matni/faylini qabul qilish va saqlash
  async (ctx) => {
    const lang = ctx.session?.lang || 'uz';
    const loc = getLocale(lang);

    if (ctx.message?.text === loc.btn_cancel || ctx.message?.text === '/cancel') {
      await ctx.reply(loc.ticket_cancelled, mainMenuKeyboard(lang));
      return ctx.scene.leave();
    }

    let desc = '';
    const attachments = [];

    if (ctx.message?.text) {
      desc = ctx.message.text.trim();
    } else if (ctx.message?.photo) {
      desc = ctx.message.caption || '(Rasm biriktirildi)';
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      attachments.push({
        type: 'photo',
        file_id: photo.file_id,
        file_unique_id: photo.file_unique_id
      });
    } else if (ctx.message?.document) {
      desc = ctx.message.caption || `(Hujjat: ${ctx.message.document.file_name || 'fayl'})`;
      attachments.push({
        type: 'document',
        file_id: ctx.message.document.file_id,
        file_name: ctx.message.document.file_name
      });
    }

    if (!desc) {
      const promptText = lang === 'ru'
        ? "3️⃣ Опишите ваш вопрос или проблему как можно подробнее, при необходимости прикрепите файл:"
        : "3️⃣ Savolingizni yoki muammoni imkon qadar aniq yozing, zarurat bo‘lsa, faylni biriktiring:";
      await ctx.reply(promptText, cancelKeyboard(lang));
      return;
    }

    ctx.wizard.state.ticketData.description = desc;
    ctx.wizard.state.ticketData.attachments = attachments;

    // Save ticket in database with user's language
    ctx.wizard.state.ticketData.language = lang;
    const ticket = db.createTicket(ctx.wizard.state.ticketData);

    // 1-xabar: Ro'yxatdan o'tganlik haqida
    const msg1 = lang === 'ru'
      ? `📝 Обращение ${ticket.id} зарегистрировано.`
      : `📝 Murojaat ${ticket.id} raqami ostida ro‘yxatdan o‘tkazildi.`;
    await ctx.reply(msg1);

    // 2-xabar: Ishga qabul qilindi + Asosiy menyu
    const msg2 = lang === 'ru'
      ? `📩\nОбращение #${ticket.id} принято в работу. \nПожалуйста, дождитесь ответа оператора.`
      : `📩\nMurojaat #${ticket.id} ishga qabul qilindi. \nIltimos, operator javobini kuting.`;
    await ctx.reply(msg2, mainMenuKeyboard(lang));

    // Send notification to Admin & Group (in user's chosen language!)
    await notifyAdminsAboutTicket(ctx, ticket);

    return ctx.scene.leave();
  }
);

async function notifyAdminsAboutTicket(ctx, ticket) {
  const isRu = ticket.language === 'ru';
  const timeFormatted = new Date(ticket.created_at).toLocaleString(isRu ? 'ru-RU' : 'uz-UZ', { timeZone: 'Asia/Tashkent' });

  const adminMsg = isRu
    ? `🚨 <b>НОВОЕ ОБРАЩЕНИЕ #${ticket.id}</b>\n\n` +
      `👤 <b>Пользователь:</b> ${ticket.user_first_name} (@${ticket.user_username || 'нет_юзернейма'}) [ID: <code>${ticket.user_id}</code>]\n` +
      `🏢 <b>ИНН / ПИНФЛ:</b> <code>${ticket.inn}</code>\n` +
      `📞 <b>Телефон:</b> <code>${ticket.phone}</code>\n` +
      `🕒 <b>Время:</b> ${timeFormatted}\n\n` +
      `📝 <b>Суть обращения:</b>\n${ticket.description}`
    : `🚨 <b>YANGI MUROJAAT #${ticket.id}</b>\n\n` +
      `👤 <b>Foydalanuvchi:</b> ${ticket.user_first_name} (@${ticket.user_username || 'username_yoq'}) [ID: <code>${ticket.user_id}</code>]\n` +
      `🏢 <b>STIR / JShShIR:</b> <code>${ticket.inn}</code>\n` +
      `📞 <b>Telefon:</b> <code>${ticket.phone}</code>\n` +
      `🕒 <b>Vaqt:</b> ${timeFormatted}\n\n` +
      `📝 <b>Murojaat mazmuni:</b>\n${ticket.description}`;

  const dynamicGroup = db.getSetting('support_group_id');
  const targetGroup = dynamicGroup || config.SUPPORT_GROUP_ID;

  // Agar guruh ulangan bo'lsa, xabar FAQAT guruhga boradi (bot ichiga emas!)
  let recipients = [];
  if (targetGroup) {
    recipients = [targetGroup];
  } else {
    // Agar guruh hali belgilanmagan bo'lsa, adminlarga boradi (lekin murojaat egasiga emas)
    recipients = [...config.ADMIN_IDS].filter(id => Number(id) !== Number(ticket.user_id));
  }

  const keyboard = adminTicketInlineKeyboard(ticket.id, ticket.language || 'uz');

  for (const adminId of recipients) {
    try {
      if (ticket.attachments && ticket.attachments.length > 0) {
        for (const att of ticket.attachments) {
          if (att.type === 'photo') {
            await ctx.telegram.sendPhoto(adminId, att.file_id, {
              caption: adminMsg,
              parse_mode: 'HTML',
              ...keyboard
            });
          } else if (att.type === 'document') {
            await ctx.telegram.sendDocument(adminId, att.file_id, {
              caption: adminMsg,
              parse_mode: 'HTML',
              ...keyboard
            });
          }
        }
      } else {
        await ctx.telegram.sendMessage(adminId, adminMsg, {
          parse_mode: 'HTML',
          ...keyboard
        });
      }
    } catch (err) {
      console.error(`Failed to notify admin ${adminId}:`, err.message);

      // Supergroup format retry if -100 prefix was missing
      const idStr = String(adminId).trim();
      if (idStr.startsWith('-') && !idStr.startsWith('-100')) {
        const supergroupId = '-100' + idStr.slice(1);
        try {
          console.log(`Retrying with supergroup ID format: ${supergroupId}...`);
          if (ticket.attachments && ticket.attachments.length > 0) {
            for (const att of ticket.attachments) {
              if (att.type === 'photo') {
                await ctx.telegram.sendPhoto(supergroupId, att.file_id, {
                  caption: adminMsg,
                  parse_mode: 'HTML',
                  ...adminTicketInlineKeyboard(ticket.id)
                });
              } else if (att.type === 'document') {
                await ctx.telegram.sendDocument(supergroupId, att.file_id, {
                  caption: adminMsg,
                  parse_mode: 'HTML',
                  ...adminTicketInlineKeyboard(ticket.id)
                });
              }
            }
          } else {
            await ctx.telegram.sendMessage(supergroupId, adminMsg, {
              parse_mode: 'HTML',
              ...adminTicketInlineKeyboard(ticket.id)
            });
          }
          console.log(`✅ Supergroup retry succeeded for ${supergroupId}! Saving as active group.`);
          db.setSetting('support_group_id', supergroupId);
        } catch (retryErr) {
          console.error(`Supergroup retry also failed for ${supergroupId}:`, retryErr.message);
        }
      }
    }
  }
}

module.exports = ticketWizard;
