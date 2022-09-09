require('dotenv').config();
const {Client, Intents} = require(`discord.js`);
const Minecraft = require('./Minecraft/WeLikeMinecraft');
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, `GUILDS`, `GUILD_MESSAGES`, `GUILD_MESSAGE_REACTIONS`, `DIRECT_MESSAGES`]
});


client.once(`ready`, () => {
    console.log(`Ready!`);
});

client.login(process.env.TOKEN);


let game = new Minecraft;


const prefix = 'm.';
client.on('messageCreate', msg => {
    if (msg.author.id === '915361921132269628') return; //bot id
    if (msg.author.bot) return; //ignore other bots
    else {
        let hasPrefix = false;
        let str = msg.content
        if (str.startsWith(prefix)) {
            hasPrefix = true;
            str = str.substring(prefix.length)
            if (str.toLowerCase() === 'mine') {
                try {
                    game.main(msg);
                } catch (e) {
                    console.log(e);
                    let time = new Date;
                    console.log(`${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}`);
                }
            }
        }
        else {
            if (msg.channel.id === game.activeChannel.get(msg.author.id) && game.activePlayers.get(msg.author.id)) {
                try {
                    game.responses(msg);
                } catch (e) {
                    console.log(e);
                    let time = new Date;
                    console.log(`${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}`);
                }
            }
            else return;
        }
    }
})