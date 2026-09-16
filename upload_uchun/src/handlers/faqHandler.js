const { getLocale } = require('../locales');
const { faqInlineKeyboard } = require('../keyboards/menus');

function setupFAQHandler(bot) {
  // Callback queries for FAQ items
  bot.action(/^faq_(\d)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const faqNum = ctx.match[1];
    const lang = ctx.session?.lang || 'uz';
    const loc = getLocale(lang);

    const titleKey = `faq_${faqNum}_title`;
    const textKey = `faq_${faqNum}_text`;

    const answer = loc[textKey] || loc.faq_1_text;
    await ctx.replyWithHTML(answer, faqInlineKeyboard(lang));
  });
}

module.exports = { setupFAQHandler };
