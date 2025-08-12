import { NextRequest, NextResponse } from 'next/server';
import OSS from 'ali-oss';

const client = new OSS({
  // 填写Bucket所在地域
  region: process.env.OSS_REGION || 'oss-cn-beijing',
  // 从环境变量中获取访问凭证
  accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
  // 填写Bucket名称
  bucket: process.env.OSS_BUCKET || 'llamacoder-artifacts',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '没有找到文件' },
        { status: 400 }
      );
    }

    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;

    // 将文件转换为Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 自定义请求头
    const headers = {
      'x-oss-storage-class': 'Standard',
      'x-oss-object-acl': 'private', // 设置为私有访问权限
      'Content-Type': file.type,
    };

    // 上传到OSS
    const result = await client.put(fileName, buffer, { headers });

    // 生成签名URL，有效期1小时
    const signedUrl = client.signatureUrl(fileName, {
      expires: 3600, // 1小时
      method: 'GET'
    });

    // 返回上传结果
    return NextResponse.json({
      success: true,
      url: signedUrl,
      name: fileName,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error('OSS上传错误:', error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
}
