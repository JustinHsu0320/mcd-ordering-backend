# 部署指南 - Supabase 後端

本文件提供完整的部署流程，包含本地開發與生產環境部署。

## 📋 目錄

1. [本地開發環境設定](#本地開發環境設定)
2. [Supabase 專案設定](#supabase-專案設定)
3. [手動部署到生產環境](#手動部署到生產環境)
4. [自動化部署 (GitHub Actions)](#自動化部署-github-actions)
5. [故障排除](#故障排除)

---

## 本地開發環境設定

### 1. 安裝必要工具

```bash
# 安裝 Node.js (18+)
# 從 https://nodejs.org/ 下載安裝

# 安裝 Supabase CLI
npm install -g supabase

# 驗證安裝
supabase --version
```

### 2. 初始化本地環境

```bash
# 進入專案目錄
cd mcd-ordering-backend

# 啟動本地 Supabase (Docker 需先安裝)
supabase start
```

首次啟動會下載 Docker 映像，大約需要 5-10 分鐘。

啟動完成後會顯示：
```
API URL: http://localhost:54321
Studio URL: http://localhost:54323
Anon key: eyJhbG...
Service role key: eyJhbG...
```

### 3. 執行資料庫遷移

```bash
# 重置資料庫並執行所有 migrations
supabase db reset

# 或僅推送新的 migrations
supabase db push
```

### 4. 測試 Edge Functions

```bash
# 測試單一函式
supabase functions serve create-session --env-file .env

# 在另一個終端測試
curl -X POST http://localhost:54321/functions/v1/create-session \
  -H "Content-Type: application/json" \
  -d '{"table_id":"A01","qr_token":"QR_A01_xxx"}'
```

### 5. 查看本地資料庫

訪問 Supabase Studio: http://localhost:54323

---

## Supabase 專案設定

### 1. 建立 Supabase 專案

1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 點擊 "New Project"
3. 填寫專案資訊：
   - **Name**: mcd-ordering-backend
   - **Database Password**: [設定強密碼]
   - **Region**: Southeast Asia (Singapore)
4. 等待專案建立完成 (約 2 分鐘)

### 2. 取得專案設定

在專案設定頁面記下以下資訊：

- **Project URL**: https://xxxxx.supabase.co
- **Anon Key**: eyJhbG...
- **Service Role Key**: eyJhbG... (保密!)
- **Project Reference ID**: xxxxx

### 3. 設定環境變數

建立 `.env` 檔案：

```bash
cp .env.example .env
```

填入您的設定：

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
SUPABASE_PROJECT_REF=xxxxx
SUPABASE_ACCESS_TOKEN=[從 Supabase Dashboard > Account > Access Tokens 生成]

# ECPay 測試環境
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
ECPAY_STAGING_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
```

---

## 手動部署到生產環境

### 1. 連結到雲端專案

```bash
# 使用 Project Reference ID
supabase link --project-ref xxxxx

# 輸入您的 Database Password
```

### 2. 推送資料庫遷移

```bash
# 推送所有 migrations 到生產環境
supabase db push
```

> ⚠️ **警告**: 這會修改生產環境資料庫！請先在測試環境驗證。

### 3. 部署 Edge Functions

```bash
# 部署所有函式
supabase functions deploy create-session --no-verify-jwt
supabase functions deploy create-order --no-verify-jwt
supabase functions deploy create-payment --no-verify-jwt
supabase functions deploy payment-callback --no-verify-jwt
```

`--no-verify-jwt` 允許匿名用戶訪問這些函式。

### 4. 設定 Edge Function 環境變數

```bash
# 設定金流相關環境變數
supabase secrets set ECPAY_MERCHANT_ID=your-merchant-id
supabase secrets set ECPAY_HASH_KEY=your-hash-key
supabase secrets set ECPAY_HASH_IV=your-hash-iv
supabase secrets set ECPAY_STAGING_URL=https://payment-stage.ecpay.com.tw/...
supabase secrets set ECPAY_PRODUCTION_URL=https://payment.ecpay.com.tw/...
```

### 5. 啟用 Realtime

在 Supabase Dashboard:
1. 前往 **Database** > **Replication**
2. 勾選以下資料表啟用 Realtime:
   - `orders`
   - `notifications`
3. 儲存變更

### 6. 驗證部署

```bash
# 測試 Edge Function
curl -X POST https://xxxxx.supabase.co/functions/v1/create-session \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"table_id":"A01","qr_token":"QR_A01_xxx"}'
```

---

## 自動化部署 (GitHub Actions)

### 1. 設定 GitHub Secrets

在 GitHub Repository > Settings > Secrets and variables > Actions 新增：

| Secret Name | 說明 |
|------------|------|
| `SUPABASE_ACCESS_TOKEN` | Supabase Access Token |
| `SUPABASE_PROJECT_REF` | Project Reference ID |
| `ECPAY_MERCHANT_ID` | 綠界商店代號 |
| `ECPAY_HASH_KEY` | 綠界 Hash Key |
| `ECPAY_HASH_IV` | 綠界 Hash IV |
| `ECPAY_STAGING_URL` | 綠界測試環境 URL |
| `ECPAY_PRODUCTION_URL` | 綠界正式環境 URL |

### 2. 觸發自動部署

```bash
# 推送到 main 分支自動觸發部署
git add .
git commit -m "Deploy to production"
git push origin main
```

### 3. 查看部署狀態

前往 GitHub Repository > Actions 查看工作流程執行狀態。

---

## 故障排除

### 問題 1: Supabase CLI 連線失敗

**錯誤訊息**: `Failed to connect to database`

**解決方案**:
```bash
# 檢查 Docker 是否運行
docker ps

# 重啟 Supabase
supabase stop
supabase start
```

### 問題 2: Migration 執行失敗

**錯誤訊息**: `relation "xxx" already exists`

**解決方案**:
```bash
# 完全重置本地資料庫
supabase db reset

# 或手動刪除有問題的 migration
```

### 問題 3: Edge Function 部署失敗

**錯誤訊息**: `Function deployment failed`

**解決方案**:
```bash
# 檢查函式語法
deno check supabase/functions/create-session/index.ts

# 查看詳細錯誤
supabase functions deploy create-session --debug
```

### 問題 4: RLS 政策阻擋請求

**錯誤訊息**: `permission denied for table xxx`

**解決方案**:
1. 檢查是否正確傳遞 `x-session-id` header
2. 在 Supabase Studio 檢查 RLS 政策是否正確
3. 使用 Service Role Key 進行除錯 (僅開發環境)

### 問題 5: Realtime 訂閱沒有收到更新

**解決方案**:
1. 確認已在 Dashboard 啟用 Realtime Replication
2. 檢查訂閱的 filter 是否正確
3. 查看瀏覽器 Console 是否有錯誤訊息

---

## 🔍 監控與日誌

### Supabase Dashboard

- **Logs** > **Function Logs**: 查看 Edge Function 執行日誌
- **Logs** > **Database Logs**: 查看資料庫查詢日誌
- **Logs** > **API Logs**: 查看 API 請求日誌

### 本地除錯

```bash
# 查看 Edge Function 即時日誌
supabase functions serve create-session --debug
```

---

## 📞 支援

如有問題，請聯繫：
- **開發團隊**: PTC 統智科技
- **Email**: support@ptc.com
- **文件**: [backend_spec.md](../backend_spec.md)

---

**下一步**: 查看 [README.md](./README.md) 了解 API 使用方式
