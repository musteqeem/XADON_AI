const config = require('../../../settings/config');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const MY_NUMBER = config.ownernumber || process.env.OWNER_NUMBER || process.env.OWNER_NUMBERS || '';

const formatPrice = (price, currency) => {
    if (!price ||!currency) return 'Contact for price';
    return `${currency} ${(price / 100).toLocaleString()}`;
};

const getProductImage = (imageUrls) => {
    return imageUrls?.original || imageUrls?.requested || null;
};

const getPhone = (jid) => jid?.split('@')[0]?.split(':')[0] || '';
const isLid = (jid) => jid?.endsWith('@lid');
const isPhone = (val) => /^[0-9]{6,15}$/.test(val);
const isLimit = (val) => /^[0-9]{1,3}$/.test(val);

const fetchCatalog = async (sock, jid, limit) => {
    try {
        const result = await sock.getCatalog({ jid, limit });
        if (!Array.isArray(result.products) || result.products.length === 0) return null;
        return result;
    } catch (err) {
        console.log('[CATALOG ERROR]', err.message);
        return null;
    }
};

const searchProducts = (products, keyword) => {
    keyword = keyword.toLowerCase();
    return products.filter(p =>
        p.name?.toLowerCase().includes(keyword) ||
        p.description?.toLowerCase().includes(keyword)
    );
};

const sendCatalog = async (sock, m, products, nextPageCursor, label, limit, { useEnvPhone = false, ownerPhone = '' } = {}) => {
    if (products.length === 0) {
        return await sock.sendMessage(m.chat, {
            text: `✘ ֎ No products found for this search`
        }, { quoted: m });
    }

    const cards = products.slice(0, 10).map(p => {
        const imageUrl = getProductImage(p.imageUrls);
        const price = formatPrice(p.price, p.currency);

        const productUrl = useEnvPhone
          ? `https://wa.me/p/${p.id}/${ownerPhone}`
            : (p.url || `https://wa.me/p/${p.id}/${ownerPhone}`);

        return {
            image: imageUrl
              ? { url: imageUrl }
                : { url: 'https://via.placeholder.com/400x400/10b981/FFFFFF?text=No+Image' },
            caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ *${p.name || 'Unnamed Product'}*
❏ Price : ${price}
${p.description? `❏ Desc : ${p.description.slice(0, 100)}${p.description.length > 100? '...' : ''}` : ''}
❏ Stock : ${p.availability || 'In stock'}
❏ ID : ${p.id}`,
            footer: `֎ ${BOT_NAME} Business`,
            nativeFlow: [{
                text: '🛒 View Product',
                url: productUrl
            }, {
                text: '💬 Inquire',
                copy: `Hi! I'm interested in: ${p.name} (ID: ${p.id})`
            }]
        };
    });

    await sock.sendMessage(m.chat, {
        text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${label} •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Found: ${products.length} product${products.length > 1? 's' : ''}`,
        footer: `${BOT_NAME}`,
        cards
    }, { quoted: m });

    if (nextPageCursor &&!label.includes('SEARCH')) {
        await sock.sendMessage(m.chat, {
            text: `❏ More available — use.catalog ${label.includes(BOT_NAME)? 'me' : 'here'} ${limit + 10} to load more`
        });
    }
};

const USAGE = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CATALOG •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏.catalog me : Browse my catalog
│ ❏.catalog here : Browse this contact
│ ❏.catalog search <keyword> : Search my catalog
│ ❏.catalog here search <keyword> : Search their catalog
│ ❏.catalog me 20 : Set limit
╰─────────────────────────╯
❏ Examples:
❏.catalog search shoes
❏.catalog here search iphone`;

module.exports = {
    name: 'catalog',
    alias: ['products', 'shop', 'store', 'cat'],
    desc: 'Browse and search business product catalog',
    category: 'Business',
    usage: '.catalog [me|here|search] [keyword/phone] [limit?]',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const sub = args[0]?.toLowerCase();
        if (!sub) return reply(USAGE);

        if (m.chat.endsWith('@g.us')) {
            return reply('✘ ֎ DM only. Send me a private message to use this command.');
        }

        const arg1 = args[1] || '';
        const arg2 = args[2] || '';
        const arg3 = args[3] || '';

        const manualPhone = isPhone(arg1)? arg1 : isPhone(arg2)? arg2 : null;
        const keyword = sub === 'search'? args.slice(1).join(' ') :
                       args[1] === 'search'? args.slice(2).join(' ') :
                       args[2] === 'search'? args.slice(3).join(' ') : null;
        const limit = parseInt(isLimit(arg2)? arg2 : isLimit(arg1)? arg1 : isLimit(arg3)? arg3 : '10') || 10;

        const myJid = sock.user?.id;
        const myPhone = MY_NUMBER || getPhone(myJid);

        await sock.sendMessage(m.chat, { react: { text: '🛒', key: m.key } });

        // ── CATALOG SEARCH ───────────────────────────────────────
        if (sub === 'search' || args[1] === 'search' || args[2] === 'search') {
            if (!keyword) return reply('✘ ֎ Provide a search keyword\n❏ Example:.catalog search shoes');

            let targetJid = myJid;
            let label = `${BOT_NAME} CATALOG SEARCH`;
            let useEnvPhone = true;
            let ownerPhone = myPhone;

            //.catalog here search <keyword>
            if (args[0] === 'here') {
                if (manualPhone) {
                    targetJid = `${manualPhone}@s.whatsapp.net`;
                } else if (!isLid(m.chat)) {
                    targetJid = m.chat;
                } else {
                    return reply(`✘ ֎ Cannot search LID contact.\n❏ Try:.catalog here 2348012345678 search ${keyword}`);
                }
                label = `CATALOG SEARCH`;
                useEnvPhone = false;
                ownerPhone = getPhone(targetJid);
            }

            const result = await fetchCatalog(sock, targetJid, 100); // fetch more for better search
            if (!result) return reply(`✘ ֎ No catalog found`);

            const found = searchProducts(result.products, keyword);
            await sendCatalog(sock, m, found, null, label, limit, { useEnvPhone, ownerPhone });
            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });
            return;
        }

        // ── CATALOG ME ────────────────────────────────────────────
        if (sub === 'me') {
            const result = await fetchCatalog(sock, myJid, limit);
            if (!result) return reply(`✘ ֎ You don't have a catalog yet.\n❏ Create one in WhatsApp Business > Catalog`);
            await sendCatalog(sock, m, result.products, result.nextPageCursor, `${BOT_NAME} CATALOG`, limit, {
                useEnvPhone: true,
                ownerPhone: myPhone
            });
            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });
            return;
        }

        // ── CATALOG HERE ─────────────────────────────────────────
        if (sub === 'here') {
            let theirJid = null;

            if (manualPhone) {
                theirJid = `${manualPhone}@s.whatsapp.net`;
            } else if (!isLid(m.chat)) {
                theirJid = m.chat;
            }

            if (!theirJid) {
                return reply(`✘ ֎ This contact uses LID. Cannot fetch automatically.\n❏ Try:.catalog here 2348012345678`);
            }

            const theirPhone = getPhone(theirJid);
            const theirResult = await fetchCatalog(sock, theirJid, limit);

            if (theirResult) {
                await sendCatalog(sock, m, theirResult.products, theirResult.nextPageCursor, `THEIR CATALOG`, limit, {
                    useEnvPhone: false,
                    ownerPhone: theirPhone
                });
                await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });
                return;
            }

            // Fallback to mine
            const myResult = await fetchCatalog(sock, myJid, limit);
            if (myResult) {
                await sock.sendMessage(m.chat, {
                    text: `✘ ֎ This contact has no catalog.\n❏ Showing my catalog instead:`
                });
                await sendCatalog(sock, m, myResult.products, myResult.nextPageCursor, `${BOT_NAME} CATALOG`, limit, {
                    useEnvPhone: true,
                    ownerPhone: myPhone
                });
                await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });
                return;
            }

            return reply(`✘ ֎ No catalog found here, and you don't have one either.`);
        }

        return reply(USAGE);
    }
};