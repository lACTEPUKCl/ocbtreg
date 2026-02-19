import {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  PermissionFlagsBits,
} from "discord.js";

const TEAM_BUTTON_ID = "register_team";
const CASTER_BUTTON_ID = "register_caster";

const stopocbt = new SlashCommandBuilder()
  .setName("stopocbt")
  .setDescription(
    "Остановить/включить регистрацию OCBT (кнопку команды/кастера/всё).",
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
  .addStringOption((opt) =>
    opt
      .setName("type")
      .setDescription("Что отключаем/включаем")
      .setRequired(true)
      .addChoices(
        { name: "team", value: "team" },
        { name: "caster", value: "caster" },
        { name: "all", value: "all" },
      ),
  )
  .addBooleanOption((opt) =>
    opt
      .setName("disable")
      .setDescription("true = отключить, false = включить (по умолчанию true)")
      .setRequired(false),
  );

const execute = async (interaction) => {
  try {
    const type = interaction.options.getString("type", true);
    const disable = interaction.options.getBoolean("disable") ?? true;

    await toggleOCBTButtons(interaction, disable, type);
  } catch {
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({
        content: "❌ Произошла ошибка при выполнении команды.",
        ephemeral: true,
      });
    }
    return interaction.reply({
      content: "❌ Произошла ошибка при выполнении команды.",
      ephemeral: true,
    });
  }
};

function shouldAffectButton(customId, type) {
  if (type === "all") return true;
  if (type === "team") return customId === TEAM_BUTTON_ID;
  if (type === "caster") return customId === CASTER_BUTTON_ID;
  return false;
}

const toggleOCBTButtons = async (interaction, disable, type) => {
  const channelId = process.env.REGISTRATION_CHANNEL_ID;
  const messageId = process.env.REGISTRATION_MESSAGE_ID;

  if (!channelId || !messageId) {
    return interaction.reply({
      content:
        "Ошибка конфигурации: отсутствуют REGISTRATION_CHANNEL_ID или REGISTRATION_MESSAGE_ID.",
      ephemeral: true,
    });
  }

  const channel = await interaction.client.channels.fetch(channelId);
  if (!channel) {
    return interaction.reply({
      content: "Канал с регистрацией не найден.",
      ephemeral: true,
    });
  }

  const message = await channel.messages.fetch(messageId);
  if (!message) {
    return interaction.reply({
      content: "Сообщение с регистрацией не найдено.",
      ephemeral: true,
    });
  }

  if (!message.components?.length) {
    return interaction.reply({
      content: "Сообщение не содержит кнопок для обновления.",
      ephemeral: true,
    });
  }

  // Обновляем все ActionRow (на всякий случай, если позже добавишь второй ряд)
  const updatedRows = message.components.map((row) => {
    const updatedRow = new ActionRowBuilder();

    row.components.forEach((component) => {
      const btn = ButtonBuilder.from(component);
      const customId = btn.data?.custom_id;

      if (customId && shouldAffectButton(customId, type)) {
        updatedRow.addComponents(btn.setDisabled(disable));
      } else {
        updatedRow.addComponents(btn);
      }
    });

    return updatedRow;
  });

  await message.edit({ components: updatedRows });

  const what =
    type === "all" ? "всё" : type === "team (Регистрация)" ? "team" : type;

  return interaction.reply({
    content: disable
      ? `✅ Отключено: ${type === "team" ? "Регистрация" : type === "caster" ? "Кастер" : "все кнопки"}.`
      : `✅ Включено: ${type === "team" ? "Регистрация" : type === "caster" ? "Кастер" : "все кнопки"}.`,
    ephemeral: true,
  });
};

export default { data: stopocbt, execute };
