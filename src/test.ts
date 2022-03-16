import "dotenv/config";
import { 
    Client, 
    Intents, 
    TextChannel,
    MessageEmbed,
    AwaitMessagesOptions,
    MessageActionRow,
    Channel,
    Message,
} from "discord.js";
import puppeteer from "puppeteer";
import { PrismaClient } from '@prisma/client';
import cron from "node-cron";
import { view_list_command } from "./command/view_list"
import { create_channel } from "./sql/insert"
import { insert_channel_status } from "./command/insert_channel";
import { delete_channel_name } from "./command/delete_channel";

const CHANNELREGEX = /[^0-9]/g; //숫자 빼고
const TEXTREGEX = /^[ㄱ-ㅎ|가-힣|ㅏ-ㅢ|a-z|A-Z|0-9|]+/;
const LINKREGEX = /\/(channel|user|c)\/[a-zA-z0-9-_ㄱ-ㅎ가-힣]+/;
const STARTLINK = 'https://www.youtube.com';
const HELPTITLE = '!추가 , !삭제, !목록, !취소,!채팅채널변경';
const HELPVALUE = '1. 가져오고 싶은 youtube채널 접속\n' +
                  '2. 해당 채널의 주소창 확인 ( https://www.youtube.com/channel/UCs6EwgxKLY9GG4QNUrP5hoQ )\n' +
                  '3. 주소의 /channel 부터 끝가지 복사\n4. 종종 채널 대신에 /c로 시작하는 것도 있으니 같은 방법으로 복사';
const HELPCANCLE = '!취소 명령어는 자신이 실행중이던 명령어를 취소하는 명령어 입니다.\n명령어 사용중 잘못입력한거 같으면 !취소 입력시 취소 됩니다.';
const HELPINSERT = '!추가 명령어는 자신이 디스코드에서 새영상을 보고 싶은 채널을 추가 시키는 명령어 입니다.'; 
const HELPDELETE = '!삭제 명령어는 새영상을 더이상 보고싶지 않을 경우 채널을 삭제 시킬 수 있는 명령어 입니다.';
const HELPLIST = '!목록 입력 시 현재 추가되어있는 채널 목록 확인 가능합니다!';
const HELPUPDATECHAT = '!채팅채널변경은 특정 유튜브 영상의 링크가 보이는 채팅채널을 변경하는 명령어 입니다.';

const prisma = new PrismaClient();
const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_MESSAGE_TYPING, 
        Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
    ],
});

client.on('ready', async () => {
    console.log('키리 봇 on');
    cron.schedule('*/5 * * * *', async () => {
        let browser;
        let page;

        try{
            const channel_table = await prisma.channel.findMany({
                select: {
                    d_channel_id: true,
                    youtube_id: true,
                    youtube_name: true,
                },
            });

            const d_channel_id = channel_table!.map((elemnet) => {
                return elemnet.d_channel_id ?? ' ';
            });
            const youtube_channel_id = channel_table!.map((elemnet) => {
                if(!elemnet.youtube_id?.startsWith('/')){
                    return '/' + elemnet.youtube_id ?? ' ';
                }
                return elemnet.youtube_id ?? ' ';
            });

            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            page = await browser.newPage();
            page.setViewport({
                width: 1920,
                height: 1080,
            });

            //각 채널 별 영상링크 보내기 main
            for(let k = 0; k < youtube_channel_id.length; k++){
                let chat_channel = d_channel_id[k].replace(CHANNELREGEX,'');
                
                const channel = await client.channels.fetch(chat_channel) as TextChannel;
                
                await page.goto( STARTLINK + youtube_channel_id[k] + '/videos');

                let youtube_full_url = [];
                await page.waitForTimeout(2000);
                await page.waitForSelector('#thumbnail');
                youtube_full_url = await page.$$('#thumbnail');
                

                let hrefLink = await Promise.all(youtube_full_url.map((element) => {
                    return element.evaluate((domElement) => {
                        return domElement.getAttribute("href");
                    });
                }));

                if(!hrefLink) continue;

                let fullurl = [];
                for(let i = 1; i < 6; i++){
                    fullurl[i - 1] = STARTLINK + hrefLink[i];
                }

                //신규 채널인지 아닌지 확인 하고 추가 및 url을 보낸것인지 확인
                const urltable = await prisma.url.findMany({
                    select: {
                        watch_id: true,
                    },
                    where: {
                        channel_id: youtube_channel_id[k],
                    },
                });
                
                let urltable_watch_id = urltable.flatMap((elemnet) => {
                    return elemnet.watch_id
                });
                
                let temparr: any = [];
                for(let i = 0; i < 5; i++){
                    fullurl[i] = fullurl[i].replace('shorts/','watch?v=');
                    if(!(urltable_watch_id.includes(fullurl[i]))){
                        await channel.send(fullurl[i]);
                    }
                    await temparr.push(fullurl[i]);
                }

                console.log(temparr);

                await prisma.url.upsert({
                    where: { channel_id : youtube_channel_id[k] },
                    update: { watch_id : temparr },
                    create: { channel_id : youtube_channel_id[k], watch_id : fullurl },
                });
                //end
            }
        }catch(e){
            console.log(e);
        }finally{
            if(page) await page.close();
            if(browser) await browser.close();
        }
    });
});
 
let insert_state = {
    add: false,
    step: 0,
    new_chat_flag: '',
    youtube_link: '',
    youtube_name: '',
    chat_channel_id: '',
}

let delete_stat = {
    add: false,
    step: 0,
    youtube_name: '',
    delete_flag: '',
}

client.on('message', async (message) => {
        if(message.channel.type == 'DM' || message.author.bot) return

        const filter_link = (m: Message) => (m.content.startsWith('/channel/') || m.content.startsWith('/c/') || m.content.startsWith('/user/')) && 
                                            m.author.id == message.author.id;
        const filter_name = (m: Message) => m.author.id == message.author.id;
        const filter_check = (m: Message) => m.author.id == message.author.id && 
                                            (m.content.startsWith('Y') || m.content.startsWith('N'));
        const discord_server_id = message.guildId ?? ' ';

        if(message.content == '!취소'){
            delete_stat = {
                add: false,
                step: 0,
                youtube_name: '',
                delete_flag: '',
            }
            insert_state = {
                add: false,
                step: 0,
                new_chat_flag: '',
                youtube_link: '',
                youtube_name: '',
                chat_channel_id: '',
            }
            message.reply('명령어가 취소됩니다.');
        }

        if(message.content == '!목록'){
            await view_list_command(message, prisma);
        }
        
        if(insert_state.add){ 
            insert_channel_status(prisma, message, discord_server_id, filter_link, filter_check, filter_name, TEXTREGEX, LINKREGEX, insert_state);
        }

        if(message.content === '!추가' ){ 
            insert_state.add = true;
            insert_state.step = 0;
            message.reply('⬇⬇⬇⬇⬇추가할 유튜브의 채널 ID를 입력하시오⬇⬇⬇⬇⬇');
        }

        if(delete_stat.add){
            delete_channel_name(prisma, filter_name, filter_check, message, delete_stat, CHANNELREGEX, client, TEXTREGEX);
        }

        if(message.content === '!삭제'){
            delete_stat.add = true;
            delete_stat.step = 0;
            message.reply('⬇⬇⬇⬇⬇삭제할 유튜브의 채널 이름을 입력하시오⬇⬇⬇⬇⬇');
        }
        
        // if(message.content == '!채팅채널변경'){
        //     await prisma.channel.update({
        //         where: { youtube_name :  },
        //         data: { d_channel_id :  },
        //     });
        //     //message.reply('채팅채널이 변경되었습니다.' + HELPCHECK);
        // }

        if(message.content == '!도움말' || message.content == '!명령어'){
            const embed = new MessageEmbed()
                    .setColor('#448CCB')
                    .setTitle('도움말')
                    .addFields(
                        { name: '명령어 목록', value: HELPTITLE },
                        { name: '채널ID가져오는 방법', value: HELPVALUE },
                        { name: '!취소 명령어 사용법', value: HELPCANCLE },
                        { name: '!추가 명령어 사용법',  value: HELPINSERT },
                        { name: '!삭제 명령어 사용법', value: HELPDELETE },
                        { name: '!목록 명령어 사용법', value: HELPLIST },
                        { name: '!채팅채널변경 명령어 사용법', value: HELPUPDATECHAT },
                    );
            message.reply({ embeds: [embed] });
        }
});

client.login(process.env.BOT_TOKEN);