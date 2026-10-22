const { Events, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { abrirTicket, fecharTicket, assumirTicket, chamarCliente, aprovarCompraToken, recusarCompraToken, aprovarEntregaItem } = require('../utils/ticketCore');
const { getTokensConfig, getItensConfig } = require('../utils/ticketConfigs');
const { handleConfigInteraction } = require('../utils/configDashboard');
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
                if (error.code === 10062) {
                    console.warn(`⚠️ [Interação Expirada] /${interaction.commandName} demorou mais de 3s para responder à API do Discord.`);
                    return;
                }
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
        if (interaction.isAnySelectMenu && interaction.isAnySelectMenu()) {
            if (interaction.customId.startsWith('cfg_')) {
                return handleConfigInteraction(interaction);
            }
            if (interaction.customId === 'copy_sel_channel' || interaction.customId === 'copy_sel_category') {
                const { handleCopySelect } = require('../utils/channelCloner');
                return handleCopySelect(interaction);
            }
        }
        if (interaction.isStringSelectMenu()) {
            // A. Ticket: Compra de Tokens pré-definidos
            if (interaction.customId === 'token_comprar_select') {
                const qtd = parseInt(interaction.values[0], 10);
                if (isNaN(qtd) || qtd <= 0) {
                    return interaction.reply({ content: '❌ Quantidade inválida selecionada.', flags: [MessageFlags.Ephemeral] });
                }
                const tokCfg = getTokensConfig();
                const preco1k = tokCfg.preco_por_1k || 18.5;
                const valor = (qtd / 1000) * preco1k;
                return abrirTicket(interaction, 'tokens', { quantidade: qtd, valor });
            }

            // B. Ticket: Catálogo de Itens
            if (interaction.customId === 'item_comprar_select') {
                const itemId = interaction.values[0];
                const itnCfg = getItensConfig();
                const item = (itnCfg.itens || []).find(i => i.id === itemId) || { id: itemId, nome: itemId, preco: 'Consulte a staff', descricao: 'Item selecionado no catálogo' };
                return abrirTicket(interaction, 'itens', item);
            }

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

            if (cid === 'copy_btn_fechar') {
                const { handleCopyButton } = require('../utils/channelCloner');
                return handleCopyButton(interaction);
            }

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

            // Config Dashboard
            if (cid.startsWith('cfg_')) {
                return handleConfigInteraction(interaction);
            }

            // 8. Tickets - Abertura por Departamento
            if (cid === 'ticket_abrir_suporte') {
                return abrirTicket(interaction, 'suporte');
            }
            if (cid === 'ticket_abrir_compra') {
                return abrirTicket(interaction, 'compra');
            }
            if (cid === 'ticket_abrir_denuncia') {
                return abrirTicket(interaction, 'denuncia');
            }

            // 9. Tickets - Comprar Tokens Customizado (Abre Modal)
            if (cid === 'token_comprar_custom') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_token_custom')
                    .setTitle('Comprar Tokens • Personalizado');

                const input = new TextInputBuilder()
                    .setCustomId('token_custom_qtd')
                    .setLabel('Quantidade de Tokens desejada:')
                    .setPlaceholder('Ex: 15000 (mínimo 100)')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(3)
                    .setMaxLength(8)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
                return interaction.showModal(modal);
            }

            // Aprovação e Recusa Comercial
            if (cid.startsWith('token_aprovar_')) {
                const protocolo = cid.replace('token_aprovar_', '');
                return aprovarCompraToken(interaction, protocolo);
            }
            if (cid.startsWith('token_recusar_')) {
                const protocolo = cid.replace('token_recusar_', '');
                return recusarCompraToken(interaction, protocolo);
            }
            if (cid.startsWith('item_aprovar_')) {
                const protocolo = cid.replace('item_aprovar_', '');
                return aprovarEntregaItem(interaction, protocolo);
            }
            // 10. Tickets - Gerenciamento (Fechar, Assumir, Chamar)
            if (cid.startsWith('ticket_fechar_')) {
                const protocolo = cid.replace('ticket_fechar_', '');
                return fecharTicket(interaction, protocolo);
            }

            if (cid.startsWith('ticket_assumir_')) {
                const protocolo = cid.replace('ticket_assumir_', '');
                return assumirTicket(interaction, protocolo);
            }

            if (cid.startsWith('ticket_chamar_')) {
                const protocolo = cid.replace('ticket_chamar_', '');
                return chamarCliente(interaction, protocolo);
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

        // D. MODAL SUBMIT
        if (interaction.isModalSubmit()) {
            try {
                if (interaction.customId.startsWith('modal_copy_chan_') || interaction.customId.startsWith('modal_copy_cat_')) {
                    const { handleCopyModal } = require('../utils/channelCloner');
                    return await handleCopyModal(interaction);
                }
                // Modal de Configuração de Tokens (Preço & Pix)
                if (interaction.customId === 'modal_cfg_tokens' || interaction.customId.startsWith('cfg_')) {
                    return await handleConfigInteraction(interaction);
                }

                // Modal de Compra de Tokens Personalizados
                if (interaction.customId === 'modal_token_custom') {
                    const rawQtd = interaction.fields.getTextInputValue('token_custom_qtd');
                    const qtd = parseInt(rawQtd.replace(/[^0-9]/g, ''), 10);
                    if (isNaN(qtd) || qtd < 50) {
                        return await interaction.reply({
                            content: '❌ Digite uma quantidade válida (mínimo 50 tokens).',
                            flags: [MessageFlags.Ephemeral]
                        });
                    }
                    const tokCfg = getTokensConfig();
                    const preco1k = tokCfg.preco_por_1k || 18.5;
                    const valor = (qtd / 1000) * preco1k;
                    return await abrirTicket(interaction, 'tokens', { quantidade: qtd, valor });
                }

                // Modal do Criador de Embed
                if (interaction.customId === 'embed_builder_modal') {
                    const embedCmd = client.slashCommands.get('embed');
                    if (embedCmd && embedCmd.handleModal) {
                        return await embedCmd.handleModal(interaction);
                    }
                }
            } catch (error) {
                console.error('❌ Erro no modal submit:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Ocorreu um erro ao processar o formulário.', flags: [MessageFlags.Ephemeral] }).catch(() => {});
                }
            }
        }
    }
};
