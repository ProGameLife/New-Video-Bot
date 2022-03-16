import { prisma, Prisma, PrismaClient } from "@prisma/client";
import { create_channel_type } from "../command/insert_channel";

export const create_channel = (
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>,
    data: create_channel_type) => {
        return prisma.channel.create({ data });
};