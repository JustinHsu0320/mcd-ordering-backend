# 麥當勞掃碼點餐系統 - Supabase 後端

基於 Supabase 的完全託管後端服務，實現麥當勞風格的免登入掃碼點餐系統。

## 🎯 功能特色

- ✅ **免登入掃碼點餐** - 掃描 QR Code 立即點餐
- ✅ **即時訂單通知** - Supabase Realtime 推播訂單狀態
- ✅ **完整金流整合** - 支援綠界 ECPay / 藍新 NewebPay
- ✅ **安全資料存取** - Row Level Security (RLS) 政策
- ✅ **自動化部署** - GitHub Actions CI/CD
- ✅ **Serverless 架構** - Edge Functions + PostgreSQL

## 🏗️ 技術架構

```
Supabase Backend
├── PostgreSQL Database (資料庫)
├── Edge Functions (Serverless 函式)
│   ├── create-session
│   ├── create-order
│   ├── create-payment
│   └── payment-callback
├── Realtime (即時訂閱)
├── Storage (檔案儲存)
└── Auth (認證服務)
```

## 📋 前置要求

- Node.js 18+
- Supabase CLI
- Supabase 帳號與專案

## 🚀 快速開始

### 1. 安裝 Supabase CLI

```bash
npm install -g supabase
```

### 2. 複製專案並設定環境變數

```bash
git clone <your-repo-url>
cd mcd-ordering-backend
cp .env.example .env
```

編輯 `.env` 填入您的 Supabase 與金流設定。

### 3. 本地開發

```bash
# 啟動本地 Supabase
npm run start

# 執行資料庫遷移
npm run reset

# 測試 Edge Functions
npm run serve:create-session
```

本地 Supabase 將在以下端口運行：
- API: http://localhost:54321
- Studio: http://localhost:54323
- DB: postgresql://localhost:54322

### 4. 部署到線上 Supabase

詳見 [DEPLOY.md](./DEPLOY.md)

## 📁 專案結構

```
mcd-ordering-backend/
├── supabase/
│   ├── migrations/              # 資料庫遷移檔案
│   │   ├── 00001_create_tables.sql
│   │   ├── 00002_create_triggers.sql
│   │   ├── 00003_enable_rls.sql
│   │   ├── 00004_rls_policies.sql
│   │   ├── 00005_storage_setup.sql
│   │   └── 00006_seed_data.sql
│   └── functions/               # Edge Functions
│       ├── create-session/
│       ├── create-order/
│       ├── create-payment/
│       ├── payment-callback/
│       └── _shared/
├── .github/workflows/           # CI/CD
└── README.md
```

## 🔌 API 端點

### 1. 建立 Session (掃描 QR Code)

```http
POST /create-session
Content-Type: application/json

{
  "table_id": "A01",
  "qr_token": "QR_A01_xxx"
}
```

### 2. 建立訂單

```http
POST /create-order
Content-Type: application/json
x-session-id: {session_token}

{
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "modifiers": [...]
    }
  ],
  "dining_option": "dine-in",
  "note": "不要洋蔥",
  "discount_code": "WELCOME10"
}
```

### 3. 建立支付

```http
POST /create-payment
Content-Type: application/json

{
  "order_id": "uuid",
  "payment_method": "ecpay",
  "return_url": "https://your-site.com/payment-return"
}
```

### 4. 金流回呼 (由金流商呼叫)

```http
POST /payment-callback
Content-Type: application/json

{
  "MerchantTradeNo": "ORD20231204XXXX",
  "RtnCode": "1",
  ...
}
```

## 📊 資料庫 Schema

主要資料表：
- `categories` - 商品分類
- `products` - 商品
- `product_modifiers` - 加購選項
- `tables` - 桌號
- `sessions` - 用戶會話
- `orders` - 訂單
- `order_items` - 訂單明細
- `payments` - 支付記錄
- `notifications` - 通知

完整 ER Diagram 請參考 [backend_spec.md](../backend_spec.md)

## 🔐 安全性

- ✅ Row Level Security (RLS) 啟用於所有資料表
- ✅ Session-based 資料存取控制
- ✅ HTTPS/TLS 加密傳輸
- ✅ SQL Injection 防護
- ✅ API Rate Limiting

## 🔔 即時通知

使用 Supabase Realtime 訂閱：

```typescript
// 訂閱訂單狀態變更
supabase
  .channel('order-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${orderId}`
  }, (payload) => {
    console.log('訂單狀態更新:', payload.new.status)
  })
  .subscribe()
```

## 🧪 測試資料

執行 migration 後會自動建立測試資料：
- 4 個商品分類
- 10+ 個商品
- 5 個桌號 (A01-A03, B01-B02)

## 📝 License

MIT

## 👥 開發團隊

PTC 統智科技 - 流通解決方案部

---

**快速連結**
- [部署指南](./DEPLOY.md)
- [後端規格書](../backend_spec.md)
- [Supabase 官方文件](https://supabase.com/docs)
