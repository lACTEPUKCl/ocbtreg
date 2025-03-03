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
config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();
const commands = await getCommands();
for (const command of commands) {
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  }
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", (message) => {
  if (
    message.content === "!setup" &&
    message.channel.id === "1305214122727571578"
  ) {
    const attachment = new AttachmentBuilder("./img/reg.png");
    const embed = new EmbedBuilder()
      .setTitle("Регистрация на OCBT")
      .setDescription(
        "Подача заявки на участие команды\n" +
          "Нажмите на кнопку ниже «Регистрация» и заполните форму:\n" +
          "1) Название команды\n" +
          "2) Логотип (файл или ссылка)\n" +
          "3) Представитель команды\n" +
          "4) SteamID64 представителя\n" +
          "5) Человек для связи\n\n" +
          "Подача заявки на кастера\n" +
          "Нажмите на кнопку «Кастер» и заполните форму:\n" +
          "1) Ваш SteamID64\n" +
          "2) Ссылка на ваш канал"
      )
      .setColor(0x7ebca4);
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
        .setStyle(ButtonStyle.Primary)
    );
    message.channel.send({ files: [attachment] }).then(() => {
      message.channel.send({
        embeds: [embed],
        components: [row],
      });
    });
  }
  if (
    message.content === "!setup" &&
    message.channel.id === "1305214082919698482"
  ) {
    const attachment = new AttachmentBuilder("./img/info.png");
    const importantInfoEmbed = new EmbedBuilder()
      .setTitle("Важная информация")
      .setDescription(
        "🏆 Призовой фонд:\n\n" +
          "1 место — 10,000 рублей\n" +
          "2 место — 5,000 рублей\n" +
          "3 место — VIP на сервер\n\n" +
          "- Команда должна иметь единый тег\n" +
          "- Не менее 10 участников с одним тегом\n" +
          "- Сетка турнира зависит от количества команд\n" +
          "- +1-2 человека на замену\n" +
          "- Переигровка при вылете 3+ человек\n" +
          "- Доп. раунд при равенстве тикетов\n" +
          "- Перенос игры при критическом баге\n" +
          "- Минимум 8 команд для старта"
      )
      .setColor(0x43b581);
    const navigationEmbed = new EmbedBuilder()
      .setTitle("Навигация")
      .setDescription(
        "- <#1305213973934637098> Актуальные новости\n" +
          "- <#1305214007359176744> Правила\n" +
          "- <#1305214122727571578> Подача заявок\n" +
          "- <#1305214160983953458> Зарегистрированные команды\n" +
          "- <#1305214220844924959> Общение участников\n" +
          "- <#1305214678867247234> Расписание и сетка"
      )
      .setColor(0x43b581);
    message.channel.send({ files: [attachment] }).then(() => {
      message.channel.send({
        embeds: [importantInfoEmbed, navigationEmbed],
      });
    });
  }
  if (
    message.content === "!setup" &&
    message.channel.id === "1305214007359176744"
  ) {
    const attachment = new AttachmentBuilder("./img/rules.png");
    const generalRulesEmbed = new EmbedBuilder()
      .setTitle("Общие правила")
      .setDescription(
        "1. Запрещены любые оскорбления (дисквалификация игрока)\n" +
          "2. Запрещен руин/подстава/договорные матчи (дисквалификация команды)\n" +
          "3. Запрещено использовать баги (дисквалификация от матча)\n" +
          "4. Опоздание или недобор игроков 20 минут (дисквалификация)\n" +
          "5. Запрещены читы, эксплойты, ПО (дисквалификация, пермабан)"
      )
      .setColor(0x9d2235);
    const casterRulesEmbed = new EmbedBuilder()
      .setTitle("Правила для кастеров")
      .setDescription(
        "1. Задержка на трансляции не менее 3 минут\n" +
          "2. Название отряда: «камера, стрим, ютуб» и т.д.\n" +
          "3. Отряд должен быть закрыт\n" +
          "4. Указывать в описании канала турнир OCBT"
      )
      .setColor(0x9d2235);
    const additionEmbed = new EmbedBuilder()
      .setTitle("Дополнение")
      .setDescription(
        "При любом инциденте, не описанном в правилах, но дающем нечестное преимущество, решение принимают организаторы."
      )
      .setColor(0x9d2235);
    message.channel.send({ files: [attachment] }).then(() => {
      message.channel.send({
        embeds: [generalRulesEmbed, casterRulesEmbed, additionEmbed],
      });
    });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "Произошла ошибка при выполнении команды.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "Произошла ошибка при выполнении команды.",
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === "register_team") {
      try {
        await interaction.reply({
          content: "Проверьте личные сообщения для регистрации команды.",
          ephemeral: true,
        });
        registerTeam(interaction);
      } catch {}
    } else if (interaction.customId === "register_caster") {
      try {
        await interaction.reply({
          content: "Проверьте личные сообщения для регистрации кастера.",
          ephemeral: true,
        });
        registerCaster(interaction);
      } catch {}
    }
  }
});

async function ask(dm, prompt, validate) {
  let attempts = 3;
  while (attempts > 0) {
    await dm.send(prompt);
    try {
      const filter = (m) => !m.author.bot;
      const collected = await dm.awaitMessages({
        filter,
        max: 1,
        time: 300000,
        errors: ["time"],
      });
      const content = collected.first();
      if (!content) return null;
      if (!validate) return content;
      if (validate(content)) return content;
      await dm.send("Введены некорректные данные. Повторите ввод.");
      attempts--;
    } catch {
      return null;
    }
  }
  return null;
}

function isValidSteamIdValue(value) {
  return /^\d{17}$/.test(value.trim());
}

function isValidImageUrlValue(value) {
  return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(value.trim());
}

async function askForImage(dm, prompt) {
  let attempts = 3;
  while (attempts > 0) {
    await dm.send(prompt);
    try {
      const filter = (m) => !m.author.bot;
      const collected = await dm.awaitMessages({
        filter,
        max: 1,
        time: 300000,
        errors: ["time"],
      });
      const msg = collected.first();
      if (!msg) return null;
      if (msg.attachments.size > 0) {
        const file = msg.attachments.first();
        if (file && file.contentType && file.contentType.startsWith("image/")) {
          return file.url;
        }
        await dm.send("Файл не является изображением. Повторите попытку.");
      } else {
        if (isValidImageUrlValue(msg.content)) {
          return msg.content.trim();
        }
        await dm.send(
          "Ссылка не является корректным изображением. Повторите попытку."
        );
      }
      attempts--;
    } catch {
      return null;
    }
  }
  return null;
}

async function registerTeam(interaction) {
  try {
    const dm = await interaction.user.createDM();
    const nameMsg = await ask(
      dm,
      "Введите название команды (не более 50 символов):",
      (m) => m.content.trim().length <= 50
    );
    if (!nameMsg) {
      await dm.send("Регистрация прервана.");
      return;
    }
    const teamName = nameMsg.content.trim();
    const logoUrl = await askForImage(
      dm,
      "Отправьте логотип (ссылка или файл):"
    );
    if (!logoUrl) {
      await dm.send("Регистрация прервана.");
      return;
    }
    const repMsg = await ask(
      dm,
      "Введите Discord представителя команды:",
      (m) => m.content.trim().length > 0
    );
    if (!repMsg) {
      await dm.send("Регистрация прервана.");
      return;
    }
    const representative = repMsg.content.trim();
    const steamMsg = await ask(
      dm,
      "Введите SteamID64 представителя (17 цифр):",
      (m) => isValidSteamIdValue(m.content)
    );
    if (!steamMsg) {
      await dm.send("Регистрация прервана.");
      return;
    }
    const steamId = steamMsg.content.trim();
    const contactMsg = await ask(
      dm,
      "Введите контактное лицо для связи:",
      (m) => m.content.trim().length > 0
    );
    if (!contactMsg) {
      await dm.send("Регистрация прервана.");
      return;
    }
    const contact = contactMsg.content.trim();
    const userId = interaction.user.id;
    const member = interaction.guild.members.cache.get(userId);
    const role = interaction.guild.roles.cache.find(
      (r) => r.name === "Участник OCBT"
    );
    if (role && member) {
      try {
        await member.roles.add(role);
      } catch {}
    }
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("Подтверждение регистрации команды")
      .setImage(logoUrl)
      .addFields(
        { name: "Название команды", value: teamName, inline: true },
        { name: "Представитель", value: representative, inline: true },
        {
          name: "SteamID64",
          value: `[${steamId}](https://steamcommunity.com/profiles/${steamId})`,
          inline: true,
        },
        { name: "Контактное лицо", value: contact, inline: true },
        { name: "Отправитель", value: `<@${userId}>` }
      )
      .setFooter({
        text: `Отправлено: ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });
    const logChannel = interaction.guild.channels.cache.get(
      "1305214571912630322"
    );
    if (!logChannel) {
      await dm.send(
        "Ошибка: Канал логирования не найден. Регистрация отменена."
      );
      return;
    }
    await logChannel.send({ embeds: [embed] });
    await dm.send("Ваша заявка успешно принята!");
  } catch {
    try {
      await interaction.user.send(
        "Произошла ошибка или истекло время ожидания. Регистрация прервана."
      );
    } catch {}
  }
}

async function registerCaster(interaction) {
  try {
    const dm = await interaction.user.createDM();
    const steamMsg = await ask(dm, "Введите ваш SteamID64 (17 цифр):", (m) =>
      isValidSteamIdValue(m.content)
    );
    if (!steamMsg) {
      await dm.send("Регистрация прервана.");
      return;
    }
    const steamId = steamMsg.content.trim();
    const linkMsg = await ask(
      dm,
      "Введите ссылку на ваш канал:",
      (m) => m.content.trim().length > 0
    );
    if (!linkMsg) {
      await dm.send("Регистрация прервана.");
      return;
    }
    const channelLink = linkMsg.content.trim();
    const userId = interaction.user.id;
    const member = interaction.guild.members.cache.get(userId);
    const role = interaction.guild.roles.cache.find(
      (r) => r.name === "Участник OCBT"
    );
    if (role && member) {
      try {
        await member.roles.add(role);
      } catch {}
    }
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("Новая заявка на кастера")
      .addFields(
        {
          name: "SteamID",
          value: `[${steamId}](https://steamcommunity.com/profiles/${steamId})`,
        },
        { name: "Ссылка на канал", value: channelLink },
        { name: "Отправитель", value: `<@${userId}>` }
      )
      .setFooter({
        text: `Отправлено: ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });
    const logChannel = interaction.guild.channels.cache.get(
      "1305214613985558639"
    );
    if (!logChannel) {
      await dm.send(
        "Ошибка: Канал логирования не найден. Регистрация отменена."
      );
      return;
    }
    await logChannel.send({ embeds: [embed] });
    await dm.send("Ваша заявка успешно принята!");
  } catch {
    try {
      await interaction.user.send(
        "Произошла ошибка или истекло время ожидания. Регистрация прервана."
      );
    } catch {}
  }
}

await client.login(process.env.CLIENT_TOKEN);
