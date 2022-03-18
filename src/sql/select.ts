import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const get_all_channel = () => {
    return prisma.channel.findMany({
        select: { 
            d_channel_id: true,
            youtube_id: true,
            youtube_name:true,
        },
    });
};
export const get_yid = ( yid: string ) => {
    return prisma.channel.findMany({
        select: { 
            d_channel_id: true,
            youtube_id: true,
            youtube_name:true,
        },
        where: {
            youtube_id: yid,
        },
    });
};
export const get_yname = ( yname: string ) => {
    return prisma.channel.findMany({
        select: { 
            d_channel_id: true,
            youtube_id: true,
            youtube_name:true,
        },
        where: {
            youtube_name: yname,
        },
    });
};
export const get_dchat = ( dchat: string ) => {
    return prisma.channel.findMany({
        select: { 
            d_channel_id: true,
            youtube_id: true,
            youtube_name:true,
        },
        where: {
            d_channel_id: dchat,
        },
    });
};

export const get_watch_id = ( youid: string ) => {
        return prisma.url.findMany({
            select: {
                watch_id: true,
            },
            where: {
                channel_id: youid,
            },
        })
};