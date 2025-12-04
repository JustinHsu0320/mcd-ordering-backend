// Edge Function: Create Payment
// POST /create-payment
// Generates payment URL for ECPay or NewebPay

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, corsHeaders } from '../_shared/supabase.ts'
import { generateECPayURL } from '../_shared/ecpay.ts'

interface CreatePaymentRequest {
    order_id: string
    payment_method: 'ecpay' | 'newebpay'
    return_url: string
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders() })
    }

    try {
        const { order_id, payment_method, return_url }: CreatePaymentRequest = await req.json()

        if (!order_id || !payment_method || !return_url) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: '缺少必要參數：order_id, payment_method 或 return_url'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
                }
            )
        }

        const supabase = createServiceClient()

        // 1. Get order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', order_id)
            .single()

        if (orderError || !order) {
            return new Response(
                JSON.stringify({ success: false, error: '訂單不存在' }),
                {
                    status: 404,
                    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
                }
            )
        }

        // 2. Create payment record
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                order_id: order_id,
                payment_method: payment_method,
                amount: order.total_amount,
                status: 'pending'
            })
            .select()
            .single()

        if (paymentError) {
            console.error('Payment creation failed:', paymentError)
            throw paymentError
        }

        // 3. Generate payment URL
        let paymentURL = ''

        if (payment_method === 'ecpay') {
            paymentURL = generateECPayURL(
                order.order_number,
                parseFloat(order.total_amount),
                return_url
            )
        } else if (payment_method === 'newebpay') {
            // TODO: Implement NewebPay integration
            paymentURL = 'https://newebpay.com/...' // Placeholder
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    payment_id: payment.id,
                    payment_url: paymentURL,
                    order_number: order.order_number,
                    amount: order.total_amount
                }
            }),
            {
                status: 200,
                headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Unexpected error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || '伺服器錯誤'
            }),
            {
                status: 500,
                headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
            }
        )
    }
})
