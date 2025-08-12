# 阿里云OSS配置说明

本项目已从S3上传改为阿里云OSS上传。请按照以下步骤配置OSS：

## 1. 创建阿里云OSS Bucket

1. 登录阿里云控制台
2. 进入OSS服务
3. 创建一个新的Bucket，建议命名为 `llamacoder-artifacts`
4. 选择合适的地域（如：华北2-北京）
5. 设置Bucket权限为私有（推荐，更安全）

## 2. 创建AccessKey

1. 在阿里云控制台右上角点击头像
2. 选择"AccessKey管理"
3. 创建AccessKey（建议创建RAM用户的AccessKey，而不是主账号）
4. 记录AccessKey ID和AccessKey Secret

## 3. 配置环境变量

复制 `.example.env` 文件为 `.env.local`，并填入以下配置：

```env
# 阿里云OSS配置
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_REGION=oss-cn-beijing
OSS_BUCKET=llamacoder-artifacts
```

## 4. 安装依赖

```bash
npm install
```

## 5. 测试上传

启动开发服务器：

```bash
npm run dev
```

访问应用并测试文件上传功能。

## 注意事项

- 确保OSS Bucket的权限设置正确
- AccessKey具有足够的权限进行文件上传
- 建议使用RAM用户的AccessKey而不是主账号AccessKey
- 文件设置为私有访问，上传后会返回签名URL（有效期1小时）
- 签名URL可以安全地访问私有文件，无需公开文件 