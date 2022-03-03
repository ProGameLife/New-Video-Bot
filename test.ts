import { Client, Intents, MessageEmbed, Message, MessageAttachment, PermissionOverwriteManager, Channel, TextChannel } from "discord.js"
import "dotenv/config"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_SCHEDULED_EVENTS, Intents.FLAGS.GUILD_MESSAGE_TYPING] });

client.on('ready', async () => {
    try{
        console.log('키리 봇 on');
        const server_id = await prisma.channel.findMany({
            select: {
                d_channel_id: true
            },
            where: {
                d_server_id: '677440818021138433'
            }
        });
        const test = server_id!.map((elemnet) => {
            return elemnet.d_channel_id ?? ' '   
        })
        
        const channel = await client.channels.fetch(test[0]) as TextChannel;
        channel.send('test');
        
        
    } catch(e){
        console.log(e);
    }
})

client.login(process.env.BOT_TOKEN);

//prisma.channel,fineMany = select
//colum
//:client: id408425398661-lr0p2jsa15t4f2itkefrlpbhihheci4d.apps.googleusercontent.com 
//:password: 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