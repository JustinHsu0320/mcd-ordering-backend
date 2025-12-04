// ECPay Integration Utility
// Used for generating payment URLs and validating callbacks

import { createHash } from 'https://deno.land/std@0.168.0/hash/mod.ts'

interface ECPayParams {
    MerchantID: string
    MerchantTradeNo: string
    MerchantTradeDate: string
    PaymentType: string
    TotalAmount: string
    TradeDesc: string
    ItemName: string
    ReturnURL: string
    ChoosePayment: string
    EncryptType: string
}

export function generateECPayURL(
    orderNumber: string,
    amount: number,
    returnURL: string
): string {
    const merchantId = Deno.env.get('ECPAY_MERCHANT_ID') ?? ''
    const hashKey = Deno.env.get('ECPAY_HASH_KEY') ?? ''
    const hashIV = Deno.env.get('ECPAY_HASH_IV') ?? ''
    const baseURL = Deno.env.get('NODE_ENV') === 'production'
        ? Deno.env.get('ECPAY_PRODUCTION_URL')
        : Deno.env.get('ECPAY_STAGING_URL')

    // Create trade date in format: yyyy/MM/dd HH:mm:ss
    const now = new Date()
    const tradeDate = now.toISOString()
        .replace('T', ' ')
        .substring(0, 19)
        .replace(/-/g, '/')

    const params: ECPayParams = {
        MerchantID: merchantId,
        MerchantTradeNo: orderNumber,
        MerchantTradeDate: tradeDate,
        PaymentType: 'aio',
        TotalAmount: Math.floor(amount).toString(),
        TradeDesc: '麥當勞點餐系統',
        ItemName: '餐點',
        ReturnURL: returnURL,
        ChoosePayment: 'ALL',
        EncryptType: '1'
    }

    // Generate CheckMacValue
    const checkMacValue = generateCheckMacValue(params, hashKey, hashIV)

    // Build query string
    const queryParams = new URLSearchParams({
        ...params,
        CheckMacValue: checkMacValue
    })

    return `${baseURL}?${queryParams.toString()}`
}

function generateCheckMacValue(
    params: ECPayParams,
    hashKey: string,
    hashIV: string
): string {
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key as keyof ECPayParams]}`)
        .join('&')

    // Add HashKey and HashIV
    const raw = `HashKey=${hashKey}&${sortedParams}&HashIV=${hashIV}`

    // URL encode
    const encoded = encodeURIComponent(raw)
        .toLowerCase()
        .replace(/%2d/g, '-')
        .replace(/%5f/g, '_')
        .replace(/%2e/g, '.')
        .replace(/%21/g, '!')
        .replace(/%2a/g, '*')
        .replace(/%28/g, '(')
        .replace(/%29/g, ')')

    // SHA256 hash and convert to uppercase
    const hash = createHash('sha256')
    hash.update(encoded)
    return hash.toString('hex').toUpperCase()
}

export function validateECPayCallback(
    data: Record<string, string>
): boolean {
    const hashKey = Deno.env.get('ECPAY_HASH_KEY') ?? ''
    const hashIV = Deno.env.get('ECPAY_HASH_IV') ?? ''

    const receivedCheckMac = data.CheckMacValue
    delete data.CheckMacValue

    const calculatedCheckMac = generateCheckMacValue(
        data as any,
        hashKey,
        hashIV
    )

    return receivedCheckMac === calculatedCheckMac
}
