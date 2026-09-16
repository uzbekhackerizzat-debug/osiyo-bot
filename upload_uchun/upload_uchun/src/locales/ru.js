module.exports = {
  // Common buttons
  btn_back: "⬅️ Назад",
  btn_cancel: "❌ Отмена",
  btn_confirm: "✅ Подтвердить и отправить",
  btn_share_contact: "📱 Поделиться контактом",

  // Main menu buttons (only 3 as requested)
  menu_new_ticket: "📝 Создать обращение",
  menu_my_tickets: "📋 Мои обращения",
  menu_change_lang: "🌐 Сменить язык",

  my_tickets_title: "📋 <b>История ваших обращений:</b>",
  no_tickets: "У вас пока нет созданных обращений.",
  status_new: "🟡 Новое (На рассмотрении)",
  status_in_progress: "🔵 В работе",
  status_resolved: "🟢 Дан ответ",
  status_closed: "⚪️ Закрыто",
  no_replies_yet: "<i>Ответа пока нет. Оператор рассматривает обращение.</i>",
  ticket_detail: `📄 <b>Детали обращения #{id}</b>\n\n` +
    `📊 <b>Статус:</b> {status}\n` +
    `🏢 <b>ИНН:</b> <code>{inn}</code>\n` +
    `📞 <b>Телефон:</b> <code>{phone}</code>\n` +
    `📦 <b>Продукция:</b> {group}\n` +
    `🏢 <b>Роль:</b> {role}\n` +
    `🎯 <b>Тема:</b> {topic}\n` +
    `📅 <b>Дата:</b> {date}\n\n` +
    `📝 <b>Обращение:</b>\n{desc}\n\n` +
    `💬 <b>Ответы оператора:</b>\n{replies}`,

  // Start & Welcome
  choose_language: "Assalomu alaykum! Iltimos, muloqot tilini tanlang:\nЗдравствуйте! Пожалуйста, выберите язык обслуживания:",
  lang_selected: "🇷🇺 Выбран русский язык.",
  welcome: `🇷🇺 <b>OSIYO TRADE BIZNES</b>

Здравствуйте! Добро пожаловать в службу поддержки клиентов компании OSIYO TRADE BIZNES.

Выберите интересующий раздел:`,

  main_menu_title: "Главное меню:",

  // Steps matching screenshot
  step_1_stir: `1️⃣ Пожалуйста, введите ИНН организации или ПИНФЛ (при наличии):`,
  step_1_stir_error: `⚠️ ИНН или ПИНФЛ введен некорректно. Пожалуйста, введите 9 или 14 цифр (или отправьте /cancel для отмены):`,

  step_2_phone: `2️⃣ Введите ваш номер телефона или нажмите кнопку «📱 Поделиться контактом»:`,
  step_2_phone_error: `⚠️ Неверный формат номера. Пожалуйста, используйте кнопку ниже или отправьте номер в виде +998901234567:`,

  step_3_product_group: `3️⃣ Выберите группу товаров, к которой относится ваш вопрос:`,
  
  // Product Groups
  group_pharma: "💊 Лекарственные средства",
  group_tobacco: "🚬 Табак",
  group_alcohol: "🍾 Алкоголь",
  group_beer: "🍺 Пиво",
  group_water: "💧 Вода и прохладительные напитки",
  group_appliances: "📱 Бытовая техника",
  group_other: "📦 Другое",

  step_4_role: `4️⃣ Укажите роль вашей организации в цепочке оборота товаров:`,
  
  // Roles
  role_manufacturer: "🏭 Производитель",
  role_importer: "🚢 Импортер",
  role_wholesale: "📦 Оптовое звено",
  role_retail: "🏪 Розничное звено",
  role_consumer: "👤 Потребитель",

  step_5_topic: `5️⃣ Выберите тему обращения:`,
  
  // Topics
  topic_check_code: "Проверка кода маркировки",
  topic_reg_ecp: "Регистрация и ЭЦП",
  topic_order_codes: "Заказ кодов маркировки (СУЗ)",
  topic_edo: "Электронный документооборот (ЭДО)",
  topic_aggregation: "Агрегация и списание",
  topic_mobile_app: "Работа с мобильным приложением",
  topic_other_tech: "Другой технический вопрос",

  step_6_desc: `6️⃣ Опишите ваш вопрос или проблему как можно подробнее, при необходимости прикрепите файл:`,

  // Confirmation messages
  ticket_created_summary: `📝 Ваше обращение успешно создано:\n` +
    `ИНН: {stir}\n` +
    `Телефон: {telefon}\n` +
    `Тип продукции: {mahsulot_turi}\n` +
    `Роль: {roli}\n` +
    `Тема: {mavzu}\n` +
    `Обращение: {murojaat}`,

  ticket_registered_num: `📝 Обращение зарегистрировано под номером {ticket_id}.`,

  ticket_accepted_notice: `📩\n` +
    `Обращение #{ticket_id} принято в работу. \n` +
    `Пожалуйста, дождитесь ответа оператора.\n` +
    `➡️Новости цифровой маркировки`,

  btn_markirovka_news: "➡️ Новости цифровой маркировки",

  ticket_cancelled: "❌ Создание обращения отменено.",

  // Contacts info
  contacts_info: `📞 <b>ASL BELGISI. Контакты поддержки</b>\n\n` +
    `☎️ Единый Call-центр: +998 (71) 203-88-72\n` +
    `📧 E-mail: support@crpt-turon.uz\n` +
    `🌐 Официальный сайт: https://crpt-turon.uz\n` +
    `📚 База знаний: https://help.crpt-turon.uz\n` +
    `📢 Telegram-канал: @aslbelgisi\n\n` +
    `🕒 График работы: Ежедневно (Пн – Вс)`
};
