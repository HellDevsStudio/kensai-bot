/**
 * roleplay.js
 * Módulo centralizado de frases dinâmicas e gerenciamento de ações sociais/roleplay.
 * Suporta múltiplos comandos em Português e Inglês com frases aleatórias sem repetição de títulos.
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('./embeds');
const { getRoleplayGif } = require('./gifHelper');

const ACTION_MAP = {
    abracar: 'hug',
    hug: 'hug',
    beijar: 'kiss',
    kiss: 'kiss',
    tapa: 'slap',
    slap: 'slap',
    cafune: 'pat',
    carinho: 'pat',
    pat: 'pat',
    tocaaqui: 'highfive',
    highfive: 'highfive'
};

const FRASES = {
    hug: [
        '🤗 **<@{author}>** puxou **<@{target}>** para um abraço apertado e quentinho!',
        '🫂 **<@{author}>** envolveu **<@{target}>** em um abraço reconfortante!',
        '✨ **<@{author}>** deu aquele abraço de urso carinhoso em **<@{target}>**!',
        '💖 **<@{author}>** correu e se jogou nos braços de **<@{target}>**!',
        '🌸 **<@{author}>** deu um abraço caloroso em **<@{target}>** para alegrar o dia!',
        '🥰 **<@{author}>** não resistiu à fofura e abraçou **<@{target}>** bem forte!'
    ],
    kiss: [
        '💋 **<@{author}>** deu um beijo doce e carinhoso em **<@{target}>**!',
        '😘 **<@{author}>** roubou um beijo inesperado de **<@{target}>**!',
        '💖 **<@{author}>** deu um beijinho suave na bochecha de **<@{target}>**!',
        '✨ **<@{author}>** se aproximou e plantou um beijo apaixonado em **<@{target}>**!',
        '😳 **<@{author}>** deixou **<@{target}>** completamente sem jeito com um beijo surpresa!',
        '🌸 **<@{author}>** mandou aquele beijo especial com muito carinho para **<@{target}>**!'
    ],
    slap: [
        '💥 **<@{author}>** meteu um tapa estalado na cara de **<@{target}>**!',
        '👋 **<@{author}>** deu uma bofetada lendária em **<@{target}>**!',
        '⚡ **<@{author}>** acertou um tapa com a velocidade da luz em **<@{target}>**!',
        '💢 **<@{author}>** perdeu a paciência e deu um belo tabefe em **<@{target}>**!',
        '😵 **<@{author}>** girou a mão com força e fez **<@{target}>** ver estrelas!',
        '🛑 **<@{author}>** deu um tapa pedagógico em **<@{target}>** para tomar vergonha!'
    ],
    pat: [
        '💆 **<@{author}>** fez um cafuné suave e relaxante na cabeça de **<@{target}>**!',
        '🌸 **<@{author}>** fez um carinho gostoso nos cabelos de **<@{target}>**!',
        '✨ **<@{author}>** acariciou a cabeça de **<@{target}>** com todo o afeto do mundo!',
        '🐱 **<@{author}>** começou a fazer cafuné até **<@{target}>** quase ronronar de soninho!',
        '💖 **<@{author}>** bagunçou com carinho os cabelos de **<@{target}>**!',
        '🥰 **<@{author}>** fez um cafunézinho acolhedor para animar **<@{target}>**!'
    ],
    highfive: [
        '✋ **<@{author}>** estalou aquele High Five perfeito com **<@{target}>**!',
        '⚡ **<@{author}>** e **<@{target}>** mandaram um toque de mão tão forte que saiu faísca!',
        '👊 **<@{author}>** tocou aqui com **<@{target}>** em pura sincronia!',
        '🎉 **<@{author}>** comemorou a vitória com um High Five estalado em **<@{target}>**!',
        '🔥 **<@{author}>** e **<@{target}>** chocaram as palmas com maestria!',
        '⭐ **<@{author}>** levantou a mão no alto e mandou ver no toca aqui com **<@{target}>**!'
    ]
};

const RETRIBUIR_FRASES = {
    hug: [
        '🫂 **<@{author}>** retribuiu o carinho e deu um super abraço em **<@{target}>** de volta!',
        '🤗 **<@{author}>** não ficou para trás e abraçou **<@{target}>** com o dobro de força!',
        '💖 **<@{author}>** retribuiu com aquele abraço que esquenta o coração em **<@{target}>**!'
    ],
    kiss: [
        '💋 **<@{author}>** corou de vergonha, mas retribuiu o beijo em **<@{target}>** de volta!',
        '😘 **<@{author}>** não perdeu tempo e beijou **<@{target}>** com ainda mais paixão!',
        '💖 **<@{author}>** devolveu o beijo com muito carinho para **<@{target}>**!'
    ],
    slap: [
        '💥 **<@{author}>** levantou furioso(a) e devolveu um tapa quádruplo em **<@{target}>**!',
        '💢 **<@{author}>** não deixou barato e retribuiu o tabefe com juros e correção em **<@{target}>**!',
        '⚡ **<@{author}>** revidou com uma bofetada supersônica em **<@{target}>**!'
    ],
    pat: [
        '💆 **<@{author}>** amou o carinho e começou a fazer cafuné em **<@{target}>** de volta!',
        '🌸 **<@{author}>** retribuiu com um cafuné ainda mais fofo e macio em **<@{target}>**!',
        '🥰 **<@{author}>** retribuiu o afeto e acariciou a cabeça de **<@{target}>** com um sorriso!'
    ],
    highfive: [
        '✋ **<@{author}>** retribuiu com tudo e chocou a mão com **<@{target}>**!',
        '⚡ **<@{author}>** devolveu o High Five com força total em **<@{target}>**!',
        '🔥 **<@{author}>** retribuiu o toque com sincronia perfeita em **<@{target}>**!'
    ]
};

function getRandomPhrase(action, authorId, targetId, isRetribuir) {
    const canonical = ACTION_MAP[action] || 'highfive';
    const dict = isRetribuir ? RETRIBUIR_FRASES : FRASES;
    const list = dict[canonical] || dict.highfive;
    const tpl = list[Math.floor(Math.random() * list.length)];
    return tpl.replace('{author}', authorId).replace('{target}', targetId);
}

async function executeRoleplaySlash(interaction, action) {
    const alvo = interaction.options.getUser('alvo');
    if (!alvo || alvo.id === interaction.user.id) {
        return interaction.reply({
            embeds: [criarEmbedErro('Ação Inválida', 'Você não pode usar esta ação em você mesmo!')],
            flags: [MessageFlags.Ephemeral]
        });
    }

    const canonical = ACTION_MAP[action] || 'highfive';
    const frase = getRandomPhrase(canonical, interaction.user.id, alvo.id, false);
    const gifUrl = await getRoleplayGif(canonical);

    const embed = criarEmbedPadrao()
        .setDescription(frase)
        .setImage(gifUrl)
        .setFooter({ text: 'Interação de ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('rp_retribuir_' + canonical + '_' + interaction.user.id + '_' + alvo.id)
            .setLabel('🔄 Retribuir')
            .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
}

async function executeRoleplayRetribuir(interaction, originalAuthorId, action) {
    const canonical = ACTION_MAP[action] || 'highfive';
    const frase = getRandomPhrase(canonical, interaction.user.id, originalAuthorId, true);
    const gifUrl = await getRoleplayGif(canonical);

    const embed = criarEmbedPadrao()
        .setDescription(frase)
        .setImage(gifUrl)
        .setFooter({ text: 'Retribuído por ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
}

async function executeRoleplayPrefix(message, action, args) {
    const alvo = message.mentions.users.first();
    if (!alvo || alvo.id === message.author.id) {
        return message.reply({
            embeds: [criarEmbedErro('Uso Correto', 'Mencione alguém diferente de você: `k!' + action + ' @usuario`')]
        });
    }

    const canonical = ACTION_MAP[action] || 'highfive';
    const frase = getRandomPhrase(canonical, message.author.id, alvo.id, false);
    const gifUrl = await getRoleplayGif(canonical);

    const embed = criarEmbedPadrao()
        .setDescription(frase)
        .setImage(gifUrl)
        .setFooter({ text: 'Interação de ' + message.author.username, iconURL: message.author.displayAvatarURL() });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('rp_retribuir_' + canonical + '_' + message.author.id + '_' + alvo.id)
            .setLabel('🔄 Retribuir')
            .setStyle(ButtonStyle.Primary)
    );

    await message.reply({ embeds: [embed], components: [row] });
}

module.exports = {
    ACTION_MAP,
    FRASES,
    RETRIBUIR_FRASES,
    getRandomPhrase,
    executeRoleplaySlash,
    executeRoleplayRetribuir,
    executeRoleplayPrefix
};
