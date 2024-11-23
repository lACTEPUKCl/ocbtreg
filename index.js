import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
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
  ],
});
client.commands = new Collection();
const commands = await getCommands();

for (const command of commands) {
  if ("data" in command && "execute" in command)
    client.commands.set(command.data.name, command);
  else logger.verbose("discord", 1, `The command missing! in index.js`);
}

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", (message) => {
  if (
    message.content === "!setup" &&
    message.channel.id === "1305214122727571578"
  ) {
    const attachment = new AttachmentBuilder("./img/reg.png");

    const embed = new EmbedBuilder()
      .setTitle("**Регистрация на OCBT**")
      .setDescription(
        "**Подача заявки на участие своей команды**\n" +
          'нажмите на кнопку ниже ✅ **"Регистрация"** и заполните анкету ㅤㅤㅤㅤㅤㅤㅤ\n' +
          "для заполнения:\n```\n" +
          "- Название команды:\n" +
          "- Логотип команды:\n" +
          "- Представитель команды:\n" +
          "- SteamID64 представителя команды:\n" +
          "- Человек для связи:\n" +
          "```\n" +
          "**Подача заявки на получение кастера** \n" +
          'нажмите на кнопку ниже ☑️ **"Каcтер"** и заполните анкету \n\n' +
          "Анкета для заполнения:\n```\n" +
          "- Ваш SteamID64:\n" +
          "- Ссылка на ваш канал:\n" +
          "```"
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
        .setLabel("Каcтер")
        .setEmoji("☑️")
        .setStyle(ButtonStyle.Primary)
    );

    message.channel
      .send({
        files: [attachment],
      })
      .then(() => {
        message.channel.send({
          content: "\n",
          embeds: [embed],
          components: [row],
        });
      });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  const command = interaction.client.commands.get(interaction.commandName);
  if (interaction.isChatInputCommand()) {
    try {
      await command.execute(interaction);
    } catch (error) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === "register_team") {
      showTeamRegistrationModal(interaction);
    } else if (interaction.customId === "register_caster") {
      showCasterRegistrationModal(interaction);
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === "team_registration") {
      await handleTeamRegistration(interaction);
    } else if (interaction.customId === "caster_registration") {
      await handleCasterRegistration(interaction);
    }
  }
});

function isValidSteamId(steamId) {
  return /^\d{17}$/.test(steamId);
}

function isValidImageUrl(url) {
  return /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
}

function showTeamRegistrationModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("team_registration")
    .setTitle("Регистрация команды");

  const teamNameInput = new TextInputBuilder()
    .setCustomId("team_name")
    .setLabel("Название команды")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const teamLogoInput = new TextInputBuilder()
    .setCustomId("team_logo")
    .setLabel("Лого команды")
    .setPlaceholder("Ссылка на изображение в png/jpg")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const representativeInput = new TextInputBuilder()
    .setCustomId("representative_discord")
    .setLabel("Представитель команды")
    .setPlaceholder(
      "Тот, кто регистрирует команду (не обязательно глава клана)"
    )
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const steamIdInput = new TextInputBuilder()
    .setCustomId("representative_steam")
    .setLabel("SteamID64")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("17 цифр SteamID64 (https://steamid.io/)")
    .setRequired(true);

  const contactInput = new TextInputBuilder()
    .setCustomId("contact_discord")
    .setLabel("Человек для связи")
    .setPlaceholder("Контактное лицо для связи, если пропадет связь с первым")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(teamNameInput),
    new ActionRowBuilder().addComponents(teamLogoInput),
    new ActionRowBuilder().addComponents(representativeInput),
    new ActionRowBuilder().addComponents(steamIdInput),
    new ActionRowBuilder().addComponents(contactInput)
  );

  interaction.showModal(modal);
}

async function handleTeamRegistration(interaction) {
  const teamLogo = interaction.fields.getTextInputValue("team_logo");
  const teamName = interaction.fields.getTextInputValue("team_name");
  const representativeDiscord = interaction.fields.getTextInputValue(
    "representative_discord"
  );
  const representativeSteam = interaction.fields.getTextInputValue(
    "representative_steam"
  );
  const contactDiscord =
    interaction.fields.getTextInputValue("contact_discord");

  if (!isValidSteamId(representativeSteam)) {
    await interaction.reply({
      content: "Ошибка: SteamID должен содержать 17 цифр.",
      ephemeral: true,
    });
    return;
  }

  if (!isValidImageUrl(teamLogo)) {
    await interaction.reply({
      content:
        "Ошибка: Логотип команды должен быть ссылкой на изображение (png, jpg, gif, webp).",
      ephemeral: true,
    });
    return;
  }

  const userId = interaction.user.id;
  const member = interaction.guild.members.cache.get(userId);
  const roleName = "Участник OCBT";
  const role = interaction.guild.roles.cache.find((r) => r.name === roleName);

  if (role && member) {
    await member.roles.add(role).catch((error) => {
      console.error(`Не удалось выдать роль: ${error.message}`);
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("Подтверждение регистрации команды")
    .setImage(teamLogo)
    .addFields(
      { name: "Название команды", value: teamName, inline: true },
      { name: "Представитель", value: representativeDiscord, inline: true },
      {
        name: "SteamID64",
        value: `[${representativeSteam}](https://steamcommunity.com/profiles/${representativeSteam})`,
        inline: true,
      },
      { name: "Контактное лицо", value: contactDiscord, inline: true },
      { name: "Отправитель", value: `<@${userId}>`, inline: false }
    )
    .setFooter({
      text: `Отправлено: ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    });

  const logChannelId = "1305214571912630322";
  const logChannel = interaction.guild.channels.cache.get(logChannelId);

  if (!logChannel) {
    console.error(`Канал с ID ${logChannelId} не найден.`);
    await interaction.reply({
      content:
        "Ошибка: Не удалось зарегистрировать команду. Канал логирования отсутствует.",
      ephemeral: true,
    });
    return;
  }

  await logChannel.send({ embeds: [embed] });

  await interaction.reply({
    content: "Ваша заявка на участие команды успешно принята!",
    embeds: [embed],
    ephemeral: true,
  });
}

function showCasterRegistrationModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("caster_registration")
    .setTitle("Регистрация кастера");

  const steamIdInput = new TextInputBuilder()
    .setCustomId("caster_steam_id")
    .setLabel("Ваш SteamID64")
    .setPlaceholder("17 цифр SteamID64 (https://steamid.io/)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const channelLinkInput = new TextInputBuilder()
    .setCustomId("caster_channel_link")
    .setLabel("Ссылка на ваш канал")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(steamIdInput),
    new ActionRowBuilder().addComponents(channelLinkInput)
  );

  interaction.showModal(modal);
}

async function handleCasterRegistration(interaction) {
  const steamId = interaction.fields.getTextInputValue("caster_steam_id");
  const channelLink = interaction.fields.getTextInputValue(
    "caster_channel_link"
  );

  if (!isValidSteamId(steamId)) {
    await interaction.reply({
      content: "Ошибка: SteamID должен содержать 17 цифр.",
      ephemeral: true,
    });
    return;
  }

  const userId = interaction.user.id;
  const member = interaction.guild.members.cache.get(userId);
  const roleName = "Участник OCBT";
  const role = interaction.guild.roles.cache.find((r) => r.name === roleName);

  if (role && member) {
    await member.roles.add(role).catch((error) => {
      console.error(`Не удалось выдать роль: ${error.message}`);
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("Новая заявка на кастера")
    .addFields(
      {
        name: "SteamID",
        value: `[${steamId}](https://steamcommunity.com/profiles/${steamId})`,
      },
      { name: "Ссылка на канал", value: `[Перейти](${channelLink})` },
      { name: "Отправитель", value: `<@${userId}>` }
    )
    .setFooter({
      text: `Отправлено: ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    });

  const logChannelId = "1305214613985558639";
  const logChannel = interaction.guild.channels.cache.get(logChannelId);

  if (!logChannel) {
    console.error(`Канал с ID ${logChannelId} не найден.`);
    await interaction.reply({
      content:
        "Ошибка: Не удалось зарегистрировать кастера. Канал логирования отсутствует.",
      ephemeral: true,
    });
    return;
  }

  await logChannel.send({ embeds: [embed] });

  await interaction.reply({
    content: "Ваша заявка на кастера успешно принята!",
    ephemeral: true,
  });
}

await client.login(process.env.CLIENT_TOKEN);
