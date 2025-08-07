# 本地数据库设置指南

## 概述
本项目已配置为使用本地PostgreSQL数据库。数据库配置已从远程数据库改为本地Docker容器。

## 环境变量配置
项目根目录下的 `.env` 文件包含以下配置：
```
DATABASE_URL="postgresql://root:Xingfu168@localhost:5432/llamacoder"
TOGETHER_API_KEY=
HELICONE_API_KEY=
```

## 启动本地数据库

### 方法1：使用Docker Compose（推荐）
```bash
# 启动数据库
npm run db:start

# 停止数据库
npm run db:stop

# 重置数据库（删除所有数据）
npm run db:reset
```

### 方法2：手动启动
```bash
docker-compose up -d
```

## 数据库迁移
首次设置或更新数据库结构时，需要运行迁移：
```bash
npm run db:migrate
```

## 生成Prisma客户端
如果修改了数据库模型，需要重新生成客户端：
```bash
npm run db:generate
```

## 查看数据库
使用Prisma Studio查看和管理数据库：
```bash
npm run db:studio
```
执行完在浏览器中打开地址：
http://localhost:5555

## 数据库连接信息
- **主机**: localhost
- **端口**: 5432
- **数据库名**: llamacoder
- **用户名**: root
- **密码**: Xingfu168

## 注意事项
1. 确保Docker已安装并运行
2. 首次启动可能需要几分钟来下载PostgreSQL镜像
3. 数据库数据会持久化保存在Docker卷中
4. 如果遇到连接问题，请检查Docker容器是否正常运行 