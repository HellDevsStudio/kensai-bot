const { 
    SlashCommandBuilder, 
    PermissionsBitField, 
    ChannelType, 
    MessageFlags 
} = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedSucesso, criarEmbedErro } = require('../../utils/embeds');
const { 
    getSuporteConfig, setSuporteConfig, 
    getTokensConfig, setTokensConfig, 
    getItensConfig, setItensConfig 
} = require('../../utils/ticketConfigs');
const { 
    gerarPainelSuportePayload, 
    gerarPainelTokensPayload, 
    gerarPainelItensPayload 
} = require('../../utils/ticketPanels');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Painel de configuração central dos sistemas da Kensai Store.')
        .addSubcommand(sub =>
            sub.setName('ver')
                .setDescription('Visualiza todas as configurações ativas de Suporte, Tokens e Itens.')
        )
        .addSubcommand(sub =>
            sub.setName('painel')
                .setDescription('Envia um dos painéis de atendimento oficial no canal.')
                .addStringOption(opt =>
                    opt.setName('tipo')
                        .setDescription('Qual painel deseja enviar?')
                        .setRequired(true)
                        .addChoices(
                            { name: '🎫 Painel de Suporte Geral', value: 'suporte' },
                            { name: '💰 Painel de Tokens', value: 'tokens' },
                            { name: '⚔️ Painel de Itens & Catálogo', value: 'itens' }
                        )
                )
                .addChannelOption(opt =>
                    opt.setName('canal')
                        .setDescription('Canal de destino (padrão: canal atual)')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('suporte')
                .setDescription('Configura o sistema de Tickets de Suporte.')
                .addChannelOption(opt =>
                    opt.setName('categoria')
                        .setDescription('Categoria onde os tickets serão abertos')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false)
                )
                .addChannelOption(opt =>
                    opt.setName('canal_logs')
                        .setDescription('Canal onde os transcripts e logs serão salvos')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
                .addRoleOption(opt =>
                    opt.setName('cargo_staff')
                        .setDescription('Cargo da equipe de suporte')
                        .setRequired(false)
                )
                .addBooleanOption(opt =>
                    opt.setName('enviar_painel')
                        .setDescription('Enviar o painel de suporte no canal atual após salvar?')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('tokens')
                .setDescription('Configura o sistema de compra de Tokens e Pix.')
                .addNumberOption(opt =>
                    opt.setName('preco_1k')
                        .setDescription('Preço por 1.000 tokens em Reais (ex: 18.50)')
                        .setRequired(false)
                )
                .addStringOption(opt =>
                    opt.setName('chave_pix')
                        .setDescription('Chave Pix para pagamentos da loja')
                        .setRequired(false)
                )
                .addChannelOption(opt =>
                    opt.setName('categoria')
                        .setDescription('Categoria onde os tickets de tokens serão abertos')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false)
                )
                .addChannelOption(opt =>
                    opt.setName('canal_logs')
                        .setDescription('Canal de logs das compras de tokens')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
                .addRoleOption(opt =>
                    opt.setName('cargo_staff')
                        .setDescription('Cargo de vendas de tokens')
                        .setRequired(false)
                )
                .addBooleanOption(opt =>
                    opt.setName('enviar_painel')
                        .setDescription('Enviar o painel de tokens no canal atual após salvar?')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('itens')
                .setDescription('Configura o sistema de Catálogo e Entrega de Itens.')
                .addChannelOption(opt =>
                    opt.setName('categoria')
                        .setDescription('Categoria onde os tickets de itens serão abertos')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false)
                )
                .addChannelOption(opt =>
                    opt.setName('canal_logs')
                        .setDescription('Canal de logs de entrega de itens')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
                .addRoleOption(opt =>
                    opt.setName('cargo_staff')
                        .setDescription('Cargo da staff de entrega de itens')
                        .setRequired(false)
                )
                .addBooleanOption(opt =>
                    opt.setName('enviar_painel')
                        .setDescription('Enviar o painel de itens no canal atual após salvar?')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const sub = interaction.options.getSubcommand();

        // 1. VISUALIZAR TODAS AS CONFIGURAÇÕES
        if (sub === 'ver') {
            const sup = getSuporteConfig();
            const tok = getTokensConfig();
            const itn = getItensConfig();

            const embed = criarEmbedPadrao('⚙️ Configurações dos Sistemas • Kensai Store')
                .setDescription('Aqui está o status atual de cada um dos 3 sistemas operacionais da loja:\n\n' +
                    '📁 *Os arquivos dedicados ficam salvos em `data/configs/`.*')
                .addFields(
                    {
                        name: '🎫 1. Sistema de Suporte (`suporte.json`)',
                        value: '• **Categoria:** ' + (sup.categoria_id ? '<#' + sup.categoria_id + '>' : 'N/A') + '\n' +
                               '• **Logs:** ' + (sup.canal_logs_id ? '<#' + sup.canal_logs_id + '>' : 'N/A') + '\n' +
                               '• **Cargo Staff:** ' + (sup.cargo_staff_id ? '<@&' + sup.cargo_staff_id + '>' : 'N/A'),
                        inline: false
                    },
                    {
                        name: '💰 2. Sistema de Tokens (`tokens.json`)',
                        value: '• **Preço 1k:** `R$ ' + Number(tok.preco_por_1k || 18.5).toFixed(2).replace('.', ',') + '`\n' +
                               '• **Chave Pix:** `' + (tok.chave_pix || 'Não configurada') + '`\n' +
                               '• **Categoria:** ' + (tok.categoria_id ? '<#' + tok.categoria_id + '>' : 'N/A') + '\n' +
                               '• **Logs:** ' + (tok.canal_logs_id ? '<#' + tok.canal_logs_id + '>' : 'N/A') + '\n' +
                               '• **Cargo Staff:** ' + (tok.cargo_staff_id ? '<@&' + tok.cargo_staff_id + '>' : 'N/A'),
                        inline: false
                    },
                    {
                        name: '⚔️ 3. Sistema de Itens (`itens.json`)',
                        value: '• **Itens no Catálogo:** ' + (itn.itens ? itn.itens.length : 0) + ' cadastrados\n' +
                               '• **Categoria:** ' + (itn.categoria_id ? '<#' + itn.categoria_id + '>' : 'N/A') + '\n' +
                               '• **Logs:** ' + (itn.canal_logs_id ? '<#' + itn.canal_logs_id + '>' : 'N/A') + '\n' +
                               '• **Cargo Staff:** ' + (itn.cargo_staff_id ? '<@&' + itn.cargo_staff_id + '>' : 'N/A'),
                        inline: false
                    }
                )
                .setFooter({ text: 'Use /config <suporte|tokens|itens|painel> para alterar' });

            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        // 2. ENVIAR PAINEL
        if (sub === 'painel') {
            const tipo = interaction.options.getString('tipo');
            const canalAlvo = interaction.options.getChannel('canal') || interaction.channel;

            let payload;
            if (tipo === 'suporte') payload = gerarPainelSuportePayload();
            else if (tipo === 'tokens') payload = gerarPainelTokensPayload();
            else if (tipo === 'itens') payload = gerarPainelItensPayload();

            const msgEnviada = await canalAlvo.send(payload);

            if (tipo === 'suporte') setSuporteConfig({ canal_painel_id: canalAlvo.id, mensagem_painel_id: msgEnviada.id });
            if (tipo === 'tokens') setTokensConfig({ canal_painel_id: canalAlvo.id, mensagem_painel_id: msgEnviada.id });
            if (tipo === 'itens') setItensConfig({ canal_painel_id: canalAlvo.id, mensagem_painel_id: msgEnviada.id });

            return interaction.reply({
                embeds: [criarEmbedSucesso('Painel Enviado', 'O **Painel de ' + tipo.toUpperCase() + '** foi enviado com sucesso em ' + canalAlvo.toString() + '!')],
                flags: [MessageFlags.Ephemeral]
            });
        }

        // 3. CONFIGURAR SUPORTE
        if (sub === 'suporte') {
            const categoria = interaction.options.getChannel('categoria');
            const logs = interaction.options.getChannel('canal_logs');
            const staff = interaction.options.getRole('cargo_staff');
            const enviar = interaction.options.getBoolean('enviar_painel');

            const updates = {};
            if (categoria) updates.categoria_id = categoria.id;
            if (logs) updates.canal_logs_id = logs.id;
            if (staff) updates.cargo_staff_id = staff.id;

            const updated = setSuporteConfig(updates);

            let extraMsg = '';
            if (enviar) {
                const payload = gerarPainelSuportePayload();
                const msg = await interaction.channel.send(payload);
                setSuporteConfig({ canal_painel_id: interaction.channel.id, mensagem_painel_id: msg.id });
                extraMsg = '\n\n📢 *O painel de suporte foi enviado neste canal logo acima!*';
            }

            return interaction.reply({
                embeds: [criarEmbedSucesso(
                    'Suporte Configurado',
                    'As configurações de Suporte foram salvas em `data/configs/suporte.json`!\n\n' +
                    '• **Categoria:** ' + (updated.categoria_id ? '<#' + updated.categoria_id + '>' : 'N/A') + '\n' +
                    '• **Logs:** ' + (updated.canal_logs_id ? '<#' + updated.canal_logs_id + '>' : 'N/A') + '\n' +
                    '• **Staff:** ' + (updated.cargo_staff_id ? '<@&' + updated.cargo_staff_id + '>' : 'N/A') +
                    extraMsg
                )],
                flags: [MessageFlags.Ephemeral]
            });
        }

        // 4. CONFIGURAR TOKENS
        if (sub === 'tokens') {
            const preco = interaction.options.getNumber('preco_1k');
            const pix = interaction.options.getString('chave_pix');
            const categoria = interaction.options.getChannel('categoria');
            const logs = interaction.options.getChannel('canal_logs');
            const staff = interaction.options.getRole('cargo_staff');
            const enviar = interaction.options.getBoolean('enviar_painel');

            const updates = {};
            if (preco !== null && preco > 0) updates.preco_por_1k = preco;
            if (pix) updates.chave_pix = pix;
            if (categoria) updates.categoria_id = categoria.id;
            if (logs) updates.canal_logs_id = logs.id;
            if (staff) updates.cargo_staff_id = staff.id;

            const updated = setTokensConfig(updates);

            let extraMsg = '';
            if (enviar) {
                const payload = gerarPainelTokensPayload();
                const msg = await interaction.channel.send(payload);
                setTokensConfig({ canal_painel_id: interaction.channel.id, mensagem_painel_id: msg.id });
                extraMsg = '\n\n📢 *O painel de tokens foi enviado neste canal logo acima!*';
            }

            return interaction.reply({
                embeds: [criarEmbedSucesso(
                    'Tokens Configurado',
                    'As configurações de Tokens foram salvas em `data/configs/tokens.json`!\n\n' +
                    '• **Preço 1k:** `R$ ' + Number(updated.preco_por_1k).toFixed(2).replace('.', ',') + '`\n' +
                    '• **Chave Pix:** `' + updated.chave_pix + '`\n' +
                    '• **Categoria:** ' + (updated.categoria_id ? '<#' + updated.categoria_id + '>' : 'N/A') + '\n' +
                    '• **Logs:** ' + (updated.canal_logs_id ? '<#' + updated.canal_logs_id + '>' : 'N/A') + '\n' +
                    '• **Staff:** ' + (updated.cargo_staff_id ? '<@&' + updated.cargo_staff_id + '>' : 'N/A') +
                    extraMsg
                )],
                flags: [MessageFlags.Ephemeral]
            });
        }

        // 5. CONFIGURAR ITENS
        if (sub === 'itens') {
            const categoria = interaction.options.getChannel('categoria');
            const logs = interaction.options.getChannel('canal_logs');
            const staff = interaction.options.getRole('cargo_staff');
            const enviar = interaction.options.getBoolean('enviar_painel');

            const updates = {};
            if (categoria) updates.categoria_id = categoria.id;
            if (logs) updates.canal_logs_id = logs.id;
            if (staff) updates.cargo_staff_id = staff.id;

            const updated = setItensConfig(updates);

            let extraMsg = '';
            if (enviar) {
                const payload = gerarPainelItensPayload();
                const msg = await interaction.channel.send(payload);
                setItensConfig({ canal_painel_id: interaction.channel.id, mensagem_painel_id: msg.id });
                extraMsg = '\n\n📢 *O catálogo de itens foi enviado neste canal logo acima!*';
            }

            return interaction.reply({
                embeds: [criarEmbedSucesso(
                    'Itens Configurado',
                    'As configurações de Itens foram salvas em `data/configs/itens.json`!\n\n' +
                    '• **Itens Ativos:** ' + (updated.itens ? updated.itens.length : 0) + ' cadastrados\n' +
                    '• **Categoria:** ' + (updated.categoria_id ? '<#' + updated.categoria_id + '>' : 'N/A') + '\n' +
                    '• **Logs:** ' + (updated.canal_logs_id ? '<#' + updated.canal_logs_id + '>' : 'N/A') + '\n' +
                    '• **Staff:** ' + (updated.cargo_staff_id ? '<@&' + updated.cargo_staff_id + '>' : 'N/A') +
                    extraMsg
                )],
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};
