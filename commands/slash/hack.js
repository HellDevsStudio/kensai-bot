const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hackear')
        .setDescription('Simula um terminal hacker invadindo a conta do seu amigo na zoeira.')
        .addUserOption(opt => opt.setName('alvo').setDescription('Quem hackear?').setRequired(true)),
    async execute(interaction) {
        const alvo = interaction.options.getUser('alvo');
        await interaction.reply(`💻 [TERMINAL KENSAI] Inicializando invasão em **${alvo.username}**...`);

        const ipsFalsos = ['192.168.1.104', '10.0.0.42', '172.16.254.1', '127.0.0.1 (Home)'];
        const ip = ipsFalsos[Math.floor(Math.random() * ipsFalsos.length)];

        setTimeout(() => {
            interaction.editReply(```bash
[20%] Buscando IP de ${alvo.username}...
> IP Encontrado: ${ip}
```).catch(() => {});
        }, 1500);

        setTimeout(() => {
            interaction.editReply(```bash
[50%] Quebrando senhas salvas...
> Senha do Discord: "senhamuitosecreta123"
> Senha do Roblox: "queroRobuxGratis2026"
```).catch(() => {});
        }, 3000);

        setTimeout(() => {
            interaction.editReply(```bash
[85%] Baixando histórico secreto de pesquisa...
> "como ficar rico vendendo espada no blade ball"
> "kensai store é confiável?" (Sim, 100%!)
```).catch(() => {});
        }, 4500);

        setTimeout(() => {
            interaction.editReply(```diff
+ [100%] INVASÃO CONCLUÍDA COM SUCESSO!
+ Os dados falsos de ${alvo.username} foram arquivados com zoeira pela Kensai Store.
```).catch(() => {});
        }, 6000);
    }
};
