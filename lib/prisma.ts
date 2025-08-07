import { PrismaClient } from "@prisma/client";
import { cache } from "react";

export const getPrisma = cache(() => {
  return new PrismaClient(); // 直接使用标准配置
});
