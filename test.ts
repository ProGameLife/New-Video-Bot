import "dotenv/config"
import { 
    Client, 
    Intents, 
    TextChannel,
    MessageEmbed,
    AwaitMessagesOptions,
    MessageActionRow,
    Channel,
    Message,
} from "discord.js"
import puppeteer from "puppeteer"
import { PrismaClient } from '@prisma/client'
import cron from "node-cron";
import { ChannelType } from "discord-api-types";
import { chat } from "googleapis/build/src/apis/chat";

const CHANNELREGEX = /[^0-9]/g;
const PREFIX = process.env.PRE_FIX ?? '!';
const STARTLINK = 'https://www.youtube.com';
const HELPCHECK = '\n!목록 명령어로 확인하십시오';
const HELPTITLE = '!추가 , !삭제, !목록, !채팅채널추가, !채팅채널삭제, !채팅채널변경';
const HELPVALUE = '1. 가져오고 싶은 youtube채널 접속\n' +
                  '2. 해당 채널의 주소창 확인 ( https://www.youtube.com/channel/UCs6EwgxKLY9GG4QNUrP5hoQ )\n' +
                  '3. 주소의 /channel 부터 끝가지 복사\n4. 종종 채널 대신에 /c로 시작하는 것도 있으니 같은 방법으로 복사';
const HELPINSERT = '형태 : !추가 채널ID 채널이름 디스코드채팅채널\n' +
                   '예시 : !추가 /channel/UCs6EwgxKLY9GG4QNUrP5hoQ 징버거';
const HELPRULE = '모든 명령어는 사이사이에 공백(space)를 넣어서 구분 해주세요!';
const HELPDELETE = '형태 : !삭제 채널이름 \n예시 : !삭제 징버거';
const HELPLIST = '!목록 입력 시 현재 추가된 채널 목록 확인 가능합니다!';
const HELPUPDATECHAT = '형태 : !채팅채널변경 채널이름 #변경할채팅채널 \n' +
                       '예시 : !채팅채널변경 징버거 #임시\n결과 : 기존에 있던 #징버거 채널에서 #임시로 변경 됩니다';



//유튜브 채널을 추가를 할 때 그거에 맞는 채팅채널을 자동으로 추가 하게 만들고
//또한 해당 유튜브 채널을 삭제할 때엔 자동으로 채팅채널도 삭제는 
const prisma = new PrismaClient();
const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_MESSAGE_TYPING, 
        Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
    ],
});

let command: string[] = [];

client.on('ready', async () => {
    console.log('키리 봇 on');
    cron.schedule('* */1 * * *', async () => {
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
                    if(fullurl[i].includes('shorts')){
                        fullurl[i].replaceAll('/shorts/','/watch?');
                    }
                    console.log(fullurl[i]);
                    if(urltable_watch_id.includes(fullurl[i])){
                        await temparr.push(fullurl[i]);
                    }else{    
                        await temparr.push(fullurl[i]);
                        await channel.send(fullurl[i]);
                    }
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

const insert_messages = [
    '⬇⬇⬇⬇⬇추가할 유튜브의 채널 ID를 입력하시오⬇⬇⬇⬇⬇', 
    '⬇⬇⬇⬇⬇추가할 유튜브의 채널 이름을 입력하시오⬇⬇⬇⬇⬇',
    '기존 채팅채널에 새 영상을 올리고 싶으면 "Y" 입력!!\n새 채팅채널에 새 영상을 올리고 싶으면 "N" 입력!!',
    [
        '기존 채팅채널명을 입력해주세요!!  EX) #테스트',
        '새롭게 생성할 채팅채널명을 입력해주세요!! EX) 테스트'
    ],
    ' ',
    '채널이 추가되었습니다.' + HELPCHECK,
]
const delete_messages = [
    '⬇⬇⬇⬇⬇삭제할 유튜브의 채널 이름을 입력하시오⬇⬇⬇⬇⬇',
    '채널이 삭제되었습니다.' + HELPCHECK,
]

client.on('message', async (message) => {
        if(message.channel.type == 'DM') return
        if(message.author.bot) return;

        const filter_link = (m: Message) => m.content.startsWith('/') && 
                                    m.author.id == message.author.id && !m.content.startsWith('취소');
        const filter_name = (m: Message) => m.author.id == message.author.id && !m.content.startsWith('취소');
        const filter_check = (m: Message) => m.author.id == message.author.id && !m.content.startsWith('취소') && 
                                                (m.content.startsWith('Y') || m.content.startsWith('N'));
        
        const discord_server_id = message.guildId;

        console.log(insert_state);

        if(insert_state.add){ 
            switch(insert_state.step){
                case 0:// 링크 물어보기
                    if(filter_link(message)){
                        insert_state.youtube_link = message.content;
                        
                        const check_youtube_id = await prisma.channel.findMany({
                            select: { youtube_id: true },
                            where: { youtube_id: insert_state.youtube_link },
                        })
                        if(check_youtube_id.length > 0){
                            message.reply('이미 있는 채널입니다. !목록 확인 후 시도해주시기 바랍니다.');
                            insert_state = {
                                add: false,
                                step: 0,
                                new_chat_flag: '',
                                youtube_link: '',
                                youtube_name: '',
                                chat_channel_id: '',
                            }
                        }
                    }else{
                        message.reply('/channel/UCs6EwgxKLY9GG4QNUrP5hoQ 또는 /c/채널명 의 형식으로 입력해주세요. \n진짜 가끔 /user로 시작하는 채널도 있음^^;;');
                        insert_state.step--;
                    }
                    break;
                case 1:// 이름 물어보기
                    if(filter_name(message)){
                        insert_state.youtube_name = message.content;
                    }else{
                        message.reply('조건에 맞지 않는 것을 입력하였습니다. 다시 입력 부탁드립니다.');
                        insert_state.step--;
                    }
                    break;
                case 2:// 채팅채널 기준 물어보기
                    if(filter_check(message)){
                        insert_state.new_chat_flag = message.content;
                    }else{
                        message.reply('조건에 맞지 않는 것을 입력하였습니다. 다시 입력 부탁드립니다.');
                        insert_state.step--;
                    }
                    break;
                case 3:// 채팅채널 별명 물어보기
                    if(filter_name(message)){
                        insert_state.chat_channel_id = message.content;
                    }else{
                        message.reply('조건에 맞지 않는 것을 입력하였습니다. 다시 입력 부탁드립니다.');
                        insert_state.step--;
                    }
                    break;
                case 4:// 채팅채널을 새로 만들지 기존 채널을 사용 할지에 따른 분기
                    if(filter_check(message) && message.content === 'Y'){
                        if(insert_state.chat_channel_id.startsWith('<#')){ // 기존 채널
                            await prisma.channel.create({
                                data: {
                                    d_server_id: discord_server_id,
                                    youtube_id: insert_state.youtube_link,
                                    youtube_name: insert_state.youtube_name, 
                                    d_channel_id: insert_state.chat_channel_id,   
                                },
                            });
                        }else{ // 신규 채널
                            const channel_create_result =  await message.guild?.channels.create(insert_state.chat_channel_id , {
                                    type: "GUILD_TEXT",
                                    permissionOverwrites: [{
                                        id: message.guild?.roles.everyone,
                                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
                                    }],
                                    parent: '948112373602988082',
                            });
                            const channel_create_table = await prisma.channel.create({
                                data: {
                                    d_server_id: discord_server_id,
                                    youtube_id: insert_state.youtube_link,
                                    youtube_name: insert_state.youtube_name, 
                                    d_channel_id: '<#' + channel_create_result?.id + '>',   
                                },
                            });
                            console.log('channel_create_table : ' + channel_create_table);
                        }
                    }else if(filter_check(message) && message.content === 'N'){
                        message.reply('입력이 취소 되었습니다.');
                    }else{
                        message.reply('Y 또는 N을 입력해주세요.');
                        insert_state.step--;
                    }    
                    break;
            }

            insert_state.step++;

            if(insert_state.step === 3){
                message.reply(insert_messages[insert_state.step][insert_state.new_chat_flag === 'Y' ? 0 : 1]);
            }else if(insert_state.step === 4){
                message.reply('채널 ID : ' + insert_state.youtube_link + '\n채널 이름 :' + insert_state.youtube_name + 
                              '\n채팅채널이름 :' + insert_state.chat_channel_id + '\n입력한 값을 확인 해주시기 바랍니다. 맞으면 "Y" 틀리면 "N" 입력');
            }else{
                message.reply(insert_messages[insert_state.step] as string); 
            }
            if(insert_state.step === 5){ 
                insert_state = {
                    add: false,
                    step: 0,
                    new_chat_flag: '',
                    youtube_link: '',
                    youtube_name: '',
                    chat_channel_id: '',
                }
            }
        }

        if(message.content === '!추가' ){ // !추가 /c/징버거 징버거 Y #징버거
            insert_state.add = true;
            insert_state.step = 0;
            message.reply(insert_messages[0] as string);
        }


        if(delete_stat.add){
            switch(delete_stat.step){
                case 0:
                    if(filter_name(message)){
                        delete_stat.youtube_name = message.content;
                        const check_chat_channel = await prisma.channel.findMany({
                            select: {
                                youtube_id: true,
                            },
                            where: {
                                youtube_name: delete_stat.youtube_name,
                            }
                        })
                        if(check_chat_channel.length === 0){
                        message.reply('없는 채널을 입력하였거나 틀렸습니다. 다시 입력해주세요');
                        delete_stat.step--;
                        }
                    }
                    break;
                case 1:
                    if(filter_check(message)){
                        delete_stat.delete_flag = message.content;

                        if(delete_stat.delete_flag === 'Y'){
                            const select_chat_channel = prisma.channel.findMany({
                                select: { d_channel_id : true },
                                where: { youtube_name : delete_stat.youtube_name },
                            })
                            let delete_channel = (await select_chat_channel!).map((elemnet) => {
                                return elemnet.d_channel_id ?? ' ';   
                            });
                            if(!(delete_channel[0] === '951349146487513128')){
                                delete_channel[0] = delete_channel[0].replace(CHANNELREGEX, '');
                                const channel = await client.channels.fetch(delete_channel[0]) as TextChannel;
                                channel.delete();
                                message.reply(delete_stat.youtube_name + '채널이 삭제되었습니다.' + HELPCHECK);
                            }

                            await prisma.channel.delete({
                                where: {
                                    youtube_name: delete_stat.youtube_name,
                                },
                            })
                        }else{
                            message.reply('채널 삭제를 중지합니다.');
                            delete_stat = {
                                add: false,
                                step: 0,
                                youtube_name: '',
                                delete_flag: '',
                            }
                            break;
                        }
                    }else{
                        message.reply('잘못입력하였습니다. 다시 입력하시오');
                        delete_stat.step--;
                    }
                    break;
            }

            delete_stat.step++;

            if(delete_stat.step === 1){
                message.reply(delete_stat.youtube_name + ' 채널을 정말 삭제하시겠습니까? 맞으면 "Y" 틀리면 "N" 입력');  
            }else{
                message.reply(delete_messages[delete_stat.step]);
            }

            if(delete_stat.step === 2){
                delete_stat = {
                    add: false,
                    step: 0,
                    youtube_name: '',
                    delete_flag: '',
                }
            }
        }

        if(message.content === '!삭제'){
            delete_stat.add = true;
            delete_stat.step = 0;
            message.reply(delete_messages[0] as string);
        }

        if(message.content == '!목록'){
            let tempid = '';
            let tempname = '';
            let tempchannel = '';

            const selectchannel = await prisma.channel.findMany({
                select: { 
                    d_channel_id: true,
                    youtube_id: true,
                    youtube_name:true,
                },
            });
            
            const list_youtube_id = selectchannel!.flatMap((elemnet) => {
                return elemnet.youtube_id ?? ' ' ;
            });
            const list_youtube_name = selectchannel!.flatMap((elemnet) => {
                return elemnet.youtube_name ?? ' ';
            });
            const list_channel_id = selectchannel!.flatMap((elemnet) => {
                return elemnet.d_channel_id ?? ' ';
            });

            tempid = list_youtube_id.join('\n');
            tempname = list_youtube_name.join('\n');
            tempchannel = list_channel_id.join('\n');

            const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('채널 목록')
                    .addFields(
                        { name: '채널 ID', value: tempid, inline: true},
                        { name: '채널 이름', value: tempname, inline: true },
                        { name: '출력 채널', value: tempchannel, inline: true },
                    )
                    .setTimestamp();
            message.reply({ embeds: [embed] });
        }

        // if(command[0] == '!채팅채널변경'){
        //     await prisma.channel.update({
        //         where: { youtube_name : command[1] },
        //         data: { d_channel_id : command[2] },
        //     });
        //     message.reply('채팅채널이 변경되었습니다.' + HELPCHECK);
        // }

        // if(command[0] == '!도움말'){
        //     const embed = new MessageEmbed()
        //             .setColor('#448CCB')
        //             .setTitle('도움말')
        //             .addFields(
        //                 { name: '명령어 목록', value: HELPTITLE },
        //                 { name: '!!! 필수사항 !!!', value: HELPRULE, inline: true},
        //                 { name: '채널ID가져오는 방법', value: HELPVALUE },
        //                 { name: '!추가 명령어 사용법',  value: HELPINSERT },
        //                 { name: '!삭제 명령어 사용법', value: HELPDELETE },
        //                 { name: '!목록 명령어 사용법', value: HELPLIST },
        //                 { name: '!채팅채널변경 명령어 사용법', value: HELPUPDATECHAT },
        //             );
        //     message.reply({ embeds: [embed] });
        // }
});

client.login(process.env.BOT_TOKEN);