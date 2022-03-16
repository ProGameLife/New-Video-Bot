import { Client, Message, TextChannel } from "discord.js"
import { prisma, Prisma, PrismaClient } from "@prisma/client";
import { select_dchat, select_yname } from "../sql/select"
import { delete_channel_sql } from "../sql/delete"

export const delete_channel_name = async (
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>,
    filter_name: (m: Message) => boolean,
    filter_check: (m: Message) => boolean,
    message: Message<boolean>,
    delete_stat: {
        add: boolean,
        step: number,
        youtube_name: string,
        delete_flag: string,
    },
    CHANNELREGEX: RegExp,
    client: Client<boolean>,
    TEXTREGEX: RegExp,
    ) => {
    const delete_messages = [
        '⬇⬇⬇⬇⬇삭제할 유튜브의 채널 이름을 입력하시오⬇⬇⬇⬇⬇',
        '채널이 삭제되었습니다.\n!목록 명령어로 확인하십시오',
        ' ',
    ]
    switch(delete_stat.step){
        case 0:
            if(filter_name(message)){
                delete_stat.youtube_name = message.content;
                const check_chat_channel = await select_yname(prisma, delete_stat.youtube_name);
                
                if(check_chat_channel.length === 0 && TEXTREGEX.test(delete_stat.youtube_name)){
                    message.reply('없는 채널을 입력하였거나 틀렸습니다. 다시 입력해주세요');
                    delete_stat.step--;
                }
            }
            break;
        case 1:
            if(filter_check(message)){
                let delete_channel_check: string = '';

                delete_stat.delete_flag = message.content;
    
                if(delete_stat.delete_flag === 'Y'){
                    const select_chat_channel = await select_yname(prisma, delete_stat.youtube_name);

                    let delete_channel = (select_chat_channel!).map((element) => {
                        return element.d_channel_id ?? ' ';   
                    });
                    
                    delete_channel[0] = delete_channel[0].replace(CHANNELREGEX, '');
                    delete_channel_check = '<#' + delete_channel[0] + '>';

                     let count_delete_channel = (await select_dchat(prisma, delete_channel_check)).map((element) => {
                         return element.d_channel_id ?? ' ';
                     })
                    if(count_delete_channel.length === 1){
                        const channel = await client.channels.fetch(delete_channel[0]) as TextChannel;
                        channel.delete();
                    }
                    await delete_channel_sql(prisma, delete_stat.youtube_name);
                }else{
                    message.reply('채널 삭제를 중지합니다.');
                    delete_stat.step++;
                }
            }else if(!(filter_check(message))){
                message.reply('잘못입력하였습니다. 다시 입력하시오');
                delete_stat.step--;
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