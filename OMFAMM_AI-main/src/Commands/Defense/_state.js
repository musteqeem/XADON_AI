const floodState = new Map();
const spamState = new Map();

function now() {
    return Date.now();
}

function clean(map, key, cutoff) {
    const values = map.get(key) || [];
    const fresh = values.filter(item => item.time >= cutoff);
    map.set(key, fresh);
    return fresh;
}

function recordFlood(group, sender, limit, windowSeconds) {
    const key = `${group}:${sender}`;
    const cutoff = now() - windowSeconds * 1000;
    const values = clean(floodState, key, cutoff);

    values.push({ time: now() });

    return values.length >= limit;
}

function similarity(a, b) {
    const x = String(a).toLowerCase().replace(/\s+/g, ' ').trim();
    const y = String(b).toLowerCase().replace(/\s+/g, ' ').trim();

    if (!x || !y) return 0;
    if (x === y) return 1;

    const max = Math.max(x.length, y.length);
    const distance = levenshtein(x, y);

    return 1 - distance / max;
}

function levenshtein(a, b) {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);

    for (let i = 1; i <= a.length; i += 1) {
        let previous = row[0];
        row[0] = i;

        for (let j = 1; j <= b.length; j += 1) {
            const current = row[j];
            row[j] = Math.min(
                row[j] + 1,
                row[j - 1] + 1,
                previous + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
            previous = current;
        }
    }

    return row[b.length];
}

function recordSpam(group, sender, text, limit, windowSeconds, threshold) {
    if (!text) return false;

    const key = `${group}:${sender}`;
    const cutoff = now() - windowSeconds * 1000;
    const values = clean(spamState, key, cutoff);
    const similar = values.filter(item => similarity(item.text, text) >= threshold);

    values.push({ text, time: now() });

    return similar.length + 1 >= limit;
}

module.exports = {
    recordFlood,
    recordSpam
};
