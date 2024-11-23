import {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  PermissionFlagsBits,
} from "discord.js";

const stopocbt = new SlashCommandBuilder()
  .setName("stopocbt")
  .setDescription("Остановить регистрацию на OCBT.")
  .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers);

const execute = async (interaction) => {
  try {
    await toggleOCBTButtons(interaction, true);
  } catch (error) {
    await interaction.reply({
      content: "❌ Произошла ошибка при выполнении команды.",
      ephemeral: true,
    });
  }
};

const toggleOCBTButtons = async (interaction, disable) => {
  try {
    const channelId = process.env.REGISTRATION_CHANNEL_ID;
    const messageId = process.env.REGISTRATION_MESSAGE_ID;

    if (!channelId || !messageId) {
      return interaction.reply({
        content:
          "Ошибка конфигурации: отсутствуют переменные окружения для канала или сообщения.",
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

    if (!message.components || message.components.length === 0) {
      return interaction.reply({
        content: "Сообщение не содержит кнопок для обновления.",
        ephemeral: true,
      });
    }

    const actionRow = message.components[0];
    const updatedRow = new ActionRowBuilder();

    actionRow.components.forEach((button) => {
      updatedRow.addComponents(ButtonBuilder.from(button).setDisabled(disable));
    });

    await message.edit({ components: [updatedRow] });

    return interaction.reply({
      content: disable
        ? "Регистрация успешно остановлена. Кнопки отключены."
        : "Регистрация успешно активирована. Кнопки включены.",
      ephemeral: true,
    });
  } catch (error) {
    return interaction.reply({
      content: "❌ Произошла ошибка при попытке изменить состояние кнопок.",
      ephemeral: true,
    });
  }
};

export default { data: stopocbt, execute };
