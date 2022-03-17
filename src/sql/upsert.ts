import { Prisma, PrismaClient } from "@prisma/client";

export const upsert_watch_url = (
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>,
    youtube_channel_id: string,
    temparr: string[],
    fullurl: string[] ) => {
        return prisma.url.upsert({
            create: { channel_id : youtube_channel_id, watch_id : fullurl },
            update: { watch_id : temparr },
            where: { channel_id : youtube_channel_id },
            select: null,
        });
};