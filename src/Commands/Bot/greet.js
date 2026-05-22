const path = require('path');
const fs = require('fs');

const GREETED_FILE = path.join(__dirname, '../../../database/greeted-contacts.json');

let greetedContacts = new Set();

// Load greeted contacts
try {
    if (fs.existsSync(GREETED_FILE)) {
        const data = JSON.parse(fs.readFileSync(GREETED_FILE, 'utf8'));
        greetedContacts = new Set(data.contacts || []);
    }
} catch (e) {
    console.error('[XDN GREET] Load error:', e.message);
}

function saveGreeted() {
    try {
        fs.mkdirSync(path.dirname(GREETED_FILE), { recursive: true });
        fs.writeFileSync(GREETED_FILE, JSON.stringify({ contacts: [...greetedContacts] }, null, 2));
    } catch (e) {
        console.error('[XDN GREET] Save error:', e.message);
    }
}

let greetConfig = {
    enabled: false,
    greeting: null,
    faqHandler: null
};

module.exports = {
    name: 'greet',
    alias: [],
    category: 'Owner',
    desc: 'Auto welcome new customers with XDN business support options',
    usage: '.greet on |.greet off |.greet test',
    ownerOnly: true,

    execute: async (sock, m, { args, reply }) => {
        const sub = args[0]?.toLowerCase();

        const greeting = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • WELCOME TO XDN BUSINESS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ 👋 Hello Valued Customer!
│
│ 🏢 Professional Digital Services
│ ⚡ Fast & Reliable Support
│ 🚀 Powered by XADON AI ֎
│
│ *How can we assist you today?*
╰─────────────────────────╯`;

        if (sub === 'test') {
            await sock.sendMessage(m.sender, {
                text: greeting,
                footer: '֎ XADON BUSINESS | Xadon.vercel.app',
                buttons: [{
                    text: '֎ Business Menu',
                    sections: [{
                        title: '🛍️ Customer Support',
                        rows: [
                            { header: '', title: '֎ Our Services', description: 'View available services', id: '#greet_services' },
                            { header: '', title: '֎ Pricing', description: 'Check prices & packages', id: '#greet_prices' },
                            { header: '', title: '֎ Contact Support', description: 'Talk to customer care', id: '#greet_support' },
                            { header: '', title: '֎ Official Website', description: 'Visit Xadon.vercel.app', id: '#greet_website' }
                        ]
                    }]
                }]
            });

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GREETING SENT •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Business welcome sent to your DM.`
            );
        }

        if (sub === 'off') {
            greetConfig.enabled = false;
            greetConfig.greeting = null;
            greetConfig.faqHandler = null;
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • AUTO WELCOME DISABLED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
New customers will no longer receive auto greeting.`
            );
        }

        if (sub === 'on') {
            greetConfig.enabled = true;
            greetConfig.greeting = greeting;

            greetConfig.faqHandler = async (jid, faqId) => {
                switch (faqId) {

                    case '#greet_services':
                        await sock.sendMessage(jid, {
                            text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • OUR SERVICES •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *XDN SERVICES*
│ ❏ WhatsApp Bot Development
│ ❏ AI Integrations
│ ❏ Bot Hosting & Deployment
│ ❏ Automation Services
│ ❏ Custom Features
│ ❏ 24/7 Technical Support
╰─────────────────────────╯
Visit: Xadon.vercel.app`
                        });
                        break;

                    case '#greet_prices':
                        await sock.sendMessage(jid, {
                            text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • PRICING & PACKAGES •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *PACKAGES*
│ ❏ Basic Package
│ ❏ Premium Package
│ ❏ Enterprise Package
╰─────────────────────────╯
Contact support for full pricing details.
Website: Xadon.vercel.app`
                        });
                        break;

                    case '#greet_support':
                        await sock.sendMessage(jid, {
                            text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • CUSTOMER SUPPORT •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Need help?
Reply to this chat or use:.owner

We usually respond within minutes.
Website: Xadon.vercel.app`
                        });
                        break;

                    case '#greet_website':
                        await sock.sendMessage(jid, {
                            text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • OFFICIAL WEBSITE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *XDN BUSINESS PORTAL*
│ ❏ Website : Xadon.vercel.app
│ ❏ Status : ONLINE
│ ❏ Services : Available 24/7
╰─────────────────────────╯
Visit us for docs, pricing, and updates.`
                        });
                        break;
                }
            };

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • AUTO WELCOME ENABLED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
New customers will now receive a professional welcome message with menu.`
            );
        }

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GREET COMMAND •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Usage:
֎.greet on → Enable auto welcome
֎.greet off → Disable auto welcome
֎.greet test → Send test greeting`
        );
    },

    greetConfig,
    greetedContacts,
    saveGreeted,

    handleNewContact: async (sock, sender, isGroup) => {
        if (!greetConfig.enabled) return;
        if (isGroup) return;
        if (greetedContacts.has(sender)) return;

        greetedContacts.add(sender);
        saveGreeted();

        await sock.sendMessage(sender, {
            text: greetConfig.greeting || '֎ Welcome to XDN Business!',
            footer: '֎ XADON BUSINESS | Xadon.vercel.app',
            buttons: [{
                text: '֎ Business Menu',
                sections: [{
                    title: '🛍️ Customer Support',
                    rows: [
                        { header: '', title: '֎ Our Services', description: 'View available services', id: '#greet_services' },
                        { header: '', title: '֎ Pricing', description: 'Check prices & packages', id: '#greet_prices' },
                        { header: '', title: '֎ Contact Support', description: 'Talk to customer care', id: '#greet_support' },
                        { header: '', title: '֎ Official Website', description: 'Visit Xadon.vercel.app', id: '#greet_website' }
                    ]
                }]
            }]
        });
    },

    handleGreetButton: async (sock, m) => {
        const buttonId =
            m.msg?.buttonsResponseMessage?.selectedButtonId ||
            m.msg?.templateButtonReplyMessage?.selectedId ||
            m.msg?.listResponseMessage?.singleSelectReply?.selectedRowId;

        if (!buttonId ||!buttonId.startsWith('#greet_')) return false;

        if (greetConfig.faqHandler) {
            await greetConfig.faqHandler(m.sender, buttonId);
        }

        return true;
    }
};