const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

module.exports = {
    TOKEN: process.env.TOKEN || '',
    CLIENT_ID: process.env.CLIENT_ID || '',
    GUILD_ID: process.env.GUILD_ID || '',
    PREFIX: process.env.PREFIX || 'k!',
    EMBED_COLOR: (process.env.EMBED_COLOR || '#9a2ea6').trim(),
    STAFF_ROLE_IDS: []
};
