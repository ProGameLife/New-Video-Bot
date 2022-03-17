import { Client, Message, TextChannel } from "discord.js"
import { Prisma, PrismaClient } from "@prisma/client";
import { get_dchat, get_yname } from "../sql/select"
import { delete_channel_sql } from "../sql/delete"
import { delete_messages, delete_reply_message } from "../message/message_format"

let delete_stat = {
    add: false,
    step: 0,
    youtube_name: '',
    delete_flag: '',
};

const reset_state = () => {
    delete_stat = {
        add: false,
        step: 0,
        youtube_name: '',
        delete_flag: '',
    };
};

export const delete_channel_name = async (
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>,
    filter_name: (m: Message) => boolean,
    filter_check: (m: Message) => boolean,
    message: Message<boolean>,
    CHANNELREGEX: RegExp,
    client: Client<boolean>,
    TEXTREGEX: RegExp,
    ) => {
    if(message.content === '!삭제'){
        delete_stat.add = true;
        delete_stat.step = 0;
        message.reply(delete_messages[delete_stat.step]);
    }

    if(!delete_stat.add){
        return;
    }

    if(message.content == '!취소'){
        await message.reply('!삭제 명령어가 취소됩니다.');
        reset_state();
        return;
    }
    
    switch(delete_stat.step){
        case 0:
            if(!filter_name(message)){
                
                delete_stat.youtube_name = message.content;
                const check_chat_channel = await get_yname(prisma, delete_stat.youtube_name);
                
                if(check_chat_channel.length === 0 && TEXTREGEX.test(delete_stat.youtube_name)){
                    message.reply(delete_reply_message[delete_stat.step] as string);
                    delete_stat.step--;
                }
            }
            break;
        case 1:
            if(!filter_check(message)){
                message.reply(delete_reply_message[delete_stat.step][1]);
                delete_stat.step--;
                break;
            }
            let delete_channel_check: string = '';

            delete_stat.delete_flag = message.content;

            if(delete_stat.delete_flag === 'Y'){
                const select_chat_channel = await get_yname(prisma, delete_stat.youtube_name);

                let delete_channel = (select_chat_channel!).map((element) => {
                    return element.d_channel_id ?? ' ';   
                });
                
                delete_channel[0] = delete_channel[0].replace(CHANNELREGEX, '');
                delete_channel_check = '<#' + delete_channel[0] + '>';

                    let count_delete_channel = (await get_dchat(prisma, delete_channel_check)).map((element) => {
                        return element.d_channel_id ?? ' ';
                    })
                if(count_delete_channel.length === 1){
                    const channel = await client.channels.fetch(delete_channel[0]) as TextChannel;
                    channel.delete();
                }
                await delete_channel_sql(prisma, delete_stat.youtube_name);
            }else{
                message.reply(delete_reply_message[delete_stat.step][0]);
                delete_stat.step++;
            }
            break;
    }

    if(delete_stat.step === 0){
        message.reply(delete_stat.youtube_name + ' 채널을 정말 삭제하시겠습니까? 맞으면 "Y" 틀리면 "N" 입력');  
    }else if(delete_stat.step === 1){
        message.reply(delete_messages[delete_stat.step]);
    }
    delete_stat.step++;

    if(delete_stat.step === 2){
        delete_stat = {
            add: false,
            step: 0,
            youtube_name: '',
            delete_flag: '',
        }
    }
}