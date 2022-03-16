import { Prisma, PrismaClient } from "@prisma/client";

export const delete_channel_sql = (prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>, yname: string) => {
    return prisma.channel.delete({
        where: { youtube_name: yname }
    })
};