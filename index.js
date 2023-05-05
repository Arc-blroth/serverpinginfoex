const process = require("node:process");
const { verifyKeyMiddleware, InteractionType } = require("discord-interactions");
const { Client, REST, Routes } = require("discord.js");
const express = require("express");
const config = require("./config");
const restart = require("./restart");
const server = require("./server");

if (process.argv.slice(2).includes("register")) {
  fetch(`https://discord.com/api/v10/oauth2/token`, {
    method: "POST",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: Object.entries({
      grant_type: "client_credentials",
      scope: "applications.commands.update",
      client_id: config.client_id.toString(),
      client_secret: config.client_secret.toString(),
    }).reduce((data, [key, value]) => {
      data.append(key, value);
      return data;
    }, new URLSearchParams()),
  })
    .then((res) => res.json())
    .then((token) => {
      const rest = new REST({ authPrefix: "Bearer" }).setToken(
        token.access_token
      );
      return rest.put(Routes.applicationCommands(config.client_id), {
        body: [restart.data.toJSON(), server.data.toJSON()],
      });
    })
    .then((data) => {
      console.log(`Registered ${data.length} commands!`);
    });
} else {
  const client = new Client({ intents: [] });
  client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName == "server") {
        await server.execute(interaction);
        return;
      } else if (interaction.commandName == "server-restart") {
        await restart.execute(interaction);
        return;
      }
    }
  });

  const app = express();
  app.get("/", (_req, res) => {
    res.send("wtf are you doing here");
  });

  app.post("/", verifyKeyMiddleware(config.key), (req) => {
    const message = req.body;
    if (message.type === InteractionType.PING) {
      console.log("[ping] pong!");
      res.send({ type: InteractionType.PING });
      return;
    }
    client.actions.InteractionCreate.handle(req.body);
  });

  app.listen(config.port || 8080, () =>
    console.log(`Running on port ${config.port || 8080}`)
  );
}
