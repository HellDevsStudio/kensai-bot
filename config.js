require('dotenv').config();

module.exports = {
    TOKEN: process.env.TOKEN || '',
    CLIENT_ID: process.env.CLIENT_ID || '',
    GUILD_ID: process.env.GUILD_ID || '',
    PREFIX: process.env.PREFIX || 'k!',
    EMBED_COLOR: process.env.EMBED_COLOR || '#5865F2',
    STAFF_ROLE_IDS: []
};
