# 🚀 Hướng Dẫn Deploy Lên Render.com (MIỄN PHÍ)

## Tại Sao Chọn Render?

- ✅ **Miễn phí** cho hobby projects
- ✅ **Dễ dàng** - chỉ cần kết nối GitHub
- ✅ **Tự động deploy** khi push code
- ✅ **Hỗ trợ PostgreSQL** và Redis miễn phí
- ✅ **SSL/HTTPS** tự động
- ✅ **Không cần credit card** cho free tier

---

## Bước 1: Chuẩn Bị Code

### 1.1. Tạo file `render.yaml`

```yaml
# render.yaml
services:
  # Web Service (API)
  - type: web
    name: chat-api
    env: node
    region: singapore
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: API_PREFIX
        value: api
      - key: DB_HOST
        fromDatabase:
          name: chat-db
          property: host
      - key: DB_PORT
        fromDatabase:
          name: chat-db
          property: port
      - key: DB_USERNAME
        fromDatabase:
          name: chat-db
          property: user
      - key: DB_PASSWORD
        fromDatabase:
          name: chat-db
          property: password
      - key: DB_DATABASE
        fromDatabase:
          name: chat-db
          property: database
      - key: REDIS_HOST
        fromService:
          name: chat-redis
          type: redis
          property: host
      - key: REDIS_PORT
        fromService:
          name: chat-redis
          type: redis
          property: port
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 15m
      - key: JWT_REFRESH_EXPIRES_IN
        value: 7d

databases:
  # PostgreSQL Database
  - name: chat-db
    databaseName: chat_api
    user: chat_user
    plan: free
    region: singapore

  # Redis
  - name: chat-redis
    plan: free
    region: singapore
```

### 1.2. Cập nhật `package.json`

Thêm script `start:prod`:

```json
{
  "scripts": {
    "start:prod": "node dist/main"
  }
}
```

### 1.3. Commit và Push

```bash
git add render.yaml
git commit -m "Add Render deployment config"
git push origin main
```

---

## Bước 2: Đăng Ký Render.com

### 2.1. Truy cập Render
1. Vào https://render.com
2. Click **"Get Started for Free"**
3. Đăng nhập bằng **GitHub account**

### 2.2. Authorize GitHub
- Cho phép Render truy cập GitHub repositories của bạn
- Chọn repository **Real-Time-Chat-API**

---

## Bước 3: Deploy Từ Dashboard

### 3.1. Tạo New Web Service

1. Click **"New +"** → **"Blueprint"**
2. Chọn repository: **Real-Time-Chat-API**
3. Render sẽ tự động phát hiện file `render.yaml`
4. Click **"Apply"**

### 3.2. Hoặc Deploy Thủ Công

Nếu không dùng Blueprint:

#### A. Tạo PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Name: `chat-db`
3. Database: `chat_api`
4. Region: Singapore
5. Plan: **Free**
6. Click **"Create Database"**

#### B. Tạo Redis
1. Click **"New +"** → **"Redis"**
2. Name: `chat-redis`
3. Region: Singapore
4. Plan: **Free**
5. Click **"Create Redis"**

#### C. Tạo Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect repository: **Real-Time-Chat-API**
3. Name: `chat-api`
4. Region: Singapore
5. Branch: `main`
6. Root Directory: `realtime-chat-api`
7. Environment: **Node**
8. Build Command: `npm install && npm run build`
9. Start Command: `npm run start:prod`
10. Plan: **Free**

#### D. Thêm Environment Variables
Trong Web Service settings, thêm:

```
NODE_ENV=production
PORT=3000
API_PREFIX=api

# Database (copy từ PostgreSQL dashboard)
DB_HOST=<your-db-host>
DB_PORT=5432
DB_USERNAME=<your-db-user>
DB_PASSWORD=<your-db-password>
DB_DATABASE=chat_api

# Redis (copy từ Redis dashboard)
REDIS_HOST=<your-redis-host>
REDIS_PORT=6379

# JWT (generate random strings)
JWT_SECRET=<generate-random-32-chars>
JWT_REFRESH_SECRET=<generate-random-32-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Frontend (update sau khi có URL)
FRONTEND_URL=https://your-frontend-url.com
```

11. Click **"Create Web Service"**

---

## Bước 4: Đợi Deploy

### 4.1. Build Process
- Render sẽ tự động:
  1. Clone repository
  2. Install dependencies
  3. Build TypeScript
  4. Start application

### 4.2. Theo Dõi Logs
- Xem logs trong dashboard
- Đợi message: "Application is running on..."

### 4.3. Thời Gian
- First deploy: 5-10 phút
- Subsequent deploys: 2-5 phút

---

## Bước 5: Truy Cập API

### 5.1. URL
Render sẽ cung cấp URL dạng:
```
https://chat-api-xxxx.onrender.com
```

### 5.2. Test Endpoints
```bash
# Health check
curl https://chat-api-xxxx.onrender.com/health

# Swagger docs
https://chat-api-xxxx.onrender.com/api/docs

# API base
https://chat-api-xxxx.onrender.com/api
```

---

## Bước 6: Cấu Hình Tự Động Deploy

### 6.1. Auto Deploy
Render tự động deploy khi bạn push code:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Render sẽ tự động deploy!
```

### 6.2. Deploy Hooks
Có thể trigger deploy thủ công:
1. Vào Web Service dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## Bước 7: Database Migrations

### 7.1. Chạy Migrations
Sau khi deploy lần đầu:

1. Vào Web Service dashboard
2. Click **"Shell"** tab
3. Chạy commands:

```bash
npm run migration:run
```

### 7.2. Hoặc Dùng Render Shell
```bash
# Connect to shell
render shell chat-api

# Run migrations
npm run migration:run
```

---

## Lưu Ý Quan Trọng

### ⚠️ Free Tier Limitations

1. **Sleep Mode**
   - Service sẽ sleep sau 15 phút không hoạt động
   - Wake up khi có request (mất ~30 giây)
   - Giải pháp: Dùng cron job để ping mỗi 10 phút

2. **Database**
   - PostgreSQL: 1GB storage
   - Redis: 25MB memory
   - Tự động xóa sau 90 ngày không dùng

3. **Build Minutes**
   - 500 build minutes/tháng
   - Đủ cho ~100 deploys

### 💡 Tips

1. **Keep Alive Service**
   Tạo cron job ping API mỗi 10 phút:
   ```bash
   # Dùng cron-job.org hoặc UptimeRobot
   GET https://chat-api-xxxx.onrender.com/health
   ```

2. **Monitor Logs**
   - Xem logs thường xuyên
   - Set up alerts cho errors

3. **Backup Database**
   - Export database định kỳ
   - Render có auto backup (paid plans)

---

## Troubleshooting

### Lỗi: Build Failed
```bash
# Check logs
# Thường do:
- Missing dependencies
- TypeScript errors
- Wrong build command
```

**Fix:**
```bash
# Local test
npm run build
npm run start:prod
```

### Lỗi: Database Connection
```bash
# Check environment variables
# Verify DB_HOST, DB_PORT, etc.
```

**Fix:**
- Copy lại connection string từ PostgreSQL dashboard
- Update environment variables

### Lỗi: Application Crashed
```bash
# Check logs for errors
# Common issues:
- Missing environment variables
- Database not ready
- Port conflicts
```

**Fix:**
- Verify all env vars
- Check database status
- Review logs

---

## Alternative: Deploy Lên Railway.app

Nếu Render không hoạt động, thử Railway:

### Railway.app (Cũng Miễn Phí)

1. Vào https://railway.app
2. Sign in với GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Chọn **Real-Time-Chat-API**
6. Railway tự động:
   - Detect Node.js
   - Install dependencies
   - Build và deploy

### Thêm Database
1. Click **"New"** → **"Database"** → **"PostgreSQL"**
2. Click **"New"** → **"Database"** → **"Redis"**
3. Railway tự động inject env vars

### Deploy
- Tự động deploy khi push code
- URL: `https://your-app.up.railway.app`

---

## Alternative: Deploy Lên Heroku

### Heroku (Có Free Tier)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-chat-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis
heroku addons:create heroku-redis:hobby-dev

# Set env vars
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main

# Run migrations
heroku run npm run migration:run

# Open app
heroku open
```

---

## Kết Luận

Bạn đã có **3 options miễn phí** để deploy:

1. ⭐ **Render.com** (Recommended)
   - Dễ nhất
   - Free tier tốt
   - Auto SSL

2. 🚂 **Railway.app**
   - Rất đơn giản
   - Auto detect
   - Good free tier

3. 🟣 **Heroku**
   - Phổ biến nhất
   - Nhiều addons
   - CLI mạnh mẽ

**Khuyến nghị**: Bắt đầu với **Render.com** vì dễ nhất!

---

**🎉 Chúc bạn deploy thành công!**

Sau khi deploy xong, bạn sẽ có:
- ✅ API public trên internet
- ✅ HTTPS tự động
- ✅ Auto deploy khi push code
- ✅ Database và Redis cloud
- ✅ Monitoring và logs

**URL của bạn**: `https://your-app.onrender.com/api/docs`