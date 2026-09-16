const fs = require('fs');
const path = require('path');
const config = require('../config');

const dataDir = path.resolve(process.cwd(), config.DATA_DIR);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const usersFile = path.join(dataDir, 'users.json');
const ticketsFile = path.join(dataDir, 'tickets.json');
const productsFile = path.join(dataDir, 'products.json');
const settingsFile = path.join(dataDir, 'settings.json');

// Helper to read JSON
function readJSON(file, defaultVal = []) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2), 'utf8');
      return defaultVal;
    }
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return defaultVal;
  }
}

// Helper to write JSON safely
function writeJSON(file, data) {
  try {
    const tempFile = `${file}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, file);
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

// Initial default products for DataMatrix/Barcode test lookups
const initialProducts = [
  {
    gtin: "04780012345678",
    datamatrix_prefix: "0104780012345678",
    name_uz: "Paratsetamol 500 mg №10 tabletkalar",
    name_ru: "Парацетамол 500 мг №10 таблетки",
    group_uz: "Dori vositalari",
    group_ru: "Лекарственные средства",
    manufacturer_uz: "\"Dori-Darmon\" AJ, Toshkent, O'zbekiston",
    manufacturer_ru: "АО \"Dori-Darmon\", Ташкент, Узбекистан",
    mfg_date: "15.01.2025",
    exp_date: "15.01.2028",
    status_uz: "✅ Muomalada (Haqiqiy mahsulot)",
    status_ru: "✅ В обороте (Подлинный товар)",
    is_valid: true
  },
  {
    gtin: "04780098765432",
    datamatrix_prefix: "0104780098765432",
    name_uz: "Coca-Cola Classic 1.5L gazlangan ichimlik",
    name_ru: "Coca-Cola Classic 1.5л газированный напиток",
    group_uz: "Suv va salqin ichimliklar",
    group_ru: "Вода и прохладительные напитки",
    manufacturer_uz: "\"Coca-Cola Ichimligi Uzbekiston, LTD\" MChJ",
    manufacturer_ru: "СП ООО \"Coca-Cola Ichimligi Uzbekiston, LTD\"",
    mfg_date: "01.03.2026",
    exp_date: "01.09.2026",
    status_uz: "✅ Muomalada (Haqiqiy mahsulot)",
    status_ru: "✅ В обороте (Подлинный товар)",
    is_valid: true
  },
  {
    gtin: "04780055555555",
    datamatrix_prefix: "0104780055555555",
    name_uz: "Artel Grand Inverter Konditsioner 12HD",
    name_ru: "Кондиционер Artel Grand Inverter 12HD",
    group_uz: "Maishiy texnika vositalari",
    group_ru: "Бытовая техника",
    manufacturer_uz: "\"Artel Electronics\" MChJ, Toshkent",
    manufacturer_ru: "ООО \"Artel Electronics\", Ташкент",
    mfg_date: "20.02.2026",
    exp_date: "Kafolat: 3 yil",
    status_uz: "✅ Muomalada (Haqiqiy mahsulot)",
    status_ru: "✅ В обороте (Подлинный товар)",
    is_valid: true
  },
  {
    gtin: "04780011122233",
    datamatrix_prefix: "0104780011122233",
    name_uz: "Qalbaki / Shubhali tovar namunasi",
    name_ru: "Подозрительный / Поддельный образец",
    group_uz: "Alkogol mahsulotlari",
    group_ru: "Алкогольная продукция",
    manufacturer_uz: "Noma'lum korxona",
    manufacturer_ru: "Неизвестное предприятие",
    mfg_date: "Noma'lum",
    exp_date: "Muddati o'tgan",
    status_uz: "❌ QALBAKI YOKI SHUBHALI (Tizimda ro'yxatdan o'tmagan)",
    status_ru: "❌ ПОДДЕЛКА ИЛИ СОМНИТЕЛЬНЫЙ (Не зарегистрирован в системе)",
    is_valid: false
  }
];

if (!fs.existsSync(productsFile)) {
  writeJSON(productsFile, initialProducts);
}

// User methods
function getUser(userId) {
  const users = readJSON(usersFile, []);
  return users.find(u => u.id === userId) || null;
}

function saveUser(userData) {
  const users = readJSON(usersFile, []);
  const index = users.findIndex(u => u.id === userData.id);
  const now = new Date().toISOString();

  if (index >= 0) {
    users[index] = { ...users[index], ...userData, updated_at: now };
  } else {
    users.push({
      id: userData.id,
      first_name: userData.first_name || '',
      username: userData.username || '',
      language: userData.language || 'uz',
      phone: userData.phone || '',
      inn: userData.inn || '',
      created_at: now,
      updated_at: now,
      ...userData
    });
  }
  writeJSON(usersFile, users);
  return getUser(userData.id);
}

function setUserLanguage(userId, lang) {
  const user = getUser(userId) || { id: userId };
  user.language = lang;
  return saveUser(user);
}

function getAllUsers() {
  return readJSON(usersFile, []);
}

// Ticket methods
function getTickets() {
  return readJSON(ticketsFile, []);
}

function getTicketById(ticketId) {
  const tickets = getTickets();
  const cleanId = String(ticketId).replace(/^[#AB\-]+/gi, '').trim();
  return tickets.find(t => String(t.id) === cleanId || String(t.numeric_id) === cleanId || String(t.id) === String(ticketId).trim());
}

function getUserTickets(userId) {
  const tickets = getTickets();
  return tickets.filter(t => t.user_id === userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function createTicket(data) {
  const tickets = getTickets();
  const nextNum = tickets.length > 0 ? Math.max(...tickets.map(t => t.numeric_id || 0)) + 1 : 1;
  const ticketId = String(nextNum);
  const now = new Date().toISOString();

  const newTicket = {
    id: ticketId,
    numeric_id: nextNum,
    user_id: data.user_id,
    user_first_name: data.user_first_name || '',
    user_username: data.user_username || '',
    inn: data.inn,
    phone: data.phone,
    language: data.language || 'uz',
    product_group: data.product_group,
    role: data.role || '',
    topic: data.topic || '',
    description: data.description,
    attachments: data.attachments || [],
    status: 'new', // new | in_progress | resolved | closed
    created_at: now,
    updated_at: now,
    replies: []
  };

  tickets.push(newTicket);
  writeJSON(ticketsFile, tickets);

  // Also save phone and INN in user profile for autofill
  if (data.user_id) {
    saveUser({
      id: data.user_id,
      phone: data.phone,
      inn: data.inn
    });
  }

  return newTicket;
}

function updateTicketStatus(ticketId, status) {
  const tickets = getTickets();
  const normalized = String(ticketId).trim().toUpperCase();
  const ticket = tickets.find(t => t.id === normalized || String(t.numeric_id) === normalized);
  if (!ticket) return null;

  ticket.status = status;
  ticket.updated_at = new Date().toISOString();
  writeJSON(ticketsFile, tickets);
  return ticket;
}

function addTicketReply(ticketId, replyData) {
  const tickets = getTickets();
  const normalized = String(ticketId).trim().toUpperCase();
  const ticket = tickets.find(t => t.id === normalized || String(t.numeric_id) === normalized);
  if (!ticket) return null;

  const now = new Date().toISOString();
  if (!ticket.replies) ticket.replies = [];

  ticket.replies.push({
    sender_id: replyData.sender_id,
    sender_name: replyData.sender_name || 'Operator',
    text: replyData.text,
    sent_at: now
  });

  // Murojaat avtomatik yopilmaydi! Holati "in_progress" (jarayonda) bo'lib turadi
  if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
    ticket.status = 'in_progress';
  }
  ticket.updated_at = now;
  writeJSON(ticketsFile, tickets);
  return ticket;
}

function appendTicketDescription(ticketId, additionalText) {
  const tickets = getTickets();
  const normalized = String(ticketId).trim().toUpperCase();
  const ticket = tickets.find(t => t.id === normalized || String(t.numeric_id) === normalized);
  if (!ticket) return null;

  ticket.description = `${ticket.description}\n➕ <i>(Qo‘shimcha):</i> ${additionalText}`;
  ticket.updated_at = new Date().toISOString();
  writeJSON(ticketsFile, tickets);
  return ticket;
}

function getOpenTickets() {
  const tickets = getTickets();
  return tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed');
}

function getUserActiveTicket(userId) {
  const tickets = getUserTickets(userId);
  return tickets.find(t => t.status !== 'resolved' && t.status !== 'closed');
}

// Product search methods
function findProductByCode(code) {
  const products = readJSON(productsFile, initialProducts);
  const cleanCode = String(code).trim().replace(/[()\s]/g, '');

  // Exact GTIN match
  let found = products.find(p => p.gtin === cleanCode);
  if (found) return found;

  // DataMatrix prefix match
  found = products.find(p => cleanCode.startsWith(p.datamatrix_prefix) || cleanCode.includes(p.gtin));
  if (found) return found;

  return null;
}

// Settings methods
function getSetting(key, defaultVal = null) {
  const settings = readJSON(settingsFile, {});
  return settings[key] !== undefined ? settings[key] : defaultVal;
}

function setSetting(key, value) {
  const settings = readJSON(settingsFile, {});
  settings[key] = value;
  writeJSON(settingsFile, settings);
  return value;
}

module.exports = {
  getUser,
  saveUser,
  setUserLanguage,
  getAllUsers,
  getTickets,
  getTicketById,
  getUserTickets,
  getOpenTickets,
  getUserActiveTicket,
  appendTicketDescription,
  createTicket,
  updateTicketStatus,
  addTicketReply,
  findProductByCode,
  getSetting,
  setSetting
};
