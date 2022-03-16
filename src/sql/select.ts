import { Prisma, PrismaClient } from "@prisma/client";

export const select_all = (
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined> ) => {
    return prisma.channel.findMany({
        select: { 
            d_channel_id: true,
            youtube_id: true,
            youtube_name:true,
        },
    });
};
export const select_yid = (
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
export const select_yname = (
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
export const select_dchat = (
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

export const select_watch_id = (prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>, youid: string) => {
    return prisma.url.findMany({
        select: {
            watch_id: true,
        },
        where: {
            channel_id: youid,
        },
    })
};