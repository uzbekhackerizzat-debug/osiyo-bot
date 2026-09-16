const { Scenes, Markup } = require('telegraf');
const db = require('../database/db');
const { getLocale } = require('../locales');
const { mainMenuKeyboard, cancelKeyboard } = require('../keyboards/menus');

const checkCodeScene = new Scenes.WizardScene(
  'check_code_scene',
  // Step 1: Prompt user for code
  async (ctx) => {
    const lang = ctx.session?.lang || 'uz';
    const loc = getLocale(lang);

    await ctx.replyWithHTML(loc.check_code_prompt, cancelKeyboard(lang));
    return ctx.wizard.next();
  },

  // Step 2: Handle entered code
  async (ctx) => {
    const lang = ctx.session?.lang || 'uz';
    const loc = getLocale(lang);
    const text = ctx.message?.text?.trim();

    if (!text || text === loc.btn_cancel || text === '/cancel') {
      await ctx.reply(loc.btn_cancel, mainMenuKeyboard(lang));
      return ctx.scene.leave();
    }

    const product = db.findProductByCode(text);

    if (product) {
      if (product.is_valid) {
        const msg = loc.code_found_valid
          .replace('{name}', lang === 'ru' ? product.name_ru : product.name_uz)
          .replace('{group}', lang === 'ru' ? product.group_ru : product.group_uz)
          .replace('{manufacturer}', lang === 'ru' ? product.manufacturer_ru : product.manufacturer_uz)
          .replace('{gtin}', product.gtin)
          .replace('{mfg_date}', product.mfg_date)
          .replace('{exp_date}', product.exp_date)
          .replace('{status}', lang === 'ru' ? product.status_ru : product.status_uz);

        await ctx.replyWithHTML(msg, mainMenuKeyboard(lang));
      } else {
        const msg = loc.code_found_invalid
          .replace('{name}', lang === 'ru' ? product.name_ru : product.name_uz)
          .replace('{manufacturer}', lang === 'ru' ? product.manufacturer_ru : product.manufacturer_uz)
          .replace('{status}', lang === 'ru' ? product.status_ru : product.status_uz);

        await ctx.replyWithHTML(msg, mainMenuKeyboard(lang));
      }
    } else {
      // Not found in database
      const msg = loc.code_not_found.replace('{code}', text);
      await ctx.replyWithHTML(msg, mainMenuKeyboard(lang));
    }

    return ctx.scene.leave();
  }
);

module.exports = checkCodeScene;
