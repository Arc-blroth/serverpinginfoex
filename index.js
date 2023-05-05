const app = require("express")();
const { verifyKeyMiddleware } = require("discord-interactions");
const { Client } = require("discord.js");
const config = require("./config");
const restart = require("./restart");
const server = require("./server");

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

app.get("/", (_req, res) => {
    res.send("wtf are you doing here");
});

app.post("/", verifyKeyMiddleware(config.key), req => {
    if (message.type === InteractionType.PING) {
        console.log("pong!");
        res.send({ "type": InteractionType.PING });
        return;
    }
    client.actions.InteractionCreate.handle(req.body);
});

app.listen(config.port || 8080, () => console.log(`Running on port ${config.port || 8080}`));
