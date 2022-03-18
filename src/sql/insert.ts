import { PrismaClient } from "@prisma/client";
import { create_channel_type } from "../command/insert_channel";

const prisma = new PrismaClient();
export const create_channel = ( data: create_channel_type ) => {
        return prisma.channel.create({ data });
};