import "dotenv/config";
import { Client, Intents, Message } from "discord.js";
import { view_list_command } from "./command/view_list";
import { get_all_channel } from "./sql/select";
import { insert_channel_status } from "./command/insert_channel";
import { delete_channel_name } from "./command/delete_channel";
import { make_link } from "./link_send"
import { help_guide } from "./command/help"
import puppeteer from "puppeteer";
import cron from "node-cron";

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_MESSAGE_TYPING, 
        Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
    ],
});

const CHANNELREGEX = /[^0-9]/g;
const TEXTREGEX = /^[ㄱ-ㅎ|가-힣|ㅏ-ㅢ|a-z|A-Z|0-9|]+/;
const LINKREGEX = /\/(channel|user|c)\/[a-zA-z0-9-_ㄱ-ㅎ가-힣\s]+/;

client.on('ready', async () => {
    console.log('키리 봇 on');
    cron.schedule('*/2 * * * *', async () => {
        let browser;
        let page;
        try{
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            page = await browser.newPage();

            const channel_table = await get_all_channel();

            const d_channel_id = channel_table!.map((elemnet) => {
                return elemnet.d_channel_id ?? ' ';
            });
            const youtube_channel_id = channel_table!.map((elemnet) => {
                return elemnet.youtube_id ?? ' ';
            });

            //링크 만들어서 뿌려줌
            await make_link(client, d_channel_id, youtube_channel_id, CHANNELREGEX, page);
        }catch(e){
            console.log(e);
        }finally{
            if(page) await page.close();
            if(browser) await browser.close();
        }
    });
});

client.on('message', async (message) => {
        if(message.channel.type == 'DM' || message.author.bot) return

        const is_same_user = (m: Message) => m.author.id == message.author.id;
        const is_yn = (m: Message) => m.author.id == message.author.id && 
                                            (m.content.startsWith('Y') || m.content.startsWith('N'));
        const discord_server_id = message.guildId ?? ' ';

        if(message.content == '!목록'){
            await view_list_command(message);
        }
        if(message.content == '!도움말' || message.content == '!명령어'){
            help_guide(message);
        }
        //!추가
        insert_channel_status(message, discord_server_id, is_yn, is_same_user, TEXTREGEX, LINKREGEX);
        //!삭제
        delete_channel_name(is_same_user, is_yn, message, CHANNELREGEX, client, TEXTREGEX);
});

client.login(process.env.BOT_TOKEN);