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

  // ✅ WS/Gateway через прокси (как в твоём другом боте)
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

// куда отправлять анкеты команд (кланов)
const TEAM_FORMS_CHANNEL_ID = "1305214571912630322";

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
    const payload = {
      content: "Произошла ошибка при выполнении команды!",
      ephemeral: true,
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
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
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

async function ask(dm, question, validate, attempts = 3) {
  while (attempts > 0) {
    await dm.send(question);

    try {
      const collected = await dm.awaitMessages({
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
      await interaction.reply({ content: text, ephemeral: true });
    }
  } catch {}
}

async function registerTeam(interaction) {
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
      "Введите название команды (не более 50 символов):",
      ({ content }) =>
        (content.length > 0 && content.length <= 50) ||
        "Название слишком длинное.",
    );
    if (!nameAns) return safeEditReply(interaction, "Отменено.");
    const teamName = nameAns.content;

    const logoAns = await ask(
      dm,
      "Отправьте логотип (картинкой в ЛС или ссылкой):",
      ({ content, msg }) => {
        const hasAttachment = (msg?.attachments?.size ?? 0) > 0;
        const hasText = content.length > 0;
        if (hasAttachment || hasText) return true;
        return "Логотип не может быть пустым. Пришли картинку или ссылку.";
      },
    );
    if (!logoAns) return safeEditReply(interaction, "Отменено.");

    const logoUrl =
      logoAns.msg?.attachments?.first()?.url || logoAns.content || null;

    const repAns = await ask(
      dm,
      "Введите представителя команды (ник):",
      ({ content }) => content.length > 0 || "Не может быть пустым.",
    );
    if (!repAns) return safeEditReply(interaction, "Отменено.");
    const repNick = repAns.content;

    const steamAns = await ask(
      dm,
      "Введите SteamID64 представителя:",
      ({ content }) =>
        /^\d{17}$/.test(content) || "SteamID64 должен быть 17 цифр.",
    );
    if (!steamAns) return safeEditReply(interaction, "Отменено.");
    const steamId64 = steamAns.content;

    const contactAns = await ask(
      dm,
      "Введите контактное лицо (Discord/ник/контакт):",
      ({ content }) => content.length > 0 || "Не может быть пустым.",
    );
    if (!contactAns) return safeEditReply(interaction, "Отменено.");
    const contact = contactAns.content;

    const channel = await client.channels.fetch(TEAM_FORMS_CHANNEL_ID);
    const steamProfileUrl = `https://steamcommunity.com/profiles/${steamId64}`;

    const embed = new EmbedBuilder()
      .setTitle("Подтверждение регистрации команды")
      .setColor(0x5865f2)
      .addFields(
        { name: "Название команды", value: teamName, inline: true },
        { name: "Представитель", value: repNick, inline: true },
        {
          name: "SteamId64",
          value: `[${steamId64}](${steamProfileUrl})`,
          inline: true,
        },
        { name: "Контактное лицо", value: contact, inline: false },
        {
          name: "Отправитель",
          value: `<@${interaction.user.id}>`,
          inline: false,
        },
      )
      .setFooter({ text: `Отправлено: ${repNick}` });

    if (logoUrl) embed.setImage(logoUrl);

    await channel.send({ embeds: [embed] });

    await dm.send("Клан зарегистрирован ✅");
    await safeEditReply(interaction, "Заявка отправлена ✅");
  } catch (e) {
    console.error(e);
    await safeEditReply(interaction, "Ошибка при регистрации команды.");
  }
}

async function registerCaster(interaction) {
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
      "Введите ваш SteamID64:",
      ({ content }) =>
        /^\d{17}$/.test(content) || "SteamID64 должен быть 17 цифр.",
    );
    if (!steamIdMsg) return safeEditReply(interaction, "Отменено.");

    const channelLinkMsg = await ask(
      dm,
      "Отправьте ссылку на ваш канал:",
      ({ content }) => content.length > 0 || "Ссылка не может быть пустой.",
    );
    if (!channelLinkMsg) return safeEditReply(interaction, "Отменено.");

    const channel = await client.channels.fetch(RATING_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("☑️ Заявка на кастера")
      .addFields(
        { name: "SteamID64", value: steamIdMsg.content, inline: false },
        { name: "Канал", value: channelLinkMsg.content, inline: false },
        {
          name: "От кого (Discord)",
          value: `${interaction.user.tag} (${interaction.user.id})`,
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
  }
}

// =====================================================================

client.login(process.env.CLIENT_TOKEN);
