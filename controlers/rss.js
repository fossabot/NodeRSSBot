const ctrl = {};
const RSS = require('../proxies/rssFeed');
const i18n = require('../i18n');


ctrl.sub = async (ctx, next) => {
    const {feedUrl} = ctx.state;
    const feedTitle = ctx.state.feed.title;
    const chat = await ctx.getChat();
    const userId = chat.id;
    try {
        const res = await RSS.sub(userId, feedUrl, feedTitle);
        if (res === "ok") {
            ctx.telegram.deleteMessage(ctx.state.chat.id, ctx.state.processMesId);
            ctx.replyWithMarkdown(`
            ${i18n['SUB_SUCCESS']}[${ctx.state.feed.title}](${ctx.state.feedUrl})`)
        }
    } catch (e) {
        if (e instanceof Error) throw e;
        throw  new Error('DB_ERROR')
    }
    await next();
};

ctrl.unsub = async (ctx, next) => {
    const {feedUrl} = ctx.state;
    const chat = await ctx.getChat();
    const userId = chat.id;
    try {
        const feed = await RSS.getFeedByUrl(feedUrl);
        if (!feed)
            throw new Error('DID_NOT_SUB');
        const res = await RSS.unsub(userId, feed.feed_id);
        if (res === "ok") {
            ctx.telegram.deleteMessage(ctx.state.chat.id, ctx.state.processMesId);
            ctx.replyWithMarkdown(`
        ${i18n['UNSUB_SUCCESS']}[${feed.feed_title}](${ctx.state.feedUrl})`)
        }
    } catch (e) {
        if (e instanceof Error) throw e;
        throw  new Error('DB_ERROR');
    }
    await next();
};

ctrl.rss = async (ctx, next) => {
    const feeds = await RSS.getSubscribedFeedsByUserId(ctx.chat.id);
    if (feeds.length === 0) {
        throw new Error('NOT_SUB')
    }
    let text = i18n['SUB_LIST'];
    if (ctx.message.text.split(/\s/)[1] === 'raw') {
        feeds.forEach(feed => {
            text += `\n${feed.feed_title.trim()}: <a href="${feed.url.trim()}">${feed.url.trim()}</a>`;
        });
    } else {
        feeds.forEach(feed => {
            text += `\n<a href="${feed.url.trim()}">${feed.feed_title.trim()}</a>`;
        });
    }
    ctx.telegram.deleteMessage(ctx.state.chat.id, ctx.state.processMesId);
    ctx.telegram.sendMessage(ctx.state.chat.id, text,
        {
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });
    await next();
};

ctrl.unsubAll = async (ctx, next) => {
    const userId = ctx.state.chat.id;
    await RSS.unsubAll(userId);
    ctx.telegram.deleteMessage(ctx.state.chat.id, ctx.state.processMesId);
    ctx.telegram.sendMessage(ctx.state.chat.id, i18n['UNSUB_ALL_SUCCESS'],
        {
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });
    await next();
}

module.exports = ctrl;
