// index.js (Node 18+, ESM)
// npm i discord.js https-proxy-agent undici@5 dotenv

import {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
  Collection,
  Events,
} from "discord.js";

import getCommands from "./commands/getCommands.js";
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { HttpsProxyAgent } from "https-proxy-agent";
import { ProxyAgent } from "undici";

config();

// =====================================================================
// PROXY (REST + WS)
// =====================================================================

const proxyUrl = process.env.DISCORD_PROXY_URL?.trim() || "";

const restAgent = proxyUrl ? new ProxyAgent(proxyUrl) : null;
const wsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;

if (proxyUrl) {
  console.log("[BOT] Using Discord proxy:", proxyUrl);
} else {
  console.log("[BOT] Discord proxy: disabled (DISCORD_PROXY_URL is empty)");
}

// =====================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readJson(relPath) {
  const abs = path.join(__dirname, relPath);
  const raw = await readFile(abs, "utf8");
  return JSON.parse(raw);
}

function jsonToEmbed(e) {
  const emb = new EmbedBuilder();

  if (e?.title) emb.setTitle(e.title);
  if (e?.description) emb.setDescription(e.description);
  if (typeof e?.color === "number") emb.setColor(e.color);

  if (Array.isArray(e?.fields) && e.fields.length) {
    emb.addFields(
      ...e.fields.map((f) => ({
        name: f?.name ?? "\u200B",
        value: f?.value ?? "\u200B",
        inline: Boolean(f?.inline),
      })),
    );
  }

  if (e?.image?.url) emb.setImage(e.image.url);
  if (e?.thumbnail?.url) emb.setThumbnail(e.thumbnail.url);
  if (e?.footer?.text) emb.setFooter(e.footer);
  if (e?.author?.name) emb.setAuthor(e.author);

  return emb;
}

async function loadEmbedsFromTemplate(relJsonPath) {
  const tpl = await readJson(relJsonPath);
  const arr = Array.isArray(tpl?.embeds) ? tpl.embeds : [];
  return arr.map(jsonToEmbed);
}

// =====================================================================
// CLIENT
// =====================================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],

  // ✅ REST через прокси (если задан)
  ...(restAgent ? { rest: { agent: restAgent } } : {}),

  // ✅ WS/Gateway через прокси
  ...(wsAgent ? { ws: { agent: wsAgent } } : {}),
});

client.commands = new Collection();

const commands = await getCommands();
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

// channels
const RATING_CHANNEL_ID =
  process.env.RATING_CHANNEL_ID || "1305214160983953458";

const CASTER_FORMS_CHANNEL_ID =
  process.env.CASTER_FORMS_CHANNEL_ID || "1305214613985558639";

// куда отправлять анкеты команд (кланов)
const TEAM_FORMS_CHANNEL_ID = "1305214571912630322";

// anti-double-run locks
const activeTeamRegs = new Set(); // userId
const activeCasterRegs = new Set(); // userId

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// =====================================================================
// MESSAGE SETUP
// =====================================================================

client.on("messageCreate", async (message) => {
  if (
    message.content === "!setup" &&
    message.channel.id === "1305214122727571578"
  ) {
    const attachment = new AttachmentBuilder("./img/reg.png");

    let embeds = [];
    try {
      embeds = await loadEmbedsFromTemplate("./reg.json");
    } catch (e) {
      console.error("Failed to read reg.json:", e);
      embeds = [
        new EmbedBuilder()
          .setTitle("Регистрация на OCBT")
          .setDescription(
            "Не удалось загрузить reg.json. Проверь файл и попробуй снова.",
          )
          .setColor(0x7ebca4),
      ];
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("register_team")
        .setLabel("Регистрация")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("register_caster")
        .setLabel("Кастер")
        .setEmoji("☑️")
        .setStyle(ButtonStyle.Primary),
    );

    await message.channel.send({ files: [attachment] });
    await message.channel.send({ embeds, components: [row] });
    return;
  }

  if (
    message.content === "!setup" &&
    message.channel.id === "1305214082919698482"
  ) {
    const attachment = new AttachmentBuilder("./img/info.png");

    let embeds = [];
    try {
      embeds = await loadEmbedsFromTemplate("./info.json");
    } catch (e) {
      console.error("Failed to read info.json:", e);
      embeds = [
        new EmbedBuilder()
          .setTitle("Информация")
          .setDescription(
            "Не удалось загрузить info.json. Проверь файл и попробуй снова.",
          )
          .setColor(0x43def1),
      ];
    }

    await message.channel.send({ files: [attachment] });
    await message.channel.send({ embeds });
    return;
  }

  if (
    message.content === "!setup" &&
    message.channel.id === "1305214007359176744"
  ) {
    const attachment = new AttachmentBuilder("./img/rules.png");

    let embeds = [];
    try {
      embeds = await loadEmbedsFromTemplate("./rules.json");
    } catch (e) {
      console.error("Failed to read rules.json:", e);
      embeds = [
        new EmbedBuilder()
          .setTitle("Правила")
          .setDescription(
            "Не удалось загрузить rules.json. Проверь файл и попробуй снова.",
          )
          .setColor(0x9d2235),
      ];
    }

    await message.channel.send({ files: [attachment] });
    await message.channel.send({ embeds });
    return;
  }

  // rating setup
  if (
    message.content === "!setup" &&
    message.channel.id === RATING_CHANNEL_ID
  ) {
    const attachment = new AttachmentBuilder("./img/rating.png");

    let embeds = [];
    try {
      embeds = await loadEmbedsFromTemplate("./rating.json");
    } catch (e) {
      console.error("Failed to read rating.json:", e);
      embeds = [
        new EmbedBuilder()
          .setTitle("Рейтинг")
          .setDescription(
            "Не удалось загрузить rating.json. Проверь файл и попробуй снова.",
          )
          .setColor(0x43def1),
      ];
    }

    await message.channel.send({ files: [attachment] });
    await message.channel.send({ embeds });
    return;
  }
});

// =====================================================================
// SLASH COMMANDS
// =====================================================================

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    // ⚠️ ephemeral deprecated -> use flags (64)
    const payload = {
      content: "Произошла ошибка при выполнении команды!",
      flags: 64,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
});

// =====================================================================
// BUTTONS
// =====================================================================

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  try {
    // ⚠️ ephemeral deprecated -> use flags (64)
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: 64 });
    }

    if (interaction.customId === "register_team") {
      await registerTeam(interaction);
      return;
    }

    if (interaction.customId === "register_caster") {
      await registerCaster(interaction);
      return;
    }
  } catch (e) {
    console.error(e);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply("Произошла ошибка. Попробуй ещё раз.");
      }
    } catch {}
  }
});

// =====================================================================
// HELPERS
// =====================================================================

async function ask(dm, userId, question, validate, attempts = 3) {
  while (attempts > 0) {
    await dm.send(question);

    try {
      const collected = await dm.awaitMessages({
        filter: (m) => m.author?.id === userId, // ✅ важно: ловим только пользователя
        max: 1,
        time: 120000,
        errors: ["time"],
      });

      const msg = collected.first();
      const content = msg?.content?.trim() ?? "";

      if (!validate) return { content, msg };

      const res = validate({ content, msg });
      if (res === true) return { content, msg };

      await dm.send(
        typeof res === "string" ? res : "Неверный формат. Попробуй ещё раз.",
      );
      attempts--;
    } catch {
      return null;
    }
  }
  return null;
}

async function safeEditReply(interaction, text) {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: text });
    } else {
      await interaction.reply({ content: text, flags: 64 });
    }
  } catch {}
}

function isValidHttpUrl(s) {
  return /^https?:\/\/\S+$/i.test(String(s || "").trim());
}

function isLikelyImageAttachment(att) {
  if (!att) return false;
  const ct = att.contentType || "";
  if (ct.startsWith("image/")) return true;
  const name = att.name || "";
  return /\.(png|jpe?g|gif|webp)$/i.test(name);
}

// =====================================================================
// REG TEAM
// =====================================================================

async function registerTeam(interaction) {
  const uid = interaction.user.id;

  if (activeTeamRegs.has(uid)) {
    await safeEditReply(
      interaction,
      "Регистрация уже запущена. Проверь ЛС и ответь на вопросы там.",
    );
    return;
  }

  activeTeamRegs.add(uid);

  try {
    let dm;
    try {
      dm = await interaction.user.createDM();
    } catch {
      await safeEditReply(
        interaction,
        "Не могу написать в ЛС. Открой личные сообщения (Allow DMs) и попробуй ещё раз.",
      );
      return;
    }

    const nameAns = await ask(
      dm,
      uid,
      "Введите название команды (не более 50 символов):",
      ({ content }) =>
        (content.length > 0 && content.length <= 50) ||
        "Название должно быть 1–50 символов.",
    );
    if (!nameAns) return safeEditReply(interaction, "Отменено.");
    const teamName = nameAns.content;

    const logoAns = await ask(
      dm,
      uid,
      "Отправьте логотип (картинкой в ЛС или ссылкой на картинку):",
      ({ content, msg }) => {
        const att = msg?.attachments?.first();
        const okAtt = isLikelyImageAttachment(att);
        const okUrl = isValidHttpUrl(content);
        if (okAtt || okUrl) return true;
        return "Пришли картинку (файлом) или ссылку http(s):// на картинку.";
      },
    );
    if (!logoAns) return safeEditReply(interaction, "Отменено.");

    const att = logoAns.msg?.attachments?.first();
    const logoUrl =
      att?.url || (isValidHttpUrl(logoAns.content) ? logoAns.content : null);

    const repAns = await ask(
      dm,
      uid,
      "Введите представителя команды (ник):",
      ({ content }) => content.length > 0 || "Не может быть пустым.",
    );
    if (!repAns) return safeEditReply(interaction, "Отменено.");
    const repNick = repAns.content;

    const steamAns = await ask(
      dm,
      uid,
      "Введите SteamID64 представителя (17 цифр):",
      ({ content }) =>
        /^\d{17}$/.test(content) || "SteamID64 должен быть 17 цифр.",
    );
    if (!steamAns) return safeEditReply(interaction, "Отменено.");
    const steamId64 = steamAns.content;

    const contactAns = await ask(
      dm,
      uid,
      "Введите контакт (Discord/Telegram/ссылка) для связи:",
      ({ content }) => content.length > 0 || "Не может быть пустым.",
    );
    if (!contactAns) return safeEditReply(interaction, "Отменено.");
    const contact = contactAns.content;

    const channel = await client.channels.fetch(TEAM_FORMS_CHANNEL_ID);
    const steamProfileUrl = `https://steamcommunity.com/profiles/${steamId64}`;

    const embed = new EmbedBuilder()
      .setTitle("✅ Подтверждение регистрации команды")
      .setColor(0x5865f2)
      .addFields(
        { name: "Название команды", value: teamName, inline: true },
        { name: "Представитель", value: repNick, inline: true },
        {
          name: "SteamID64",
          value: `[${steamId64}](${steamProfileUrl})`,
          inline: true,
        },
        { name: "Контакт", value: contact, inline: false },
        { name: "Отправитель", value: `<@${uid}>`, inline: false },
      )
      .setFooter({ text: `Отправлено: ${interaction.user.tag}` });

    if (logoUrl) embed.setImage(logoUrl);

    await channel.send({ embeds: [embed] });

    await dm.send("Клан зарегистрирован ✅");
    await safeEditReply(interaction, "Заявка отправлена ✅");
  } catch (e) {
    console.error(e);
    await safeEditReply(interaction, "Ошибка при регистрации команды.");
  } finally {
    activeTeamRegs.delete(uid);
  }
}

// =====================================================================
// REG CASTER
// =====================================================================

async function registerCaster(interaction) {
  const uid = interaction.user.id;

  if (activeCasterRegs.has(uid)) {
    await safeEditReply(
      interaction,
      "Заявка уже запущена. Проверь ЛС и ответь на вопросы там.",
    );
    return;
  }

  activeCasterRegs.add(uid);

  try {
    let dm;
    try {
      dm = await interaction.user.createDM();
    } catch {
      await safeEditReply(
        interaction,
        "Не могу написать в ЛС. Открой личные сообщения (Allow DMs) и попробуй ещё раз.",
      );
      return;
    }

    const steamIdMsg = await ask(
      dm,
      uid,
      "Введите ваш SteamID64 (17 цифр):",
      ({ content }) =>
        /^\d{17}$/.test(content) || "SteamID64 должен быть 17 цифр.",
    );
    if (!steamIdMsg) return safeEditReply(interaction, "Отменено.");

    const channelLinkMsg = await ask(
      dm,
      uid,
      "Отправьте ссылку на ваш канал:",
      ({ content }) =>
        (content.length > 0 && isValidHttpUrl(content)) ||
        "Ссылка должна начинаться с http(s)://",
    );
    if (!channelLinkMsg) return safeEditReply(interaction, "Отменено.");

    const channel = await client.channels.fetch(CASTER_FORMS_CHANNEL_ID);

    const steamProfileUrl = `https://steamcommunity.com/profiles/${steamIdMsg.content}`;

    const embed = new EmbedBuilder()
      .setTitle("☑️ Заявка на кастера")
      .addFields(
        {
          name: "SteamID64",
          value: `[${steamIdMsg.content}](${steamProfileUrl})`,
          inline: false,
        },
        { name: "Канал", value: channelLinkMsg.content, inline: false },
        {
          name: "От кого (Discord)",
          value: `${interaction.user.tag} (${uid})`,
          inline: false,
        },
      )
      .setColor(0x5865f2);

    await channel.send({ embeds: [embed] });

    await dm.send("Заявка на кастера отправлена ✅");
    await safeEditReply(interaction, "Заявка отправлена ✅");
  } catch (e) {
    console.error(e);
    await safeEditReply(interaction, "Ошибка при подаче заявки на кастера.");
  } finally {
    activeCasterRegs.delete(uid);
  }
}

// =====================================================================

client.login(process.env.CLIENT_TOKEN);
