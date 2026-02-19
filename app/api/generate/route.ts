// app/api/generate/route.ts
import { NextResponse } from "next/server";
import prisma from '@/lib/db'; 

// 🛠️ 新增工具函数：把前端传来的 Base64 转换为可以上传的文件格式 (Blob)
function base64ToBlob(base64: string) {
  const parts = base64.split(';base64,');
  const mimeType = parts[0].split(':')[1];
  const raw = Buffer.from(parts[1], 'base64');
  return new Blob([raw], { type: mimeType });
}

export async function POST(req: Request) {
  try {
    const { tokenKey, imageBase64, userPrompt, gender, age } = await req.json();

    if (!tokenKey || !imageBase64) {
      return NextResponse.json({ error: "Token和图片不能为空" }, { status: 400 });
    }

    const userToken = await prisma.token.findUnique({ where: { tokenKey } });
    if (!userToken) {
      return NextResponse.json({ error: "无效的 Token" }, { status: 401 });
    }
    if (userToken.quota <= 0) {
      return NextResponse.json({ error: "Token 余额不足，请充值" }, { status: 403 });
    }

    // ==========================================
    // 🌟 接口配置区
    // ==========================================
    const API_URL = "https://api.tu-zi.com/v1/images/edits"; // ⚠️ 请填入你最新获取的接口地址
    const API_TOKEN = "sk-SZ7rdzvlu6IxUkL2twL8cpF5IpEsWhep4uV7Wsv38zi9vYfu"; 

    // System Prompt (因为现在不是聊天模型了，指令可以更直接)
    const systemPrompt = "High fashion editorial photography, professional supermodel wearing the exact clothing item provided. Keep the clothing details strictly unchanged. Professional studio lighting, 8k resolution, photorealistic.";
    
    let dynamicTraits = "";
    if (gender || age) {
        dynamicTraits = " Model characteristics: ";
        if (age) dynamicTraits += `${age} `;
        if (gender) dynamicTraits += `${gender}`;
        dynamicTraits += ".";
    }

    let finalPrompt = `${systemPrompt}${dynamicTraits}`;
    if (userPrompt) {
        finalPrompt += ` ${userPrompt}`;
    }

    // ==========================================
    // 📦 使用 FormData 构造新的请求体
    // ==========================================
    const formData = new FormData();
    // 1. 填入模型名称
    formData.append("model", "gemini-3-pro-image-preview"); 
    // 2. 填入提示词
    formData.append("prompt", finalPrompt);
    // 3. 填入要求返回的格式 (直接要 url！)
    formData.append("response_format", "url");
    // 4. 将 Base64 还原成图片文件塞进去
    const imageBlob = base64ToBlob(imageBase64);
    formData.append("image", imageBlob, "upload.png");

    // 打印请求日志
    const requestTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Tokyo' });
    console.log("\n==========================================");
    console.log(`🕒 [${requestTime}] 🚀 发起新的生图请求`);
    console.log(`🔑 消费 Token : ${tokenKey}`);
    console.log(`🤖 使用模型   : gemini-3-pro-image-preview`);
    console.log(`📝 最终 Prompt: \n   ${finalPrompt}`);
    console.log("==========================================\n");

    const startTime = Date.now();

    // 发送真实网络请求 (⚠️ 注意：使用 FormData 时，绝不能手动设置 Content-Type，fetch会自动处理)
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`
      },
      body: formData
    });

    const aiData = await response.json();

    if (!response.ok) {
        console.error("❌ AI 接口返回错误:", aiData);
        return NextResponse.json({ error: aiData.error?.message || "AI 生成失败，请检查接口配置" }, { status: 500 });
    }

    // ==========================================
    // 🎯 提取返回的 URL (这种原生图片接口的标准返回格式)
    // ==========================================
    let generatedImageUrl = "";
    if (aiData.data && aiData.data[0] && aiData.data[0].url) {
        generatedImageUrl = aiData.data[0].url;
    } else {
        console.error("❌ 未知的数据返回格式:", aiData);
        return NextResponse.json({ error: "未提取到图片URL" }, { status: 500 });
    }

    const endTime = Date.now();
    const durationInSeconds = ((endTime - startTime) / 1000).toFixed(1);

    console.log(`✅ [${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Tokyo' })}] 🎉 图片生成成功!`);
    console.log(`⏱️  API 耗时   : ${durationInSeconds} 秒`);
    console.log(`🔗 图片链接   : ${generatedImageUrl}\n`);

    // 扣除余额并存入数据库
    await prisma.token.update({
      where: { tokenKey },
      data: { quota: userToken.quota - 1 }
    });

    await prisma.image.create({
      data: { url: generatedImageUrl, prompt: finalPrompt, tokenId: userToken.id }
    });

    return NextResponse.json({ 
      success: true, 
      imageUrl: generatedImageUrl, 
      remainingQuota: userToken.quota - 1 
    });

  } catch (error) {
    console.error("❌ 系统内部错误:", error);
    return NextResponse.json({ error: "服务器开小差了" }, { status: 500 });
  }
}