/**
 * roleplay.js
 * Módulo centralizado de frases dinâmicas, contador de interações mútuas e globais.
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('./embeds');
const { getRoleplayGif } = require('./gifHelper');
const { readData, writeData } = require('./db');

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

function recordAndGetCounter(action, authorId, targetId) {
    const stats = readData('roleplay_stats', {});
    
    // 1. Contador específico do par (autor -> alvo)
    const pairKey = authorId + '_' + targetId + '_' + action;
    const pairCount = (stats[pairKey] || 0) + 1;
    stats[pairKey] = pairCount;

    // 2. Contador global de vezes que o alvo recebeu esta ação no servidor
    const receivedKey = 'received_' + targetId + '_' + action;
    const totalReceived = (stats[receivedKey] || 0) + 1;
    stats[receivedKey] = totalReceived;

    writeData('roleplay_stats', stats);

    const nouns = {
        hug: { verb: 'já abraçou', recVerb: 'já recebeu', nounSingular: 'abraço', nounPlural: 'abraços', icon: '🫂' },
        kiss: { verb: 'já beijou', recVerb: 'já recebeu', nounSingular: 'beijo', nounPlural: 'beijos', icon: '💋' },
        slap: { verb: 'já deu um tapa em', recVerb: 'já levou', nounSingular: 'tapa', nounPlural: 'tapas', icon: '💥' },
        pat: { verb: 'já fez cafuné em', recVerb: 'já recebeu', nounSingular: 'cafuné', nounPlural: 'cafunés', icon: '💆' },
        highfive: { verb: 'já tocou aqui com', recVerb: 'já tocou aqui', nounSingular: 'vez', nounPlural: 'vezes', icon: '✋' }
    };

    const item = nouns[action] || nouns.highfive;
    const totalStr = totalReceived === 1 ? '1 ' + item.nounSingular : totalReceived + ' ' + item.nounPlural;

    if (action === 'highfive') {
        const vezPar = pairCount === 1 ? '1 vez' : pairCount + ' vezes';
        return item.icon + ' *<@' + authorId + '> e <@' + targetId + '> já mandaram aquele High Five **' + vezPar + '**! (No total, <@' + targetId + '> ' + item.recVerb + ' **' + totalStr + '**)*';
    }

    const pairText = pairCount === 1 
        ? '<@' + authorId + '> ' + item.verb + ' <@' + targetId + '> **pela 1ª vez**!'
        : '<@' + authorId + '> ' + item.verb + ' <@' + targetId + '> **' + pairCount + ' vezes**!';

    return item.icon + ' *' + pairText + ' (No total, <@' + targetId + '> ' + item.recVerb + ' **' + totalStr + '**)*';
}

function getPairSummary(u1, u2) {
    const stats = readData('roleplay_stats', {});
    const actions = [
        { key: 'hug', icon: '🫂', name: 'Abraços', noun: 'abraços recebidos' },
        { key: 'kiss', icon: '💋', name: 'Beijos', noun: 'beijos recebidos' },
        { key: 'slap', icon: '💥', name: 'Tapas', noun: 'tapas levados' },
        { key: 'pat', icon: '💆', name: 'Cafunés', noun: 'cafunés recebidos' },
        { key: 'highfive', icon: '✋', name: 'High Fives', noun: 'high fives' }
    ];

    const lines = actions.map(function(act) {
        const from1to2 = stats[u1 + '_' + u2 + '_' + act.key] || 0;
        const from2to1 = stats[u2 + '_' + u1 + '_' + act.key] || 0;
        const totalPair = from1to2 + from2to1;
        const totalU2Received = stats['received_' + u2 + '_' + act.key] || from1to2;
        return act.icon + ' **' + act.name + ':** ' + totalPair + ' entre vocês (<@' + u1 + '>: ' + from1to2 + ' • <@' + u2 + '>: ' + from2to1 + ')' +
            '\n   ↳ *Total geral recebido por <@' + u2 + '>: ' + totalU2Received + ' ' + act.noun + '*';
    });

    return lines.join('\n\n');
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
    const counterText = recordAndGetCounter(canonical, interaction.user.id, alvo.id);
    const gifUrl = await getRoleplayGif(canonical);

    const embed = criarEmbedPadrao()
        .setDescription(frase + '\n\n' + counterText)
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
    const counterText = recordAndGetCounter(canonical, interaction.user.id, originalAuthorId);
    const gifUrl = await getRoleplayGif(canonical);

    const embed = criarEmbedPadrao()
        .setDescription(frase + '\n\n' + counterText)
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
    const counterText = recordAndGetCounter(canonical, message.author.id, alvo.id);
    const gifUrl = await getRoleplayGif(canonical);

    const embed = criarEmbedPadrao()
        .setDescription(frase + '\n\n' + counterText)
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
    recordAndGetCounter,
    getPairSummary,
    executeRoleplaySlash,
    executeRoleplayRetribuir,
    executeRoleplayPrefix
};
