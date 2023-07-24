const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { fetchNetworkPingInfo } = require("./networkpinginfo");

const serverConfig = Object.assign({ ip: undefined }, require("./config.js"));
const emptyField = { name: "\u200B", value: "\u200B", inline: false };

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Check if the Minecraft server is running.")
    .addStringOption(option =>
      option
        .setName("name")
        .setDescription("Which server to query.")
        .setRequired(false)
        .addChoices(...Object.entries(serverConfig.ips).map(([server, _]) => ({ name: server, value: server }))) 
    ),
  async execute(interaction) {
    if (serverConfig.ips) {
      let fields = [];
      let files = [];
      try {
        const ip = serverConfig.ips[interaction.options.getString('name') ?? serverConfig.default];
        let info = await fetchNetworkPingInfo(ip);
        console.log("[/server] " + JSON.stringify(info));
        let embed = new EmbedBuilder()
          .setColor(0x31f766)
          .setTitle("Server is up!")
          .setTimestamp();
        if (info.description?.text) {
          embed.setDescription(info.description.text);
        }
        if (info.favicon) {
          embed.setThumbnail("attachment://favicon.png");
          files.push(
            new AttachmentBuilder(
              Buffer.from(
                data.favicon.replace(/^data:image\/png;base64,/, ""),
                "base64"
              )
            )
              .setName("favicon.png")
              .setDescription("Server icon")
          );
        }
        fields.push({ name: "IP", value: ip, inline: false });
        if (info.version?.name) {
          fields.push({
            name: "Version",
            value: info.version.name,
            inline: true,
          });
        }
        if (info.players) {
          fields.push({
            // prettier-ignore
            name: `Players (${info.players.online || "0"}/${info.players.max || "?"})`,
            value: info.players.sample
              ? info.players.sample.map((x) => x.name).join("\n")
              : "No players right now :(",
            inline: false,
          });
        }
        fields.push(emptyField);
        embed.setFields(fields);

        await interaction.reply({
          embeds: [embed],
          files: files,
        });
      } catch (e) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xf54242)
              .setTitle("Server is down :(")
              .setDescription(`\`\`\`\n${e}\n\`\`\``)
              .addFields(emptyField)
              .setTimestamp(),
          ],
          ephemeral: true,
        });
      }
    } else {
      await interaction.reply({
        content: "/server isn't configured to check any server currently.",
        ephemeral: true,
      });
    }
  },
};
