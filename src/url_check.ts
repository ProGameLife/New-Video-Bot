import axios from "axios";
import { Message } from "discord.js";

export const urlcheck = async (message: string) => {
    try{
        const youtube_link = await axios.get('https://www.youtube.com' + message);
        console.log(youtube_link);
    }catch(e){
        console.log(e);
    }
}