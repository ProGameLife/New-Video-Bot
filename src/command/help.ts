import { Message, MessageEmbed } from "discord.js";

const HELPTITLE = '!추가 , !삭제, !목록, !취소,!채팅채널변경';
const HELPVALUE = '1. 가져오고 싶은 youtube채널 접속\n' +
                  '2. 해당 채널의 주소창 확인 ( https://www.youtube.com/channel/UCs6EwgxKLY9GG4QNUrP5hoQ )\n' +
                  '3. 주소의 /channel 부터 끝가지 복사\n4. 종종 채널 대신에 /c로 시작하는 것도 있으니 같은 방법으로 복사';
const HELPCANCLE = '!취소 명령어는 자신이 실행중이던 명령어를 취소하는 명령어 입니다.\n명령어 사용중 잘못입력한거 같으면 !취소 입력시 취소 됩니다.';
const HELPINSERT = '!추가 명령어는 자신이 디스코드에서 새영상을 보고 싶은 채널을 추가 시키는 명령어 입니다.'; 
const HELPDELETE = '!삭제 명령어는 새영상을 더이상 보고싶지 않을 경우 채널을 삭제 시킬 수 있는 명령어 입니다.';
const HELPLIST = '!목록 입력 시 현재 추가되어있는 채널 목록 확인 가능합니다!';
//const HELPUPDATECHAT = '!채팅채널변경은 특정 유튜브 영상의 링크가 보이는 채팅채널을 변경하는 명령어 입니다.';

export const help_guide = (message: Message<boolean>) => {
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
                //{ name: '!채팅채널변경 명령어 사용법', value: HELPUPDATECHAT },
            );
    message.reply({ embeds: [embed] });
}