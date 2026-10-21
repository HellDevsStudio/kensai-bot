const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hackear')
        .setDescription('Simula um terminal hacker invadindo a conta do seu amigo na zoeira.')
        .addUserOption(opt => opt.setName('alvo').setDescription('Quem hackear?').setRequired(true)),
    async execute(interaction) {
        const alvo = interaction.options.getUser('alvo');
        await interaction.reply('💻 [TERMINAL KENSAI] Inicializando invasão em **' + alvo.username + '**...');

        const ipsFalsos = ['192.168.1.104', '10.0.0.42', '172.16.254.1', '127.0.0.1 (Home)'];
        const ip = ipsFalsos[Math.floor(Math.random() * ipsFalsos.length)];
        const b = String.fromCharCode(96, 96, 96);

        setTimeout(() => {
            const t1 = b + 'bash\n[20%] Buscando IP de ' + alvo.username + '...\n> IP Encontrado: ' + ip + '\n' + b;
            interaction.editReply({ content: t1 }).catch(() => {});
        }, 1500);

        setTimeout(() => {
            const t2 = b + 'bash\n[50%] Quebrando senhas salvas...\n> Senha do Discord: "senhamuitosecreta123"\n> Senha do Roblox: "queroRobuxGratis2026"\n' + b;
            interaction.editReply({ content: t2 }).catch(() => {});
        }, 3000);

        setTimeout(() => {
            const t3 = b + 'bash\n[85%] Baixando histórico secreto de pesquisa...\n> "como ficar rico vendendo espada no blade ball"\n> "kensai store é confiável?" (Sim, 100%!)\n' + b;
            interaction.editReply({ content: t3 }).catch(() => {});
        }, 4500);

        setTimeout(() => {
            const t4 = b + 'diff\n+ [100%] INVASÃO CONCLUÍDA COM SUCESSO!\n+ Os dados falsos de ' + alvo.username + ' foram arquivados com zoeira pela Kensai Store.\n' + b;
            interaction.editReply({ content: t4 }).catch(() => {});
        }, 6000);
    }
};
