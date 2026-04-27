
const {
Client, GatewayIntentBits, EmbedBuilder,
ActionRowBuilder, ButtonBuilder, ButtonStyle,
PermissionsBitField, StringSelectMenuBuilder,
ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');

const db = require("quick.db");

const client = new Client({
intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// CONFIG
const ADMINS = ["1479965799614775572"];

const ROLE_2X = "1495730502060085349";
const ROLE_4X = "1495730570636820530";

const VIP_BASIC = "1495730133011660880";
const VIP_PRO = "1495730342999359550";
const VIP_PREMIUM = "1495730446938669056";

const TEMPO = 24 * 60 * 60 * 1000;
const DAILY = 12 * 60 * 60 * 1000;

// PREÇOS
const PRECOS = {
vip_basico: 250,
vip_pro: 450,
vip_premium: 750,
"2x": 200,
"4x": 400,
cor: 300
};

// ECONOMIA
const getGold = async (id) => await db.get(`gold_${id}`) || 0;

// DAILY
function reward() {
const r = Math.random();
if (r < 0.50) return { gold: Math.floor(Math.random()*5)+1 };
if (r < 0.85) return { gold: Math.floor(Math.random()*5)+6 };
if (r < 0.98) return { gold: Math.floor(Math.random()*15)+11 };
return { gold: 50 };
}

// APOSTAS
function caraOuCoroa(escolha) {
return (Math.random() < 0.5 ? "cara" : "coroa") === escolha;
}
function rolarDados() {
return Math.floor(Math.random() * 6) + 1;
}

// BOOST
async function ativarBoost(member, tipo) {
const role = tipo === "2x" ? ROLE_2X : ROLE_4X;
await member.roles.add(role);

await db.set(`boost_${member.id}`, {
tipo,
expira: Date.now() + TEMPO
});
}

// REMOVER BOOST
setInterval(async () => {
const data = await db.all();

for (let d of data) {
if (!d.id.startsWith("boost_")) continue;

const userId = d.id.replace("boost_", "");
const info = d.value;

if (Date.now() >= info.expira) {
try {
const guild = client.guilds.cache.first();
const member = await guild.members.fetch(userId);

if (!member) continue;

if (info.tipo === "2x") await member.roles.remove(ROLE_2X);
else await member.roles.remove(ROLE_4X);

await db.delete(`boost_${userId}`);
} catch {}
}
}
}, 10000);

// ================= INTERAÇÕES =================
client.on("interactionCreate", async (i) => {

if (!i.inGuild()) return;

// ================= COMANDOS =================
if (i.isChatInputCommand()) {

// 💰 SALDO
if (i.commandName === "saldo")
return i.reply(`💰 | Você possui **${await getGold(i.user.id)} ST Gold**`);

// 🛠️ ADD GOLD
if (i.commandName === "addgold") {
if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator) && !ADMINS.includes(i.user.id))
return i.reply({content:"❌ | Sem permissão!",ephemeral:true});

const user = i.options.getUser("usuario");
const valor = i.options.getInteger("quantidade");

await db.add(`gold_${user.id}`, valor);
return i.reply({content:"✅ | Gold adicionado!",ephemeral:true});
}

// 💸 PIX
if (i.commandName === "pix") {
const user = i.options.getUser("usuario");
const valor = i.options.getInteger("valor");

let gold = await getGold(i.user.id);
if (gold < valor)
return i.reply({content:"❌ | Gold insuficiente!",ephemeral:true});

await db.sub(`gold_${i.user.id}`, valor);
await db.add(`gold_${user.id}`, valor);

const embed = new EmbedBuilder()
.setColor("#00ff88")
.setTitle("💸 | Transferência realizada!")
.setDescription(`💵 ${i.user} enviou **${valor} ST Gold** para ${user}`);

return i.reply({embeds:[embed]});
}

// 🪙 CARA OU COROA
if (i.commandName === "cara_ou_coroa") {
const escolha = i.options.getString("escolha");
const valor = i.options.getInteger("valor");

let gold = await getGold(i.user.id);
if (gold < valor) return i.reply("❌ | Sem saldo");

const win = caraOuCoroa(escolha);

if (win) {
await db.add(`gold_${i.user.id}`, valor);
return i.reply(`🪙 | Você ganhou **${valor} ST Gold**`);
} else {
await db.sub(`gold_${i.user.id}`, valor);
return i.reply(`❌ | Você perdeu **${valor} ST Gold**`);
}
}

// 🎲 DADOS
if (i.commandName === "dados") {
const numero = i.options.getInteger("numero");
const valor = i.options.getInteger("valor");

let gold = await getGold(i.user.id);
if (gold < valor) return i.reply("❌ | Sem saldo");

const resultado = rolarDados();

if (resultado === numero) {
await db.add(`gold_${i.user.id}`, valor*2);
return i.reply(`🎲 | Saiu **${resultado}** → Você ganhou!`);
} else {
await db.sub(`gold_${i.user.id}`, valor);
return i.reply(`🎲 | Saiu **${resultado}** → Você perdeu`);
}
}

// ⚡ BOOST (EPHEMERAL)
if (i.commandName === "boost") {
const boost = await db.get(`boost_${i.user.id}`);
if (!boost) return i.reply({content:"❌ | Nenhum boost ativo", ephemeral:true});

const t = boost.expira - Date.now();
const h = Math.floor(t/3600000);
const m = Math.floor((t%3600000)/60000);

return i.reply({
content:`⚡ | Boost ${boost.tipo}\n⏳ ${h}h ${m}m restantes`,
ephemeral:true
});
}

// 🎁 DAILY (ADM)
if (i.commandName === "daily") {

if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator) && !ADMINS.includes(i.user.id))
return i.reply({content:"❌ | Apenas administradores!",ephemeral:true});

const embed = new EmbedBuilder()
.setColor("#ff0000")
.setTitle("🎁 | Daily ST Gold")
.setDescription("Clique para resgatar sua recompensa diária!");

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId("daily_resgatar").setLabel("Resgatar").setEmoji("🎁").setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId("daily_chances").setLabel("Chances").setEmoji("📊").setStyle(ButtonStyle.Secondary)
);

return i.reply({embeds:[embed],components:[row]});
}

// 🛒 LOJA
if (i.commandName === "loja") {

const embed = new EmbedBuilder()
.setTitle("🛒 | Loja ST Community")
.setDescription("Selecione um item abaixo 👇")
.setColor("#2b2d31");

const menu = new ActionRowBuilder().addComponents(
new StringSelectMenuBuilder()
.setCustomId("menu_loja")
.setPlaceholder("Escolha um produto...")
.addOptions([
{label:"VIP Básico",value:"vip_basico",emoji:"💎"},
{label:"VIP Pro",value:"vip_pro",emoji:"💠"},
{label:"VIP Premium",value:"vip_premium",emoji:"👑"},
{label:"Boost 2x XP",value:"2x",emoji:"⚡"},
{label:"Boost 4x XP",value:"4x",emoji:"🔥"},
{label:"Cor Personalizada",value:"cor",emoji:"🎨"}
])
);

return i.reply({embeds:[embed],components:[menu],ephemeral:true});
}

}

// ================= MENU =================
if (i.isStringSelectMenu()) {

const escolha = i.values[0];
const preco = PRECOS[escolha];

return i.reply({
content:`🛍️ | Comprar **${escolha}** por **${preco} ST Gold**?`,
ephemeral:true,
components:[
new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId(`confirmar_${escolha}`).setLabel("Confirmar").setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId("cancelar").setLabel("Cancelar").setStyle(ButtonStyle.Danger)
)
]
});
}

// ================= BOTÕES =================
if (i.isButton()) {

const id = i.customId;
const user = i.user.id;

if (id === "cancelar")
return i.update({content:"❌ | Compra cancelada",components:[]});

// CONFIRMAR COMPRA
if (id.startsWith("confirmar_")) {

const item = id.replace("confirmar_","");
const preco = PRECOS[item];
let gold = await getGold(user);

if (gold < preco)
return i.update({content:"❌ | Sem gold",components:[]});

await db.sub(`gold_${user}`, preco);

let nome = "";

// VIP / BOOST
if (item === "vip_basico") { await i.member.roles.add(VIP_BASIC); nome="VIP Básico"; }
if (item === "vip_pro") { await i.member.roles.add(VIP_PRO); nome="VIP Pro"; }
if (item === "vip_premium") { await i.member.roles.add(VIP_PREMIUM); nome="VIP Premium"; }
if (item === "2x") { await ativarBoost(i.member,"2x"); nome="Boost 2x XP"; }
if (item === "4x") { await ativarBoost(i.member,"4x"); nome="Boost 4x XP"; }

// COR → MODAL
if (item === "cor") {
const modal = new ModalBuilder()
.setCustomId("modal_cor")
.setTitle("🎨 Cor Personalizada");

modal.addComponents(
new ActionRowBuilder().addComponents(
new TextInputBuilder()
.setCustomId("hex")
.setLabel("Digite a cor HEX (#ff0000)")
.setStyle(TextInputStyle.Short)
.setRequired(true)
)
);

return i.showModal(modal);
}

// EMBED FINAL
const embed = new EmbedBuilder()
.setColor("#00ff88")
.setTitle("🛒 | Compra realizada!")
.setDescription(`💎 Item: **${nome}**\n💰 Valor: **${preco} ST Gold**`);

return i.update({embeds:[embed],content:"",components:[]});
}

// DAILY
if (id === "daily_resgatar") {

const last = await db.get(`daily_${user}`);

if (last && Date.now() - last < DAILY) {
const t = DAILY - (Date.now() - last);
const h = Math.floor(t/3600000);
const m = Math.floor((t%3600000)/60000);

return i.reply({content:`❌ | Volte em ${h}h ${m}m`,ephemeral:true});
}

const r = reward();
await db.add(`gold_${user}`, r.gold);
await db.set(`daily_${user}`, Date.now());

return i.reply({content:`🎁 | Você ganhou ${r.gold} ST Gold!`,ephemeral:true});
}

if (id === "daily_chances")
return i.reply({content:"**📊 Drop Rate**\n• **50%** comum (1-5)\n• **35%** incomum (6-10)\n• **13%** épico (11-25)\n• **2%** lendário (50)",ephemeral:true});

}

// ================= MODAL =================
if (i.isModalSubmit()) {

if (i.customId === "modal_cor") {

await i.deferReply({ephemeral:true});

const hex = i.fields.getTextInputValue("hex");

if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
return i.editReply({content:"❌ | Cor inválida! Use #ff0000"});
}

try {

let role = await i.guild.roles.create({
name:`Cor ${i.user.username}`,
color:hex
});

const highest = i.member.roles.highest;
await role.setPosition(highest.position + 1);

await i.member.roles.add(role);

return i.editReply({content:"🎨 | Cor aplicada com sucesso!"});

} catch {
return i.editReply({content:"❌ | Erro! Verifique permissões do bot."});
}

}

}

});

client.once("ready",()=>console.log("🔥 BOT ONLINE"));
client.login(process.env.TOKEN);