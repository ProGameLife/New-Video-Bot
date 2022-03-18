import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const upsert_watch_url = ( youtube_channel_id: string, temparr: string[], fullurl: string[] ) => {
        return prisma.url.upsert({
            create: { channel_id : youtube_channel_id, watch_id : fullurl },
            update: { watch_id : temparr },
            where: { channel_id : youtube_channel_id },
            select: null,
        });
};