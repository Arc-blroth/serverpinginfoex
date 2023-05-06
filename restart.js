const { SlashCommandBuilder } = require("discord.js");
const { spawn } = require("node:child_process");
const { once } = require("./utils");

const serverConfig = Object.assign({ service: "" }, require("./config"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server-restart")
    .setDescription("Force restarts the Minecraft server."),
  async execute(interaction) {
    if (serverConfig.service) {
      await interaction.deferReply();
      await once(spawn("docker-compose", ["restart", serverConfig.service]), "close");
      await interaction.editReply("Server restarted!");
      return;
    } else {
      await interaction.reply({
        content:
          "/server isn't configured to be able to restart the server currently.",
        ephemeral: true,
      });
    }
  },
};
