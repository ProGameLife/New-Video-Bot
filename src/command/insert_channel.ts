import { Message, MessageActionRow } from "discord.js";
import { prisma, Prisma, PrismaClient } from "@prisma/client";
import { get_yid } from "../sql/select";
import { create_channel } from "../sql/insert";
import { check_url } from "../url_check";
import { INSERT_MESSAGES, REPLY_MESSAGES} from "../message/message_format"

export type create_channel_type = {
    d_server_id: string,
    youtube_id: string,
    youtube_name: string, 
    d_channel_id: string,
};

let insert_state = {
    add: false,
    step: 0,
    new_chat_flag: '',
    youtube_link: '',
    youtube_name: '',
    chat_channel_id: '',
};

const reset_state = () => {
    insert_state = {
        add: false,
        step: 0,
        new_chat_flag: '',
        youtube_link: '',
        youtube_name: '',
        chat_channel_id: '',
    };
};

export const insert_channel_status = async(
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>,
    message: Message<boolean>,
    discord_server_id: string, 
    is_yn: (m: Message) => boolean, 
    is_same_user: (m: Message) => boolean,
    TEXTREGEX: RegExp,
    LINKREGEX: RegExp,
    ) => {
    if(message.content === '!추가' ){ 
        insert_state.add = true;
        insert_state.step = 0;
        await message.reply(INSERT_MESSAGES[insert_state.step] as string);
        return;
    }

    if(!insert_state.add){ 
        return;
    }

    if(message.content == '!취소'){
        insert_state = {
            add: false,
            step: 0,
            new_chat_flag: '',
            youtube_link: '',
            youtube_name: '',
            chat_channel_id: '',
        };
        await message.reply('!추가 명령어가 취소됩니다.');
        return;
    }

    
    switch(insert_state.step){
        case 0:// 링크 물어보기
            if(!is_same_user(message) || !LINKREGEX.test(message.content)){
                await message.reply(REPLY_MESSAGES[insert_state.step][0]);
                insert_state.step--;
            }

            insert_state.youtube_link = message.content;
            const youtube_id = await get_yid(prisma, insert_state.youtube_link);

            const page_status = await check_url(insert_state.youtube_link);

            if(youtube_id.length > 0 || page_status === 404){
                message.reply(REPLY_MESSAGES[insert_state.step][1]);
                reset_state();
                return;
            }
            break;
        case 1:// 이름 물어보기
            if(is_same_user(message) && TEXTREGEX.test(message.content)){
                insert_state.youtube_name = message.content.replaceAll(/ +/g, ' ');
            }else{
                await message.reply(REPLY_MESSAGES[insert_state.step] as string);
                insert_state.step--;
            }
            break;
        case 2:// 채팅채널 기준 물어보기 Y는 기존 N은 새로 만듦
            if(is_yn(message) && TEXTREGEX.test(message.content)){
                insert_state.new_chat_flag = message.content;
            }else{
                message.reply(REPLY_MESSAGES[insert_state.step] as string);
                insert_state.step--;
            }
            break;
        case 3:// 생성할 또는 기존 채팅채널 이름 물어보기
            if(
                is_same_user(message) && (insert_state.new_chat_flag === 'Y' && message.content.startsWith('<#')) || 
                                         (insert_state.new_chat_flag === 'N' && TEXTREGEX.test(message.content))){
                insert_state.chat_channel_id = message.content.replaceAll(/ +/g, ' ');
                insert_state.chat_channel_id = insert_state.chat_channel_id.replaceAll(' ', '-');
                console.log(insert_state.chat_channel_id);
            }else{
                message.reply(REPLY_MESSAGES[insert_state.step] as string);
                insert_state.step--;
            }
            break;
        case 4:// 채팅채널을 새로 만들지 기존 채널을 사용 할지에 따른 분기
            if(is_yn(message) && message.content === 'Y'){ // 내용 확인 후 만든다는 뜻임
                if(insert_state.new_chat_flag === 'N'){
                    const channel_create_result =  await message.guild?.channels.create(insert_state.chat_channel_id , { //여기에는 텍스트만 들어가야함 신규일 경우
                        type: "GUILD_TEXT",
                        permissionOverwrites: [{
                            id: message.guild?.roles.everyone,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
                        }],
                        parent: '948112373602988082',
                    });
                    insert_state.chat_channel_id = '<#' + channel_create_result?.id + '>';
                }

                const create_channel_format: create_channel_type = {
                    d_server_id: discord_server_id,
                    youtube_id: insert_state.youtube_link,
                    youtube_name: insert_state.youtube_name, 
                    d_channel_id: insert_state.chat_channel_id,
                };

                await create_channel(prisma, create_channel_format);

            }else if(is_yn(message) && message.content === 'N'){
                message.reply(REPLY_MESSAGES[insert_state.step] as string);
                insert_state.step++;
            }else{
                message.reply(REPLY_MESSAGES[2] as string);
                insert_state.step--;
            }    
            break;
    }
    
    insert_state.step++;
        
        
    if(insert_state.step === 3){
        message.reply(INSERT_MESSAGES[insert_state.step][insert_state.new_chat_flag === 'Y' ? 0 : 1]);
    }else if(insert_state.step === 4){
        message.reply('채널 ID : ' + insert_state.youtube_link + '\n채널 이름 :' + insert_state.youtube_name + 
                        '\n채팅채널이름 :' + insert_state.chat_channel_id + '\n입력한 값을 확인 해주시기 바랍니다. 맞으면 "Y" 틀리면 "N" 입력');
    }else if(insert_state.step < 6){
        message.reply(INSERT_MESSAGES[insert_state.step] as string); 
    }

    if(insert_state.step >= 5){ 
        reset_state();
    }
}