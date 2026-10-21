const { Events, REST, Routes, ActivityType } = require('discord.js');
const config = require('../config');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ [${client.user.tag}] Bot online com sucesso!`);

        // Status inicial dinâmico
        client.user.setPresence({
            status: 'online',
            activities: [{
                name: 'Kensai Systems',
                type: ActivityType.Playing
            }]
        });

        // Registro automático de Comandos Slash no Discord
        try {
            const rest = new REST({ version: '10' }).setToken(config.TOKEN);
            const commandsData = client.slashCommands.map(cmd => cmd.data.toJSON());

            if (commandsData.length > 0) {
                console.log(`🔄 Sincronizando ${commandsData.length} comandos Slash com a API do Discord...`);
                
                // Se tiver GUILD_ID configurado, registra local (instantâneo para testes)
                // Senão, registra globalmente (pode levar até 1h para propagar em todos servidores)
                if (config.GUILD_ID && config.CLIENT_ID) {
                    await rest.put(
                        Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
                        { body: commandsData }
                    );
                    console.log(`✓ Comandos Slash sincronizados na guilda ${config.GUILD_ID}!`);
                } else if (config.CLIENT_ID) {
                    await rest.put(
                        Routes.applicationCommands(config.CLIENT_ID),
                        { body: commandsData }
                    );
                    console.log('✓ Comandos Slash sincronizados globalmente!');
                } else {
                    console.warn('⚠️ CLIENT_ID não configurado no .env. Pulei o registro automático de slash commands.');
                }
            }
        } catch (error) {
            console.error('❌ Erro ao registrar comandos slash:', error);
        }
    }
};
