/**
 * Converte strings de tempo (ex: 30s, 10m, 2h, 1d, 1h30m, 2d 5h) em milissegundos
 */
function parseDuration(str) {
    if (!str || typeof str !== 'string') return null;
    str = str.trim().toLowerCase();

    const regex = /(\d+)\s*([smhdw])/g;
    let match;
    let totalMs = 0;
    let matchesCount = 0;

    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000
    };

    while ((match = regex.exec(str)) !== null) {
        matchesCount++;
        const val = parseInt(match[1], 10);
        const unit = match[2];
        totalMs += val * (multipliers[unit] || 0);
    }

    if (matchesCount > 0) {
        const stripped = str.replace(/(\d+)\s*([smhdw])/g, '').trim();
        if (stripped.length > 0) return null;
        return totalMs;
    }

    if (/^\d+$/.test(str)) {
        return parseInt(str, 10) * 60 * 1000;
    }

    return null;
}

/**
 * Formata milissegundos para string amigável (ex: 1h 30m)
 */
function formatDuration(ms) {
    if (!ms || ms <= 0) return '0s';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0 && days === 0 && hours === 0) parts.push(`${seconds % 60}s`);

    return parts.length > 0 ? parts.join(' ') : '0s';
}

module.exports = {
    parseDuration,
    formatDuration
};
