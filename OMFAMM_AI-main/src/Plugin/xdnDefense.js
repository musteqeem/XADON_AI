/**
 * Defense registry compatibility layer.
 *
 * Automatic enforcement now lives in src/Commands/Defense/*.js and is routed
 * by the central ?.js message handler. This module is retained so older
 * commands/plugins importing it do not crash during migration.
 */
const states = new Map();

function get(chat) {
    if (!states.has(chat)) states.set(chat, {});
    return states.get(chat);
}

function set(chat, key, value) {
    const state = get(chat);
    state[key] = value;
    return state;
}

function status(chat) {
    return { ...get(chat) };
}

module.exports = {
    get,
    set,
    status
};
