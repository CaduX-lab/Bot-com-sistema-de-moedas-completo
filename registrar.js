const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1495467746085961869";
const GUILD_ID = "1479965799606255793";

const commands = [

new SlashCommandBuilder()
.setName("saldo")
.setDescription("💰 Ver seu saldo atual"),

new SlashCommandBuilder()
.setName("daily")
.setDescription("🎁 Abrir painel de recompensa diária"),

new SlashCommandBuilder()
.setName("loja")
.setDescription("🛒 Abrir loja de itens"),

new SlashCommandBuilder()
.setName("boost")
.setDescription("⚡ Ver seu boost ativo"),

new SlashCommandBuilder()
.setName("pix")
.setDescription("💸 Transferir ST Gold para outro jogador")
.addUserOption(o =>
    o.setName("usuario")
    .setDescription("👤 Usuário que irá receber")
    .setRequired(true))
.addIntegerOption(o =>
    o.setName("valor")
    .setDescription("💰 Quantidade de ST Gold")
    .setRequired(true)),

new SlashCommandBuilder()
.setName("cara_ou_coroa")
.setDescription("🪙 Aposte na sorte: cara ou coroa")
.addStringOption(o =>
    o.setName("escolha")
    .setDescription("🪙 Escolha sua aposta")
    .setRequired(true)
    .addChoices(
        { name: "Cara", value: "cara" },
        { name: "Coroa", value: "coroa" }
    ))
.addIntegerOption(o =>
    o.setName("valor")
    .setDescription("💰 Valor da aposta")
    .setRequired(true)),

new SlashCommandBuilder()
.setName("dados")
.setDescription("🎲 Aposte nos dados e teste sua sorte")
.addIntegerOption(o =>
    o.setName("numero")
    .setDescription("🎯 Escolha um número (1-6)")
    .setRequired(true)
    .setMinValue(1)
    .setMaxValue(6))
.addIntegerOption(o =>
    o.setName("valor")
    .setDescription("💰 Valor da aposta")
    .setRequired(true)),

new SlashCommandBuilder()
.setName("addgold")
.setDescription("🛠️ Adicionar ST Gold (apenas ADM)")
.addUserOption(o =>
    o.setName("usuario")
    .setDescription("👤 Usuário que receberá")
    .setRequired(true))
.addIntegerOption(o =>
    o.setName("quantidade")
    .setDescription("💰 Quantidade de ST Gold")
    .setRequired(true))

];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
try {
    console.log("🔄 Limpando comandos antigos...");

    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: [] }
    );

    console.log("✅ Comandos antigos removidos!");

    console.log("🔄 Registrando novos comandos...");

    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands.map(c => c.toJSON()) }
    );

    console.log("✅ Comandos registrados com sucesso!");

} catch (err) {
    console.error("❌ ERRO:", err);
}
})();