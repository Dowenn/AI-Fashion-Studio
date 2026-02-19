// app/api/history/route.ts
import { NextResponse } from "next/server";
import prisma from '@/lib/db'; 

export async function POST(req: Request) {
  try {
    const { tokenKey } = await req.json();

    if (!tokenKey) {
      return NextResponse.json({ error: "请提供 Token" }, { status: 400 });
    }

    // 在数据库中查找这个 Token，并“顺藤摸瓜”把关联的 images 按照时间倒序（最新的在前）一起拿出来
    const userToken = await prisma.token.findUnique({
      where: { tokenKey },
      include: {
        images: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!userToken) {
      return NextResponse.json({ error: "无效的 Token" }, { status: 401 });
    }

    // 返回历史图片数组和当前剩余额度
    return NextResponse.json({ 
      success: true, 
      history: userToken.images,
      remainingQuota: userToken.quota
    });

  } catch (error) {
    console.error("查询历史错误:", error);
    return NextResponse.json({ error: "服务器开小差了" }, { status: 500 });
  }
}