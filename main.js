require('dotenv').config();
const {Client} = require(`discord.js`);
const Minecraft = require('./Minecraft/WeLikeMinecraft');
const client = new Client();


client.once(`ready`, () => {
    console.log(`Ready!`);
});

client.login(process.env.TOKEN);


let game = new Minecraft


const prefix = 'm.';
client.on('message', msg => {
    if (msg.author.id === '915361921132269628') return;
    else {
        let hasPrefix = false;
        let str = msg.content
        if (str.startsWith(prefix)) {
            hasPrefix = true;
            str = str.substring(prefix.length)
            if (str.toLowerCase() === 'mine') {
                game.main(msg);
            }
        }
        else {
            if (msg.channel.id === game.activeChannel.get(msg.author.id) && game.activePlayers.get(msg.author.id)) {
                game.responses(msg);
            }
            else return;
        }
    }
})