// Edge Function: Payment Callback
// POST /payment-callback
// Handles payment gateway callbacks (ECPay/NewebPay)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, corsHeaders } from '../_shared/supabase.ts'
import { validateECPayCallback } from '../_shared/ecpay.ts'

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders() })
    }

    try {
        const callbackData = await req.json()

        console.log('Payment callback received:', callbackData)

        const supabase = createServiceClient()

        // 1. Validate callback (ECPay example)
        if (callbackData.payment_method === 'ecpay') {
            const isValid = validateECPayCallback(callbackData)
            if (!isValid) {
                console.error('Invalid ECPay callback signature')
                return new Response(
                    JSON.stringify({ success: false, error: '無效的回呼簽章' }),
                    {
                        status: 400,
                        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
                    }
                )
            }
        }

        // 2. Find order by order number
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id')
            .eq('order_number', callbackData.MerchantTradeNo || callbackData.order_number)
            .single()

        if (orderError || !order) {
            console.error('Order not found:', orderError)
            return new Response(
                JSON.stringify({ success: false, error: '訂單不存在' }),
                {
                    status: 404,
                    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
                }
            )
        }

        // 3. Determine payment status
        let paymentStatus = 'failed'
        if (callbackData.RtnCode === '1' || callbackData.status === 'success') {
            paymentStatus = 'success'
        }

        // 4. Update payment record
        const { error: paymentUpdateError } = await supabase
            .from('payments')
            .update({
                status: paymentStatus,
                transaction_id: callbackData.TradeNo || callbackData.transaction_id,
                response_data: callbackData,
                paid_at: paymentStatus === 'success' ? new Date().toISOString() : null
            })
            .eq('order_id', order.id)

        if (paymentUpdateError) {
            console.error('Payment update failed:', paymentUpdateError)
            throw paymentUpdateError
        }

        // 5. Update order status if payment successful
        if (paymentStatus === 'success') {
            await supabase
                .from('orders')
                .update({ status: 'confirmed' })
                .eq('id', order.id)

            // 6. Create confirmation notification
            await supabase
                .from('notifications')
                .insert({
                    order_id: order.id,
                    type: 'order_confirmed',
                    title: '✅ 訂單已確認',
                    message: '您的訂單已確認，餐點準備中...'
                })
        }

        // ECPay expects "1|OK" response
        return new Response(
            paymentStatus === 'success' ? '1|OK' : '0|FAIL',
            {
                status: 200,
                headers: { ...corsHeaders(), 'Content-Type': 'text/plain' }
            }
        )

    } catch (error) {
        console.error('Unexpected error:', error)
        return new Response(
            '0|ERROR',
            {
                status: 500,
                headers: { ...corsHeaders(), 'Content-Type': 'text/plain' }
            }
        )
    }
})
