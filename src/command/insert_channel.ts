import { Message, MessageActionRow } from "discord.js";
import { prisma, Prisma, PrismaClient } from "@prisma/client";
import { select_yid } from "../sql/select";
import { create_channel } from "../sql/insert";
import { urlcheck } from "../url_check";

export type create_channel_type = {
    d_server_id: string,
    youtube_id: string,
    youtube_name: string, 
    d_channel_id: string,
};

const insert_messages = [
    '⬇⬇⬇⬇⬇추가할 유튜브의 채널 ID를 입력하시오⬇⬇⬇⬇⬇', 
    '⬇⬇⬇⬇⬇추가할 유튜브의 채널 이름을 입력하시오⬇⬇⬇⬇⬇',
    '기존 채팅채널에 새 영상을 올리고 싶으면 "Y" 입력!!\n새 채팅채널에 새 영상을 올리고 싶으면 "N" 입력!!',
    [
        '기존 채팅채널명을 입력해주세요!!  EX) #테스트',
        '새롭게 생성할 채팅채널명을 입력해주세요!! EX) 테스트'
    ],
    ' ',
    '채널이 추가되었습니다.\n!목록 명령어로 확인하십시오',
]

export const insert_channel_status = async(
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>,
    message: Message<boolean>,
    discord_server_id: string,
    filter_link: (m: Message) => boolean, 
    filter_check: (m: Message) => boolean, 
    filter_name: (m: Message) => boolean,
    TEXTREGEX: RegExp,
    LINKREGEX: RegExp,
    insert_state: {
        add: boolean;
        step: number;
        new_chat_flag: string;
        youtube_link: string;
        youtube_name: string;
        chat_channel_id: string;
    }) =>{
    if(insert_state.add){ 
        switch(insert_state.step){
            case 0:// 링크 물어보기
                if(filter_link(message) && LINKREGEX.test(message.content)){
                    insert_state.youtube_link = message.content;

                    await urlcheck(insert_state.youtube_link);

                    const check_youtube_id = await select_yid(prisma, insert_state.youtube_link);

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
                if(filter_name(message) && TEXTREGEX.test(message.content)){
                    insert_state.youtube_name = message.content;
                }else{
                    message.reply('조건에 맞지 않는 것을 입력하였습니다. 다시 입력 부탁드립니다.');
                    insert_state.step--;
                }
                break;
            case 2:// 채팅채널 기준 물어보기 Y는 기존 N은 새로 만듦
                if(filter_check(message) && TEXTREGEX.test(message.content)){
                    insert_state.new_chat_flag = message.content;
                }else{
                    message.reply('"Y" 또는 "N"을 입력해주세요');
                    insert_state.step--;
                }
                break;
            case 3:// 생성할 또는 기존 채팅채널 이름 물어보기
                if(
                filter_name(message) && (insert_state.new_chat_flag === 'Y' && message.content.startsWith('<#')) || 
                                        (insert_state.new_chat_flag === 'N' && TEXTREGEX.test(message.content))){
                    insert_state.chat_channel_id = message.content;
                }else{
                    message.reply('알맞는 채팅채널명을 입력해주세요 ^^');
                    insert_state.step--;
                }
                break;
            case 4:// 채팅채널을 새로 만들지 기존 채널을 사용 할지에 따른 분기
                if(filter_check(message) && message.content === 'Y'){ // 내용 확인 후 만든다는 뜻임
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

                }else if(filter_check(message) && message.content === 'N'){
                    message.reply('입력이 취소 되었습니다.');
                    insert_state.step++;
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
        }else if(insert_state.step < 6){
            message.reply(insert_messages[insert_state.step] as string); 
        }
        if(insert_state.step >= 5){ 
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
}