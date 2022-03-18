import { Message, MessageEmbed } from "discord.js";
import { get_all_channel } from "../sql/select"

export const view_list_command = async ( message: Message<boolean> ) => { 
    let tempid = '';
    let tempname = '';
    let tempchannel = '';

    const selectchannel = await get_all_channel();

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
};