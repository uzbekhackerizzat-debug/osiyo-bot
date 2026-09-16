const uz = require('./uz');
const ru = require('./ru');
const db = require('../database/db');

const locales = { uz, ru };

function getLocale(langOrUserId) {
  let lang = 'uz';
  if (typeof langOrUserId === 'number' || (typeof langOrUserId === 'string' && /^\d+$/.test(langOrUserId))) {
    const user = db.getUser(Number(langOrUserId));
    if (user && user.language) {
      lang = user.language;
    }
  } else if (langOrUserId === 'ru' || langOrUserId === 'uz') {
    lang = langOrUserId;
  }
  return locales[lang] || locales.uz;
}

function t(userIdOrLang, key, params = {}) {
  const loc = getLocale(userIdOrLang);
  let text = loc[key] || locales.uz[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

module.exports = {
  locales,
  getLocale,
  t
};
