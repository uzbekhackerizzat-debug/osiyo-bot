module.exports = {
  // Common buttons
  btn_back: "⬅️ Orqaga",
  btn_cancel: "❌ Bekor qilish",
  btn_confirm: "✅ Tasdiqlash va yuborish",
  btn_share_contact: "📱 Kontaktni ulashish",

  // Main menu buttons (only 3 as requested)
  menu_new_ticket: "📝 Yangi murojaat",
  menu_my_tickets: "📋 Mening murojaatlarim",
  menu_change_lang: "🌐 Tilni o‘zgartirish",

  my_tickets_title: "📋 <b>Sizning murojaatlaringiz:</b>",
  no_tickets: "Sizda hali yuborilgan murojaatlar mavjud emas.",
  status_new: "🟡 Yangi (Ko'rib chiqilmoqda)",
  status_in_progress: "🔵 Jarayonda",
  status_resolved: "🟢 Javob berilgan",
  status_closed: "⚪️ Yopilgan",
  no_replies_yet: "<i>Hozircha javob berilmagan. Operator ko'rib chiqmoqda.</i>",
  ticket_detail: `📄 <b>Murojaat tafsilotlari #{id}</b>\n\n` +
    `📊 <b>Holat:</b> {status}\n` +
    `🏢 <b>STIR / JShShIR:</b> <code>{inn}</code>\n` +
    `📞 <b>Telefon:</b> <code>{phone}</code>\n` +
    `📅 <b>Sana:</b> {date}\n\n` +
    `📝 <b>Murojaat mazmuni:</b>\n{desc}\n\n` +
    `💬 <b>Operator javoblari:</b>\n{replies}`,

  // Start & Welcome
  choose_language: "Assalomu alaykum! Iltimos, muloqot tilini tanlang:\nЗдравствуйте! Пожалуйста, выберите язык обслуживания:",
  lang_selected: "🇺🇿 O'zbek tili tanlandi.",
  welcome: `🇺🇿 <b>OSIYO TRADE BIZNES</b>

Assalomu alaykum! OSIYO TRADE BIZNES mijozlari qo‘llab-quvvatlash xizmatiga xush kelibsiz.

Kerakli bo‘limni tanlang:`,

  main_menu_title: "Asosiy menyu:",

  // Steps matching screenshot exactly
  step_1_stir: `1️⃣ Iltimos, tashkilotning STIR raqamini yoki JShShIRni kiriting (agar mavjud bo‘lsa):`,
  step_1_stir_error: `⚠️ STIR yoki JShShIR raqami noto'g'ri kiritildi. Iltimos, faqat raqamlardan iborat 9 yoki 14 xonali kodni kiriting (yoki /cancel deb bekor qiling):`,

  step_2_phone: `2️⃣ Telefon raqamingizni kiriting yoki '📱 Kontaktni ulashish' tugmasini bosing:`,
  step_2_phone_error: `⚠️ Telefon raqami noto'g'ri formatda. Iltimos, quyidagi tugmadan foydalaning yoki +998901234567 ko'rinishida yuboring:`,

  step_3_product_group: `3️⃣ Savolingiz tegishli bo'lgan mahsulot guruhini tanlang:`,
  
  // Product Groups
  group_pharma: "💊 Dori vositalari",
  group_tobacco: "🚬 Tamaki",
  group_alcohol: "🍾 Alkogol",
  group_beer: "🍺 Pivo",
  group_water: "💧 Suv va salqin ichimliklar",
  group_appliances: "📱 Maishiy texnika",
  group_other: "📦 Boshqa",

  step_4_role: `4️⃣ Tashkilotingizning mahsulot aylanmasi zanjiridagi rolini ko‘rsating:`,
  
  // Roles
  role_manufacturer: "🏭 Ishlab chiqaruvchi",
  role_importer: "🚢 Import qiluvchi",
  role_wholesale: "📦 Ulgurji bo'g'in",
  role_retail: "🏪 Chakana bo'g'in",
  role_consumer: "👤 Iste'molchi",

  step_5_topic: `5️⃣ Murojaat mavzusini tanlang:`,
  
  // Topics
  topic_check_code: "Markirovka kodini tekshirish",
  topic_reg_ecp: "Ro'yxatdan o'tish va ERI",
  topic_order_codes: "Kodlarga buyurtma berish (СУЗ)",
  topic_edo: "Hujjatlar aylanishi (ЭДО)",
  topic_aggregation: "Agregatsiya va hisobdan chiqarish",
  topic_mobile_app: "Mobil ilova bilan ishlash",
  topic_other_tech: "Boshqa texnik masala",

  step_6_desc: `6️⃣ Savolingizni yoki muammoni imkon qadar aniq yozing, zarurat bo‘lsa, faylni biriktiring:`,

  // Confirmation messages (matching screenshot exactly)
  ticket_created_summary: `📝 Murojaatingiz muvaffaqiyatli yaratildi:\n` +
    `STIR: {stir}\n` +
    `Telefon: {telefon}\n` +
    `Mahsulot turi: {mahsulot_turi}\n` +
    `Roli: {roli}\n` +
    `Mavzu: {mavzu}\n` +
    `Murojaat: {murojaat}`,

  ticket_registered_num: `📝 Murojaat {ticket_id} raqami ostida ro‘yxatdan o‘tkazildi.`,

  ticket_accepted_notice: `📩\n` +
    `Murojaat #{ticket_id} ishga qabul qilindi. \n` +
    `Iltimos, operator javobini kuting.\n` +
    `➡️Raqamli markirovka yangiliklari`,

  btn_markirovka_news: "➡️ Raqamli markirovka yangiliklari",

  ticket_cancelled: "❌ Murojaat yaratish bekor qilindi.",

  // Contacts info
  contacts_info: `📞 <b>ASL BELGISI. Aloqa markazi</b>\n\n` +
    `☎️ Yagona Call-markaz: +998 (71) 203-88-72\n` +
    `📧 E-mail: support@crpt-turon.uz\n` +
    `🌐 Rasmiy sayt: https://crpt-turon.uz\n` +
    `📚 Ma'lumot markazi: https://help.crpt-turon.uz\n` +
    `📢 Telegram kanal: @aslbelgisi\n\n` +
    `🕒 Ish vaqti: Har kuni (Dushanba – Yakshanba)`
};
