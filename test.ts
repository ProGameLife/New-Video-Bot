import { Client, Intents, MessageEmbed, Message, MessageAttachment, PermissionOverwriteManager, Channel, TextChannel } from "discord.js"
import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import { content } from "googleapis/build/src/apis/content";
import puppeteer from "puppeteer"
import { replaceElement } from "domutils";
import { insertAfter } from "cheerio/lib/api/manipulation";
import { assuredworkloads_v1beta1 } from "googleapis";


const prisma = new PrismaClient();
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_SCHEDULED_EVENTS, Intents.FLAGS.GUILD_MESSAGE_TYPING] });
const startLink = 'https://www.youtube.com';
const prefix = process.env.PRE_FIX ?? '!';
let arr = [];
client.on('ready', async () => {
    let browser;
    let page;
    try{
        console.log('키리 봇 on');
        const channel_table = await prisma.channel.findMany({
            select: {
                d_channel_id: true,
                youtube_id: true,
                youtube_name: true
            }
        });

        const d_channel_id = channel_table!.map((elemnet) => {
            return elemnet.d_channel_id ?? ' '   
        })
        const youtube_channel_id = channel_table!.map((elemnet) => {
            if(!elemnet.youtube_id?.startsWith('/')){
                return '/' + elemnet.youtube_id ?? ' '
            }
            return elemnet.youtube_id ?? ' '   
        })
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        page = await browser.newPage();
        page.setViewport({
            width: 1920,
            height: 1080,
        });

        //각 채널 별 영상링크 보내기 main
        for(let k=0; k < youtube_channel_id.length; k++){
            const channel = await client.channels.fetch(d_channel_id[k]) as TextChannel;

            await page.goto( startLink + youtube_channel_id[k]);

            let youtube_full_url = [];
            await page.waitForTimeout(1000);
            await page.waitForSelector('#thumbnail');
            youtube_full_url = await page.$$('#thumbnail');

            let hrefLink = await Promise.all(youtube_full_url.map((element) => {
                return element.evaluate((domElement) => {
                    return domElement.getAttribute("href");
                });
            }));
            let fullurl = [];
            for(let i=1; i<6; i++){
                fullurl[i-1] = startLink + hrefLink[i];
            }

            //신규 채널인지 아닌지 확인 하고 추가 및 url을 보낸것인지 확인
            const urltable = await prisma.url.findMany({
                select: {
                    watch_id: true
                }
            })
            
            let urltable_watch_id = urltable.flatMap((elemnet) => {
                return elemnet.watch_id
            })
            
            let temparr: any = [];
            for(let i=0; i < 5; i++){
                if(urltable_watch_id.indexOf(fullurl[i]) < 0){
                    temparr.push(fullurl[i]);
                    await channel.send(fullurl[i]);
                } else {
                    temparr.push(fullurl[i]);
                }
            }
            await prisma.url.upsert({
                where: { channel_id : youtube_channel_id[k] },
                update: { watch_id : temparr },
                create: { channel_id : youtube_channel_id[k], watch_id : fullurl }
            })
            //end

        }
    } catch(e) {
        console.log(e);
    } finally {
        if(page) await page.close();
        if(browser) await browser.close();
    }
});
 
client.on('message',async (message) => {
        if(message.channel.type == 'DM') return
        if(!message.content.startsWith(prefix)) return
        
        if(message.content.startsWith(prefix + '추가')){ // !추가 youtube_id discord_channel_id 채널별명
            arr = message.content.split(" ");
            console.log(arr);
            const createchannel = await prisma.channel.create({
                data:{
                    d_server_id : '677440818021138433',
                    youtube_id : arr[1],
                    d_channel_id: arr[2],
                    youtube_name : arr[3]    
                }
            });
            console.log(createchannel);
            arr = [];
        }
        if(message.content.startsWith(prefix + '삭제')){
            arr = message.content.split(" ");
            console.log(arr);
            const deletechannel = await prisma.channel.delete({
                where: {
                    
                },
            });
        }
});
client.login(process.env.BOT_TOKEN);