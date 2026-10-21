const { Events, MessageFlags } = require('discord.js');
const { criarEmbedErro, criarEmbedSucesso, criarEmbedPadrao } = require('../utils/embeds');
const { readData, writeData } = require('../utils/db');
const { formatDuration } = require('../utils/timeParser');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        // A. COMANDOS SLASH
        if (interaction.isChatInputCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            if (!command) {
                console.warn(`[Interação] Comando ${interaction.commandName} não encontrado.`);
                return;
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`❌ Erro ao executar o comando /${interaction.commandName}:`, error);
                const embedErro = criarEmbedErro('Erro na Execução', 'Ocorreu um erro ao processar este comando. Tente novamente mais tarde.');
                const erroMsg = { embeds: [embedErro], flags: [MessageFlags.Ephemeral] };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(erroMsg).catch(() => {});
                } else {
                    await interaction.reply(erroMsg).catch(() => {});
                }
            }
            return;
        }

        // B. MENU SELECT (ex: /help)
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'help_category_select') {
                const category = interaction.values[0];
                const helpCommand = client.slashCommands.get('help');
                if (helpCommand && helpCommand.handleSelect) {
                    return helpCommand.handleSelect(interaction, category);
                }
            }
            return;
        }

        // C. BOTÕES INTERATIVOS
        if (interaction.isButton()) {
            const cid = interaction.customId;

            // 1. Sugestões (Aprovar / Recusar)
            if (cid.startsWith('sug_')) {
                const parts = cid.split('_'); // sug_up_id ou sug_down_id
                const action = parts[1]; // up ou down
                const sugId = parts[2];
                const sugs = readData('sugestoes', {});
                const sug = sugs[sugId];
                if (!sug) {
                    return interaction.reply({ content: '❌ Sugestão não encontrada no registro.', flags: [MessageFlags.Ephemeral] });
                }

                sug.upvotes = sug.upvotes || [];
                sug.downvotes = sug.downvotes || [];

                const userId = interaction.user.id;
                if (action === 'up') {
                    if (sug.upvotes.includes(userId)) {
                        sug.upvotes = sug.upvotes.filter(id => id !== userId);
                    } else {
                        sug.upvotes.push(userId);
                        sug.downvotes = sug.downvotes.filter(id => id !== userId);
                    }
                } else if (action === 'down') {
                    if (sug.downvotes.includes(userId)) {
                        sug.downvotes = sug.downvotes.filter(id => id !== userId);
                    } else {
                        sug.downvotes.push(userId);
                        sug.upvotes = sug.upvotes.filter(id => id !== userId);
                    }
                }

                sugs[sugId] = sug;
                writeData('sugestoes', sugs);

                // Atualizar os botões da mensagem
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`sug_up_${sugId}`)
                        .setLabel(`Aprovar (${sug.upvotes.length})`)
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`sug_down_${sugId}`)
                        .setLabel(`Recusar (${sug.downvotes.length})`)
                        .setEmoji('❌')
                        .setStyle(ButtonStyle.Danger)
                );

                await interaction.update({ components: [row] });
                return;
            }

            // 2. Sorteio (Participar)
            if (cid.startsWith('giveaway_enter_')) {
                const giveId = cid.replace('giveaway_enter_', '');
                const sorteios = readData('sorteios', {});
                const giveaway = sorteios[giveId];

                if (!giveaway || giveaway.ended) {
                    return interaction.reply({ content: '❌ Este sorteio já foi encerrado!', flags: [MessageFlags.Ephemeral] });
                }

                giveaway.participants = giveaway.participants || [];
                const userId = interaction.user.id;
                let joined = false;

                if (giveaway.participants.includes(userId)) {
                    giveaway.participants = giveaway.participants.filter(id => id !== userId);
                } else {
                    giveaway.participants.push(userId);
                    joined = true;
                }

                sorteios[giveId] = giveaway;
                writeData('sorteios', sorteios);

                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`giveaway_enter_${giveId}`)
                        .setLabel(`🎉 Participar (${giveaway.participants.length})`)
                        .setStyle(ButtonStyle.Primary)
                );

                await interaction.update({ components: [row] });
                return interaction.followUp({
                    content: joined ? '✅ Você entrou no sorteio com sucesso!' : '🚪 Você saiu do sorteio.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            // 3. Roleplay Retribuir
            if (cid.startsWith('rp_retribuir_')) {
                const [_, __, action, originalAuthorId, targetId] = cid.split('_');
                if (interaction.user.id !== targetId) {
                    return interaction.reply({
                        content: '❌ Apenas quem recebeu a ação pode retribuir!',
                        flags: [MessageFlags.Ephemeral]
                    });
                }

                const rpCommand = client.slashCommands.get(action);
                if (rpCommand && rpCommand.executeRetribuir) {
                    return rpCommand.executeRetribuir(interaction, originalAuthorId);
                }
            }

            // 4. Confirmação Nuke
            if (cid === 'nuke_confirm' || cid === 'nuke_cancel') {
                const nukeCommand = client.slashCommands.get('nuke');
                if (nukeCommand && nukeCommand.handleButton) {
                    return nukeCommand.handleButton(interaction);
                }
            }

            // 5. Mini-game Duelo
            if (cid.startsWith('duelo_')) {
                const dueloCmd = client.slashCommands.get('duelo');
                if (dueloCmd && dueloCmd.handleButton) {
                    return dueloCmd.handleButton(interaction);
                }
            }

            // 6. Mini-game PPT
            if (cid.startsWith('ppt_')) {
                const pptCmd = client.slashCommands.get('ppt');
                if (pptCmd && pptCmd.handleButton) {
                    return pptCmd.handleButton(interaction);
                }
            }

            // 7. Mini-game Jogo da Velha (TTT)
            if (cid.startsWith('ttt_')) {
                const tttCmd = client.slashCommands.get('jogodavelha');
                if (tttCmd && tttCmd.handleButton) {
                    return tttCmd.handleButton(interaction);
                }
            }
            return;
        }

        // D. MODAL SUBMIT (ex: /embed)
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'embed_builder_modal') {
                const embedCmd = client.slashCommands.get('embed');
                if (embedCmd && embedCmd.handleModal) {
                    return embedCmd.handleModal(interaction);
                }
            }
        }
    }
};
