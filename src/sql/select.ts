import { Prisma, PrismaClient } from "@prisma/client";

export const get_all_channel = (
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined> ) => {
    return prisma.channel.findMany({
        select: { 
            d_channel_id: true,
            youtube_id: true,
            youtube_name:true,
        },
    });
};
export const get_yid = (
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>, yid: string ) => {
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
export const get_yname = (
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>, yname: string ) => {
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
export const get_dchat = (
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>, dchat: string ) => {
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

export const get_watch_id = (prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>,
     youid: string) => {
        return prisma.url.findMany({
            select: {
                watch_id: true,
            },
            where: {
                channel_id: youid,
            },
        })
};