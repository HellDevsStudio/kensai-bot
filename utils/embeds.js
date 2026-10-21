const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Cria um Embed Base padronizado com a cor oficial do bot
 */
function criarEmbedPadrao(titulo, descricao) {
    const embed = new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTimestamp();

    if (titulo) embed.setTitle(titulo);
    if (descricao) embed.setDescription(descricao);
    return embed;
}

/**
 * Cria um Embed de Sucesso garantindo a cor oficial do bot
 */
function criarEmbedSucesso(titulo, descricao) {
    return new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTitle(titulo ? `✅ ${titulo}` : '✅ Sucesso')
        .setDescription(descricao || null)
        .setTimestamp();
}

/**
 * Cria um Embed de Erro garantindo a cor oficial do bot
 */
function criarEmbedErro(titulo, descricao) {
    return new EmbedBuilder()
        .setColor(config.EMBED_COLOR)
        .setTitle(titulo ? `❌ ${titulo}` : '❌ Erro')
        .setDescription(descricao || null)
        .setTimestamp();
}

module.exports = {
    criarEmbedPadrao,
    criarEmbedSucesso,
    criarEmbedErro
};
