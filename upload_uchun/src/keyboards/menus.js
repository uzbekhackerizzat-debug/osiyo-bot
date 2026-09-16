const { Markup } = require('telegraf');

function languageKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("🇺🇿 O'zbekcha", 'set_lang_uz'),
      Markup.button.callback("🇷🇺 Русский", 'set_lang_ru')
    ]
  ]);
}

function mainMenuKeyboard(lang = 'uz') {
  const isRu = lang === 'ru';
  return Markup.keyboard([
    [isRu ? "📝 Создать обращение" : "📝 Yangi murojaat"],
    [isRu ? "📋 Мои обращения" : "📋 Mening murojaatlarim"],
    [isRu ? "🌐 Сменить язык" : "🌐 Tilni o‘zgartirish"]
  ]).resize();
}

function cancelKeyboard(lang = 'uz') {
  const isRu = lang === 'ru';
  return Markup.keyboard([
    [isRu ? "❌ Отмена" : "❌ Bekor qilish"]
  ]).resize();
}

function phoneRequestKeyboard(lang = 'uz') {
  const isRu = lang === 'ru';
  return Markup.keyboard([
    [Markup.button.contactRequest(isRu ? "📱 Поделиться контактом" : "📱 Kontaktni ulashish")],
    [isRu ? "❌ Отмена" : "❌ Bekor qilish"]
  ]).resize();
}

function productGroupsKeyboard(lang = 'uz') {
  const isRu = lang === 'ru';
  if (isRu) {
    return Markup.keyboard([
      ["💊 Лекарственные средства", "🚬 Табак"],
      ["🍾 Алкоголь", "🍺 Пиво"],
      ["💧 Вода и прохладительные напитки", "📱 Бытовая техника"],
      ["📦 Другое"],
      ["❌ Отмена"]
    ]).resize();
  }
  return Markup.keyboard([
    ["💊 Dori vositalari", "🚬 Tamaki"],
    ["🍾 Alkogol", "🍺 Pivo"],
    ["💧 Suv va salqin ichimliklar", "📱 Maishiy texnika"],
    ["📦 Boshqa"],
    ["❌ Bekor qilish"]
  ]).resize();
}

function rolesKeyboard(lang = 'uz') {
  const isRu = lang === 'ru';
  if (isRu) {
    return Markup.keyboard([
      ["🏭 Производитель", "🚢 Импортер"],
      ["📦 Оптовое звено", "🏪 Розничное звено"],
      ["👤 Потребитель"],
      ["❌ Отмена"]
    ]).resize();
  }
  return Markup.keyboard([
    ["🏭 Ishlab chiqaruvchi", "🚢 Import qiluvchi"],
    ["📦 Ulgurji bo'g'in", "🏪 Chakana bo'g'in"],
    ["👤 Iste'molchi"],
    ["❌ Bekor qilish"]
  ]).resize();
}

function topicsKeyboard(lang = 'uz') {
  const isRu = lang === 'ru';
  if (isRu) {
    return Markup.keyboard([
      ["Проверка кода маркировки"],
      ["Регистрация и ЭЦП"],
      ["Заказ кодов маркировки (СУЗ)"],
      ["Электронный документооборот (ЭДО)"],
      ["Агрегация и списание"],
      ["Работа с мобильным приложением"],
      ["Другой технический вопрос"],
      ["❌ Отмена"]
    ]).resize();
  }
  return Markup.keyboard([
    ["Markirovka kodini tekshirish"],
    ["Ro'yxatdan o'tish va ERI"],
    ["Kodlarga buyurtma berish (СУЗ)"],
    ["Hujjatlar aylanishi (ЭДО)"],
    ["Agregatsiya va hisobdan chiqarish"],
    ["Mobil ilova bilan ishlash"],
    ["Boshqa texnik masala"],
    ["❌ Bekor qilish"]
  ]).resize();
}

function markirovkaNewsKeyboard(lang = 'uz') {
  const isRu = lang === 'ru';
  return Markup.inlineKeyboard([
    [Markup.button.url(isRu ? "➡️ Новости цифровой маркировки" : "➡️ Raqamli markirovka yangiliklari", 'https://t.me/aslbelgisi')]
  ]);
}

function adminTicketInlineKeyboard(ticketId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✍️ Javob berish', `admin_reply_${ticketId}`),
      Markup.button.callback('⏳ Jarayonga olish', `admin_status_in_progress_${ticketId}`)
    ],
    [
      Markup.button.callback('✅ Yopish (Resolved)', `admin_status_resolved_${ticketId}`)
    ]
  ]);
}

module.exports = {
  languageKeyboard,
  mainMenuKeyboard,
  cancelKeyboard,
  phoneRequestKeyboard,
  productGroupsKeyboard,
  rolesKeyboard,
  topicsKeyboard,
  markirovkaNewsKeyboard,
  adminTicketInlineKeyboard
};
