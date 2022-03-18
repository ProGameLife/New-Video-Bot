import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const delete_channel_sql = ( yname: string ) => {
    return prisma.channel.delete({
        where: { youtube_name: yname }
    })
};