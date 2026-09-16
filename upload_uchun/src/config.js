require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  ADMIN_IDS: (process.env.ADMIN_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
    .map(Number),
  SUPPORT_GROUP_ID: process.env.SUPPORT_GROUP_ID ? Number(process.env.SUPPORT_GROUP_ID) : null,
  DATA_DIR: process.env.DATA_DIR || './data'
};
