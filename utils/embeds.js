const { EmbedBuilder } = require('discord.js');
const config = require('../config');

function criarEmbedSucesso(titulo, descricao) {
    return new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle(titulo ? `✅ ${titulo}` : null)
        .setDescription(descricao)
        .setTimestamp();
}

function criarEmbedErro(titulo, descricao) {
    return new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle(titulo ? `❌ ${titulo}` : null)
        .setDescription(descricao)
        .setTimestamp();
}

function criarEmbedPadrao(titulo, descricao) {
    return new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTitle(titulo || null)
        .setDescription(descricao)
        .setTimestamp();
}

module.exports = {
    criarEmbedSucesso,
    criarEmbedErro,
    criarEmbedPadrao
};
