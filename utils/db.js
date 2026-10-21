const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function getFilePath(filename) {
    return path.join(dataDir, filename.endsWith('.json') ? filename : `${filename}.json`);
}

function readData(filename, defaultValue = {}) {
    const file = getFilePath(filename);
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2), 'utf8');
            return defaultValue;
        }
        const raw = fs.readFileSync(file, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error(`[DB] Erro ao ler ${filename}:`, e.message);
        return defaultValue;
    }
}

function writeData(filename, data) {
    const file = getFilePath(filename);
    try {
        const tmp = `${file}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
        fs.renameSync(tmp, file);
        return true;
    } catch (e) {
        console.error(`[DB] Erro ao gravar ${filename}:`, e.message);
        return false;
    }
}

module.exports = { readData, writeData };
