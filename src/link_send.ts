import { Client, TextChannel } from "discord.js";
import { get_watch_id } from "./sql/select";
import { upsert_watch_url } from "./sql/upsert";
import puppeteer from "puppeteer";

const STARTLINK = 'https://www.youtube.com';

export const make_link = async (client: Client<boolean>, d_channel_id: string[], youtube_channel_id: string[], CHANNELREGEX: RegExp, page: puppeteer.Page) => {
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
        for(let i = 1; i < 11; i++){
            if(!hrefLink[i]) break;
            fullurl[i - 1] = STARTLINK + hrefLink[i];
        }
        
        //신규 채널인지 아닌지 확인 하고 추가 및 url을 보낸것인지 확인
        const urltable = await get_watch_id(youtube_channel_id[k]);
        
        let urltable_watch_id = urltable.flatMap((elemnet) => {
            return elemnet.watch_id
        });
        
        let temparr = [];
        for(let i = 0; i < fullurl.length; i++){
            fullurl[i] = fullurl[i].replace('shorts/','watch?v=');
            if(!(urltable_watch_id.includes(fullurl[i])) && i < 5){
                await channel.send(fullurl[i]);
            }
            temparr.push(fullurl[i]);
        }
        console.log(fullurl);
    
        await upsert_watch_url(youtube_channel_id[k], temparr, fullurl);
        //end
    }
};

