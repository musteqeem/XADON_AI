const axios = require('axios');
const cheerio = require('cheerio');
const whois = require('whois-json');
const dns = require('dns').promises;
const net = require('net');
const tls = require('tls');
const crypto = require('crypto');

// ===== HACKER THEME CONFIG =====
const THEME = {
    head: '▸',
    ok: '✅',
    err: '❌',
    wait: '⏳',
    scan: '🔍',
    hack: '💀',
    line: '━━━━━━━━━━━━━━━━━━━━━━━━',
    boxT: '╔════════╗',
    boxB: '╚════════╝'
};

const BANNER = `*💀 XADON GET SUITE v6.0*
*> ROOT ACCESS: GRANTED | OSINT ENGINE ONLINE*`;

const progressBar = (percent) => {
    const total = 10;
    const filled = Math.round((percent / 100) * total);
    const empty = total - filled;
    return `▰`.repeat(filled) + `▱`.repeat(empty) + ` ${percent}%`;
}

module.exports = {
    name: 'get',
    alias: ['gfetch', 'gcurl', 'recon', 'osint', 'ghack', 'xscan'],
    category: 'Tools',
    desc: 'Advanced OSINT, Fetching & Recon tool - HACKER EDITION',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args[0]) return showMainMenu(sock, m);
            const sub = args[0].toLowerCase();
            const params = args.slice(1);

            const router = {
                'menu': showMainMenu, 'all': cmdAllScan, 'waf': cmdWafDetect, 'dirb': cmdDirBuster,
                'osint': cmdOsint, 'json': cmdGetJson, 'headers': cmdHeaders, 'dns': cmdDns,
                'whois': cmdWhois, 'scrape': cmdScrape, 'download': cmdDownload, 'portscan': cmdPortScan,
                'subdomains': cmdSubdomains, 'usernames': cmdUsernames, 'breach': cmdBreach,
                'ip': cmdIpInfo, 'ssl': cmdSslCheck, 'tech': cmdTechStack, 'wayback': cmdWayback, 'hash': cmdHashGen
            };

            if (router[sub]) {
                await sock.sendMessage(m.chat, { react: { text: THEME.hack, key: m.key }});
                return await router[sub](sock, m, params, reply);
            }
            return await cmdSmartGet(sock, m, [sub,...params], reply);

        } catch (error) {
            console.error('[GET ERROR]:', error);
            await sock.sendMessage(m.chat, { react: { text: THEME.err, key: m.key }});
            reply(`${THEME.err} *SYSTEM ERROR:* ${error.message}`);
        }
    }
};

// ===== UI & HELPERS =====
async function showMainMenu(sock, m) {
    const menu = `${BANNER}\n${THEME.line}\n
*> INITIALIZING XADON OSINT MODULE...*
*> 20 MODULES LOADED SUCCESSFULLY*\n
*⚡ [EXPLOIT MODULES]*
${THEME.head} *.get all <domain>* - Full recon report
${THEME.head} *.get waf <domain>* - WAF/Firewall detection
${THEME.head} *.get dirb <url>* - Directory brute force

*📡 [FETCH MODULES]*
${THEME.head} *.get <url>* - Smart fetch auto media/text
${THEME.head} *.get headers <url>* - Extract HTTP headers
${THEME.head} *.get scrape <url>* - Link scraper
${THEME.head} *.get download <url>* - File downloader
${THEME.head} *.get json <url>* - JSON API formatter

*🕵️ [OSINT MODULES]*
${THEME.head} *.get osint <domain>* - Full domain intelligence
${THEME.head} *.get ip <ip>* - IP geolocation + ISP
${THEME.head} *.get dns <domain>* - DNS record dump
${THEME.head} *.get whois <domain>* - WHOIS database query
${THEME.head} *.get usernames <name>* - 25+ Platform scan
${THEME.head} *.get breach <email>* - Data breach check

*🛡️ [PEN-TEST MODULES]*
${THEME.head} *.get portscan <ip> [ports]* - TCP port scanner
${THEME.head} *.get subdomains <domain>* - Subdomain enumeration
${THEME.head} *.get ssl <domain>* - SSL certificate analyzer
${THEME.head} *.get tech <domain>* - Tech stack fingerprint
${THEME.head} *.get wayback <domain>* - Archive.org snapshots

*🛠️ [UTILITY MODULES]*
${THEME.head} *.get hash <text>* - MD5/SHA1/SHA256 generator
${THEME.line}\n_> Type *.get menu* to reload interface_`;

    await sock.sendMessage(m.chat, {
        text: menu, footer: 'XADON OSINT ENGINE v6.1 | HACKER MODE',
        buttons: [
            { buttonId: '.get all google.com', buttonText: { displayText: '🚀 INIT SCAN' }, type: 1 },
            { buttonId: '.get usernames xadon', buttonText: { displayText: '💀 USER HUNT' }, type: 1 }
        ], headerType: 1
    }, { quoted: m });
}

async function sendLongText(sock, m, text) {
    if (text.length > 90000) {
        const parts = text.match(/[\s\S]{1,90000}/g) || [];
        for (const part of parts) await sock.sendMessage(m.chat, { text: part }, { quoted: m });
    } else {
        await sock.sendMessage(m.chat, { text }, { quoted: m });
    }
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// ===== 1. FULL SCAN =====
async function cmdAllScan(sock, m, args, reply) {
    const domain = args[0]; if (!domain) return reply(`${THEME.err} *> Usage:*.get all example.com`);
    let report = `${BANNER}\n${THEME.line}\n*> TARGET LOCKED: \`${domain}\`*\n*> INITIATING FULL RECON...*\n${THEME.line}\n\n`;
    try {
        const w = await whois(domain);
        report += `*[WHOIS DATABASE]*\n${THEME.head} *Registrar:* ${w.registrar || 'N/A'}\n${THEME.head} *Created:* ${w.creationDate || 'N/A'}\n${THEME.head} *Expires:* ${w.expirationDate || 'N/A'}\n\n`;
    } catch {}
    try {
        const ips = await dns.resolve4(domain);
        report += `*[NETWORK MAPPING]*\n${THEME.head} *IP Address:* ${ips.join(', ')}\n\n`;
    } catch {}
    try {
        const res = await axios.get(`https://${domain}`, { timeout: 8000, validateStatus: () => true });
        const server = res.headers['server'] || 'Unknown';
        const waf = server.toLowerCase().includes('cloudflare')? '☁️ Cloudflare' : server.toLowerCase().includes('akamai')? '🛡️ Akamai' : '❌ None';
        report += `*[SECURITY SCAN]*\n${THEME.head} *Server:* ${server}\n${THEME.head} *WAF:* ${waf}\n${THEME.head} *Status:* ${res.status}\n\n`;
    } catch {}
    try {
        const tech = await axios.get(`https://${domain}`, { timeout: 8000 });
        let t = [];
        if(tech.data.includes('wp-content')) t.push('WordPress');
        if(tech.data.includes('react')) t.push('React');
        if(tech.data.includes('vue')) t.push('Vue');
        report += `*[TECH FINGERPRINT]*\n${THEME.head} *Stack:* ${t.join(', ') || 'Unknown'}\n`;
    } catch {}
    report += `${THEME.line}\n${THEME.ok} *> SCAN COMPLETE*`;
    await sendLongText(sock, m, report);
    await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
}

// ===== 2. WAF DETECT =====
async function cmdWafDetect(sock, m, args, reply) {
    const domain = args[0]; if (!domain) return reply(`${THEME.err} *> Usage:*.get waf example.com`);
    try {
        const res = await axios.get(`https://${domain}`, { timeout: 10000, validateStatus: () => true });
        const h = res.headers;
        let waf = '❌ None Detected';
        if (h['server']?.toLowerCase().includes('cloudflare') || h['cf-ray']) waf = '☁️ Cloudflare';
        else if (h['x-sucuri-id']) waf = '🛡️ Sucuri';
        else if (h['x-akamai']) waf = '🛡️ Akamai';
        else if (h['x-f5']) waf = '🛡️ F5 BIG-IP';

        const result = `${BANNER}\n${THEME.line}\n*> WAF DETECTION MODULE*\n${THEME.line}\n${THEME.head} *Target:* \`${domain}\`\n${THEME.head} *Status Code:* ${res.status}\n${THEME.head} *Server:* ${h['server'] || 'Hidden'}\n${THEME.head} *Protection:* ${waf}\n${THEME.line}`;
        reply(result);
        await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
    } catch (e) {
        reply(`${THEME.err} Connection to \`${domain}\` failed`);
    }
}

// ===== 3. DIR BUSTER WITH PROGRESS BAR ====
async function cmdDirBuster(sock, m, args, reply) {
    const url = args[0];
    if (!url) return reply(`${THEME.err} *> Usage:*.get dirb https://example.com`);
    const wordlist = [
        'admin','administrator','login','signin','auth','panel','dashboard','cpanel','control','manage','manager',
        'admin.php','admin.html','login.php','logout','signup','register','account',
        '.git','.svn','.env','.htaccess','.htpasswd','backup','backups','bak','old','temp','tmp','test','dev','prod',
        'config','configuration','settings','db','database','sql','mysql','dump','backup.zip','config.php','config.inc',
        'wp-admin','wp-content','wp-includes','wp-login.php','xmlrpc.php','readme.html','license.txt',
        'joomla','administrator','component','modules','templates','cache',
        'drupal','sites','includes','misc','themes',
        'api','v1','v2','rest','graphql','swagger','docs','documentation','api-docs','postman',
        'phpinfo.php','info.php','server-status','server-info',
        'uploads','upload','files','file','download','downloads','images','img','assets','static','media','css','js',
        '.gitignore','.dockerignore','dockerfile','robots.txt','sitemap.xml','crossdomain.xml',
        'phpmyadmin','pma','myadmin','mysql','dbadmin',
        'adminer','adminer.php','secret','hidden','private','secure','root','system','console','shell',
        'index','index.php','index.html','default','home','main','app','application','src','lib','vendor'
    ];

    let found = [];
    let msg = await reply(`${THEME.scan} *DIRB INITIATED*\n*Target:* \`${url}\`\n*Wordlist:* ${wordlist.length} paths\n${progressBar(0)}`);

    for (let i = 0; i < wordlist.length; i++) {
        const dir = wordlist[i];
        const percent = Math.round(((i + 1) / wordlist.length) * 100);

        // Update progress every 5 checks to avoid spam
        if(i % 5 === 0) {
            await sock.sendMessage(m.chat, {
                text: `${THEME.scan} *BRUTE FORCING...*\n*Target:* \`${url}\`\n*Checking:* /${dir}\n${progressBar(percent)}`,
                edit: msg.key
            });
        }

        try {
            const res = await axios.get(`${url}/${dir}`, { timeout: 4000, validateStatus: () => true });
            if ([200,301,302,403].includes(res.status)) {
                let statusEmoji = res.status === 200? '🟢' : res.status === 403? '🟡' : '🔵';
                found.push(`${statusEmoji} ${THEME.head} /${dir} *[${res.status}]*`);
            }
        } catch {}
        await delay(80); // Anti-rate-limit
    }

    const result = `${BANNER}\n${THEME.line}\n*> DIRECTORY BRUTE FORCE COMPLETE*\n*Target:* \`${url}\`\n*Found:* ${found.length} directories\n${THEME.line}\n\n${found.length? found.join('\n') : `${THEME.err} No directories found`}\n${THEME.line}\n\n*> TIP: 403 = Exists but Forbidden. 200 = Accessible`;
    reply(result);
    await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
}
// ===== 4. SMART GET =====
async function cmdSmartGet(sock, m, args, reply) {
    let url = args[0];
    if (!url && m.quoted) url = m.quoted.text?.match(/https?:\/\/[^\s]+/)?.[0];
    if (!url) return reply(`${THEME.err} *> Usage:*.get https://example.com`);

    try {
        await reply(`${THEME.wait} *> FETCHING: \`${url}\`*`);
        const res = await axios.get(url, { timeout: 30000, responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0 XADON-BOT/6.1' } });
        const ct = res.headers['content-type'] || '';
        const buf = Buffer.from(res.data);
        const fn = url.split('/').pop().split('?')[0] || 'file';

        if (ct.match(/audio|video|image|application|pdf/)) {
            if (ct.includes('audio')) await sock.sendMessage(m.chat, { audio: buf, mimetype: ct, fileName: fn }, { quoted: m });
            else if (ct.includes('video')) await sock.sendMessage(m.chat, { video: buf, mimetype: ct, caption: `📁 ${fn}` }, { quoted: m });
            else if (ct.includes('image')) await sock.sendMessage(m.chat, { image: buf, caption: `📁 ${fn}` }, { quoted: m });
            else await sock.sendMessage(m.chat, { document: buf, mimetype: ct, fileName: fn }, { quoted: m });
        } else {
            const html = buf.toString('utf8');
            const $ = cheerio.load(html);
            const title = $('title').text() || 'No Title';
            const text = `${BANNER}\n${THEME.line}\n*> SMART FETCH RESULT*\n${THEME.line}\n*URL:* \`${url}\`\n*Title:* ${title}\n\n${html.substring(0, 15000)}...\n${THEME.line}`;
            await sendLongText(sock, m, text);
        }
        await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
    } catch {
        reply(`${THEME.err} Fetch failed. Target may be blocking requests.`)
    }
}

// ===== 5. OSINT =====
async function cmdOsint(sock, m, args, reply) {
    const d = args[0]; if (!d) return reply(`${THEME.err} *> Usage:*.get osint example.com`);
    let r = `${BANNER}\n${THEME.line}\n*> OSINT INTELLIGENCE REPORT*\n*Target:* \`${d}\`\n${THEME.line}\n\n`;
    try {
        const w = await whois(d);
        r += `*[WHOIS DATA]*\n${THEME.head} *Registrar:* ${w.registrar || 'N/A'}\n${THEME.head} *Created:* ${w.creationDate || 'N/A'}\n${THEME.head} *Expires:* ${w.expirationDate || 'N/A'}\n${THEME.head} *NS:* ${w.nameServers?.join(', ') || 'N/A'}\n\n`;
    } catch {}
    try {
        const a = await dns.resolve4(d);
        r += `*[DNS RECORDS]*\n${THEME.head} *A Records:* ${a.join(', ')}\n\n`;
    } catch {}
    try {
        const mx = await dns.resolveMx(d);
        r += `${THEME.head} *MX Records:* ${mx.map(x=>x.exchange).join(', ') || 'N/A'}\n\n`;
    } catch {}
    r += `${THEME.line}`;
    await sendLongText(sock, m, r);
    await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
}

// ===== 6. JSON =====
async function cmdGetJson(sock, m, args, reply) {
    const url = args[0]; if (!url) return reply(`${THEME.err} *> Usage:*.get json https://api.com`);
    try {
        const res = await axios.get(url, { timeout: 15000 });
        const text = `${BANNER}\n${THEME.line}\n*> JSON API DUMP*\n*URL:* \`${url}\`\n${THEME.line}\n\n\`\`${JSON.stringify(res.data, null, 2).substring(0, 90000)}\`\n${THEME.line}`;
        await sendLongText(sock, m, text);
        await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
    } catch {
        reply(`${THEME.err} Invalid JSON or API down`)
    }
}

// ===== 7. HEADERS =====
async function cmdHeaders(sock, m, args, reply) {
    const url = args[0]; if (!url) return reply(`${THEME.err} *> Usage:*.get headers https://example.com`);
    try {
        const res = await axios.head(url, { timeout: 10000 });
        let h = `${BANNER}\n${THEME.line}\n*> HTTP HEADER EXTRACTION*\n*Target:* \`${url}\`\n${THEME.line}\n\n`;
        for (let k in res.headers) h += `${THEME.head} *${k}:* ${res.headers[k]}\n`;
        h += THEME.line;
        reply(h);
        await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
    } catch {
        reply(`${THEME.err} Header extraction failed`)
    }
}

// ===== 8. DNS =====
async function cmdDns(sock, m, args, reply) {
    const d = args[0]; if (!d) return reply(`${THEME.err} *> Usage:*.get dns google.com`);
    const a = await dns.resolve4(d).catch(() => []);
    const mx = await dns.resolveMx(d).catch(() => []);
    const txt = await dns.resolveTxt(d).catch(() => []);
    const ns = await dns.resolveNs(d).catch(() => []);
    const result = `${BANNER}\n${THEME.line}\n*> DNS RECORD DUMP*\n*Domain:* \`${d}\`\n${THEME.line}\n\n${THEME.head} *A:* ${a.join(', ') || 'None'}\n${THEME.head} *MX:* ${mx.map(x=>x.exchange).join(', ') || 'None'}\n${THEME.head} *NS:* ${ns.join(', ') || 'None'}\n${THEME.head} *TXT:* ${txt.flat().join(' ') || 'None'}\n${THEME.line}`;
    reply(result);
    await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
}

// ===== 9. WHOIS =====
async function cmdWhois(sock, m, args, reply) {
    const d = args[0]; if (!d) return reply(`${THEME.err} *> Usage:*.get whois google.com`);
    try {
        const w = await whois(d);
        const result = `${BANNER}\n${THEME.line}\n*> WHOIS DATABASE QUERY*\n*Domain:* \`${d}\`\n${THEME.line}\n\n${THEME.head} *Registrar:* ${w.registrar || 'N/A'}\n${THEME.head} *Created:* ${w.creationDate || 'N/A'}\n${THEME.head} *Expires:* ${w.expirationDate || 'N/A'}\n${THEME.head} *Updated:* ${w.updatedDate || 'N/A'}\n${THEME.head} *Nameservers:* ${w.nameServers?.join(', ') || 'N/A'}\n${THEME.line}`;
        reply(result);
        await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
    } catch {
        reply(`${THEME.err} WHOIS query failed`)
    }
}

// ===== 10. SCRAPE =====
async function cmdScrape(sock, m, args, reply) {
    const url = args[0]; if (!url) return reply(`${THEME.err} *> Usage:*.get scrape https://example.com`);
    try {
        const res = await axios.get(url, { timeout: 15000 });
        const $ = cheerio.load(res.data);
        const links = [...new Set($('a[href]').map((i, el) => $(el).attr('href')).get())].slice(0, 30);
        const result = `${BANNER}\n${THEME.line}\n*> LINK SCRAPER RESULT*\n*From:* \`${url}\`\n${THEME.line}\n\n${links.map(l => `${THEME.head} ${l}`).join('\n')}\n${THEME.line}`;
        reply(result);
        await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
    } catch {
        reply(`${THEME.err} Scrape failed`)
    }
}

// ===== 11. DOWNLOAD =====
async function cmdDownload(sock, m, args, reply) {
    const url = args[0]; if (!url) return reply(`${THEME.err} *> Usage:*.get download https://file.com/file.pdf`);
    try {
        await reply(`${THEME.wait} *> DOWNLOADING FILE...*`);
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
        const fn = url.split('/').pop().split('?')[0];
        await sock.sendMessage(m.chat, { document: Buffer.from(res.data), fileName: fn }, { quoted: m });
        await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
    } catch {
        reply(`${THEME.err} Download failed. File blocked or too large.`)
    }
}

// ===== 12. PORTSCAN WITH PROGRESS BAR =====
async function cmdPortScan(sock, m, args, reply) {
    const ip = args[0];
    const ports = args[1]? args[1].split(',').map(Number) : [21,22,23,25,53,80,110,443,3306,8080];
    if (!ip) return reply(`${THEME.err} *> Usage:*.get portscan 1.1.1.1`);
    let r = `${BANNER}\n${THEME.line}\n*> TCP PORT SCANNER*\n*Target:* \`${ip}\`\n${THEME.line}\n\n`;
    let msg = await reply(`${THEME.scan} *SCANNING PORTS...*\n*Target:* \`${ip}\`\n${progressBar(0)}`);

    for (let i = 0; i < ports.length; i++) {
        let p = ports[i];
        const percent = Math.round(((i + 1) / ports.length) * 100);
        if(i % 2 === 0) await sock.sendMessage(m.chat, { text: `${THEME.scan} *SCANNING PORTS...*\n*Target:* \`${ip}\`\n${progressBar(percent)}`, edit: msg.key });
        const status = await new Promise(resolve => {
            const s = new net.Socket();
            s.setTimeout(1000);
            s.on('connect', () => { s.destroy(); resolve('🟢 OPEN') });
            s.on('error', () => resolve('🔴 CLOSED'));
            s.connect(p, ip);
        });
        r += `${THEME.head} *Port ${p}:* ${status}\n`;
        await delay(150);
    }
    r += THEME.line;
    reply(r);
    await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
}

// ===== 13. SUBDOMAINS WITH PROGRESS BAR =====
async function cmdSubdomains(sock, m, args, reply) {
    const d = args[0]; if (!d) return reply(`${THEME.err} *> Usage:*.get subdomains example.com`);
    const wordlist = ['www','mail','api','dev','admin','cpanel','ftp','blog','shop','test','staging','portal','cdn','webmail','smtp'];
    let f = [];
    let msg = await reply(`${THEME.scan} *ENUMERATING SUBDOMAINS...*\n*Domain:* \`${d}\`\n${progressBar(0)}`);

    for (let i = 0; i < wordlist.length; i++) {
        let s = wordlist[i];
        const percent = Math.round(((i + 1) / wordlist.length) * 100);
        if(i % 3 === 0) await sock.sendMessage(m.chat, { text: `${THEME.scan} *ENUMERATING...*\n*Domain:* \`${d}\`\n${progressBar(percent)}`, edit: msg.key });
        try { await dns.resolve4(`${s}.${d}`); f.push(`${THEME.head} ${s}.${d}`); } catch {}
        await delay(100);
    }
    const result = `${BANNER}\n${THEME.line}\n*> SUBDOMAIN ENUMERATION COMPLETE*\n*Domain:* \`${d}\`\n${THEME.line}\n\n${f.length? f.join('\n') : `${THEME.err} None found`}\n${THEME.line}`;
    reply(result);
    await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
}

// ===== 14. USERNAMES - 25+ SITES WITH PROGRESS =====
async function cmdUsernames(sock, m, args, reply) {
    const u = args[0]; if (!u) return reply(`${THEME.err} *> Usage:*.get usernames username`);
    let msg = await reply(`${THEME.scan} *HUNTING USERNAME: @${u}*\n*Scanning 25+ platforms...*\n${progressBar(0)}`);

    const sites = [
        ['GitHub', `https://github.com/${u}`], ['Instagram', `https://instagram.com/${u}`], ['X / Twitter', `https://x.com/${u}`],
        ['TikTok', `https://tiktok.com/@${u}`], ['Facebook', `https://facebook.com/${u}`], ['Reddit', `https://reddit.com/user/${u}`],
        ['YouTube', `https://youtube.com/@${u}`], ['Telegram', `https://t.me/${u}`], ['Pinterest', `https://pinterest.com/${u}`],
        ['Tumblr', `https://`+u+`.tumblr.com`], ['Twitch', `https://twitch.tv/${u}`], ['Snapchat', `https://snapchat.com/add/${u}`],
        ['Steam', `https://steamcommunity.com/id/${u}`], ['Spotify', `https://open.spotify.com/user/${u}`], ['SoundCloud', `https://soundcloud.com/${u}`],
        ['Medium', `https://medium.com/@${u}`], ['DeviantArt', `https://`+u+`.deviantart.com`], ['Patreon', `https://patreon.com/${u}`],
        ['Etsy', `https://etsy.com/shop/${u}`], ['PayPal', `https://paypal.me/${u}`], ['Discord', `https://discord.com/users/${u}`],
        ['Blogger', `https://`+u+`.blogspot.com`], ['Vimeo', `https://vimeo.com/${u}`], ['Flickr', `https://flickr.com/people/${u}`], ['Dribbble', `https://dribbble.com/${u}`]
    ];

    let found = [];
    let notFound = [];

    for (let i = 0; i < sites.length; i++) {
        let [n,l] = sites[i];
        const percent = Math.round(((i + 1) / sites.length) * 100);
        if(i % 5 === 0) await sock.sendMessage(m.chat, { text: `${THEME.scan} *HUNTING: @${u}*\n${progressBar(percent)}`, edit: msg.key });
        try {
            const res = await axios.get(l,{timeout:4000, validateStatus: () => true});
            if(res.status == 200) found.push(`${THEME.ok} *${n}:* ${l}`);
            else notFound.push(`${THEME.err} *${n}*`);
        } catch {
            notFound.push(`${THEME.err} *${n}*`);
        }
        await delay(80);
    }

    let r = `${BANNER}\n${THEME.line}\n*> USERNAME HUNT COMPLETE*\n*Target:* @${u}\n${THEME.line}\n\n`;
    r += `*[FOUND ACCOUNTS: ${found.length}]*\n${found.join('\n') || 'None'}\n\n`;
    r += `*[NOT FOUND: ${notFound.length}]*\n${notFound.slice(0,10).join(' ')}${notFound.length > 10? '...' : ''}\n`;
    r += THEME.line;

    await sendLongText(sock, m, r);
    await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
}

// ===== 15. BREACH =====
async function cmdBreach(sock, m, args, reply) {
    const e = args[0]; if (!e||!e.includes('@')) return reply(`${THEME.err} *> Usage:*.get breach email@domain.com`);
    const result = `${BANNER}\n${THEME.line}\n*> DATA BREACH CHECK*\n*Email:* \`${e}\`\n${THEME.line}\n\n${THEME.head} *Note:* Requires HIBP API key for deep scan\n${THEME.head} *Get key:* https://haveibeenpwned.com/api\n${THEME.head} *Manual Check:* https://haveibeenpwned.com\n${THEME.line}`;
    reply(result);
}

// ===== 16. IP INFO =====
async function cmdIpInfo(sock, m, args, reply) {
    const ip = args[0]; if (!ip) return reply(`${THEME.err} *> Usage:*.get ip 8.8.8.8`);
    try {
        const res = await axios.get(`http://ip-api.com/json/${ip}`);
        const d = res.data;
        const result = `${BANNER}\n${THEME.line}\n*> IP GEOLOCATION DATA*\n*IP:* \`${ip}\`\n${THEME.line}\n\n${THEME.head} *Country:* ${d.country}\n${THEME.head} *Region:* ${d.regionName}\n${THEME.head} *City:* ${d.city}\n${THEME.head} *ISP:* ${d.isp}\n${THEME.head} *Org:* ${d.org}\n${THEME.head} *Timezone:* ${d.timezone}\n${THEME.head} *Lat/Long:* ${d.lat}, ${d.lon}\n${THEME.line}`;
        reply(result);
        await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
    } catch {
        reply(`${THEME.err} Invalid IP address`)
    }
}

// ===== 17. SSL CHECK =====
async function cmdSslCheck(sock, m, args, reply) {
    const d = args[0]; if (!d) return reply(`${THEME.err} *> Usage:*.get ssl google.com`);
    const socket = tls.connect({host: d, port: 443, timeout: 5000});
    socket.on('secureConnect', () => {
        const c = socket.getPeerCertificate();
        const result = `${BANNER}\n${THEME.line}\n*> SSL CERTIFICATE ANALYSIS*\n*Domain:* \`${d}\`\n${THEME.line}\n\n${THEME.head} *Issuer:* ${c.issuer.O || 'N/A'}\n${THEME.head} *Subject:* ${c.subject.CN || 'N/A'}\n${THEME.head} *Valid From:* ${c.valid_from}\n${THEME.head} *Valid To:* ${c.valid_to}\n${THEME.line}`;
        reply(result);
        socket.end();
        sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
    });
    socket.on('error', () => {
        reply(`${THEME.err} No SSL or invalid domain`);
        socket.destroy();
    });
    socket.on('timeout', () => {
        reply(`${THEME.err} SSL check timed out`);
        socket.destroy();
    });
}

// ===== 18. TECH STACK =====
async function cmdTechStack(sock, m, args, reply) {
    const d = args[0]; if (!d) return reply(`${THEME.err} *> Usage:*.get tech example.com`);
    try {
        const res = await axios.get(`https://${d}`, { timeout: 10000 });
        let t = [];
        if(res.headers.server) t.push(`${THEME.head} *Server:* ${res.headers.server}`);
        if(res.data.includes('wp-content')) t.push(`${THEME.head} *CMS:* WordPress`);
        if(res.data.includes('react')) t.push(`${THEME.head} *Framework:* React`);
        if(res.data.includes('vue')) t.push(`${THEME.head} *Framework:* Vue`);
        if(res.headers['x-powered-by']) t.push(`${THEME.head} *Powered by:* ${res.headers['x-powered-by']}`);
        const result = `${BANNER}\n${THEME.line}\n*> TECHNOLOGY FINGERPRINT*\n*Domain:* \`${d}\`\n${THEME.line}\n\n${t.join('\n')||`${THEME.err} Unknown`}\n${THEME.line}`;
        reply(result);
        await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
    } catch {
        reply(`${THEME.err} Tech analysis failed`)
    }
}

// ===== 19. WAYBACK =====
async function cmdWayback(sock, m, args, reply) {
    const d = args[0]; if (!d) return reply(`${THEME.err} *> Usage:*.get wayback example.com`);
    try {
        const res = await axios.get(`http://archive.org/wayback/available?url=${d}`);
        const data = res.data.archived_snapshots.closest;
        const result = data? `${BANNER}\n${THEME.line}\n*> WAYBACK ARCHIVE*\n*Domain:* \`${d}\`\n${THEME.line}\n\n${THEME.head} *Last Snapshot:* ${data.timestamp}\n${THEME.head} *URL:* ${data.url}\n${THEME.line}` : `${THEME.err} No archives found`;
        reply(result);
        await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
    } catch {
        reply(`${THEME.err} Wayback API error`)
    }
}

// ===== 20. HASH =====
async function cmdHashGen(sock, m, args, reply) {
    const t = args.join(' '); if (!t) return reply(`${THEME.err} *> Usage:*.get hash hello world`);
    const result = `${BANNER}\n${THEME.line}\n*> HASH GENERATOR*\n*Input:* \`${t}\`\n${THEME.line}\n\n${THEME.head} *MD5:* ${crypto.createHash('md5').update(t).digest('hex')}\n${THEME.head} *SHA1:* ${crypto.createHash('sha1').update(t).digest('hex')}\n${THEME.head} *SHA256:* ${crypto.createHash('sha256').update(t).digest('hex')}\n${THEME.line}`;
    reply(result);
    await sock.sendMessage(m.chat, { react: { text: THEME.ok, key: m.key }});
}