const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const { addCommand, clearRegistry } = require('./xdnCmd');

const loadCommands = () => {
    clearRegistry();

    const cmdPath = path.join(__dirname, '../Commands');
    if (!fs.existsSync(cmdPath)) {
        console.log(chalk.red('❌ Commands folder not found'));
        return 0;
    }

    const loadedFiles = new Set();
    const seen = new Set();
    let total = 0;
    let skipped = 0;

    for (const category of fs.readdirSync(cmdPath, { withFileTypes: true })) {
        if (!category.isDirectory() || category.name.startsWith('.')) continue;

        const catPath = path.join(cmdPath, category.name);
        const files = fs.readdirSync(catPath)
            .filter(file => file.endsWith('.js'))
            .sort((a, b) => a.localeCompare(b));

        for (const file of files) {
            const filePath = path.join(catPath, file);

            try {
                const resolvedPath = require.resolve(filePath);
                if (loadedFiles.has(resolvedPath)) continue;
                loadedFiles.add(resolvedPath);
                delete require.cache[resolvedPath];

                const exported = require(filePath);
                const modules = Array.isArray(exported) ? exported : [exported];

                for (const raw of modules) {
                    if (!raw || typeof raw !== 'object') {
                        skipped++;
                        continue;
                    }

                    // Backward compatibility with older command modules.
                    const cmd = { ...raw };
                    cmd.name = String(cmd.name || cmd.command || '').trim();
                    cmd.alias = Array.isArray(cmd.alias)
                        ? cmd.alias.map(String).map(x => x.trim()).filter(Boolean)
                        : [];
                    cmd.desc = cmd.desc || cmd.description || `${cmd.name} command`;
                    cmd.usage = cmd.usage || (cmd.name ? `.${cmd.name}` : '');
                    cmd.category = category.name;
                    cmd.groupOnly = Boolean(cmd.groupOnly);
                    cmd.ownerOnly = Boolean(cmd.ownerOnly || cmd.owner === true);
                    cmd.sudoOnly = Boolean(cmd.sudoOnly || cmd.sudo === true);
                    cmd.adminOnly = Boolean(cmd.adminOnly || cmd.admin === true);
                    cmd.botAdmin = Boolean(cmd.botAdmin);

                    if (!cmd.name || typeof cmd.execute !== 'function') {
                        skipped++;
                        console.log(chalk.yellow(`[CMD SKIP] ${file}: missing name/execute`));
                        continue;
                    }

                    const originalName = cmd.name;
                    const requestedKeys = [cmd.name, ...cmd.alias]
                        .map(x => String(x).toLowerCase())
                        .filter(Boolean);

                    // Never silently throw away a valid command because an older
                    // module used the same name. Keep the first command on its
                    // public name, then expose later implementations through a
                    // deterministic, category/file-specific name.
                    if (requestedKeys.some(key => seen.has(key))) {
                        const safeCategory = category.name
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-');
                        const safeFile = path.basename(file, '.js')
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-');
                        let uniqueName = `${originalName}-${safeCategory}-${safeFile}`.replace(/-+/g, '-');
                        let suffix = 2;

                        while (seen.has(uniqueName.toLowerCase())) {
                            uniqueName = `${originalName}-${safeCategory}-${safeFile}-${suffix++}`.replace(/-+/g, '-');
                        }

                        cmd.name = uniqueName;
                        cmd.originalName = originalName;
                        cmd.alias = cmd.alias.filter(alias => !seen.has(String(alias).toLowerCase()));

                        console.log(chalk.cyan(`[CMD DUP→UNIQUE] ${file}: ${originalName} → ${uniqueName}`));
                    }

                    const finalKeys = [cmd.name, ...cmd.alias]
                        .map(x => String(x).toLowerCase())
                        .filter(Boolean)
                        .filter(key => !seen.has(key));

                    addCommand(cmd);
                    finalKeys.forEach(key => seen.add(key));
                    total++;
                }
            } catch (err) {
                skipped++;
                console.log(chalk.red(`[CMD ERROR] ${category.name}/${file}: ${err.message}`));
            }
        }
    }

    console.log(chalk.green(`✅ Loaded ${total} commands (${skipped} skipped)`));
    return total;
};

module.exports = { loadCommands };
