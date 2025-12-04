// Edge Function: Create Order
// POST /create-order
// Creates a new order with items

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, corsHeaders } from '../_shared/supabase.ts'

interface OrderItem {
    product_id: string
    quantity: number
    modifiers?: Array<{
        id: string
        name: string
        price: number
    }>
}

interface CreateOrderRequest {
    items: OrderItem[]
    dining_option: 'dine-in' | 'takeout'
    note?: string
    discount_code?: string
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders() })
    }

    try {
        // Get session ID from header
        const sessionId = req.headers.get('x-session-id')
        if (!sessionId) {
            return new Response(
                JSON.stringify({ success: false, error: '未提供 Session ID' }),
                {
                    status: 401,
                    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
                }
            )
        }

        const { items, dining_option, note, discount_code }: CreateOrderRequest = await req.json()

        if (!items || items.length === 0) {
            return new Response(
                JSON.stringify({ success: false, error: '訂單至少要有一個商品' }),
                {
                    status: 400,
                    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
                }
            )
        }

        const supabase = createServiceClient()

        // 1. Validate session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('*')
            .eq('session_token', sessionId)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .single()

        if (sessionError || !session) {
            return new Response(
                JSON.stringify({ success: false, error: 'Session 無效或已過期' }),
                {
                    status: 401,
                    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
                }
            )
        }

        // 2. Calculate order amount
        let totalAmount = 0
        const orderItems = []

        for (const item of items) {
            const { data: product } = await supabase
                .from('products')
                .select('*')
                .eq('id', item.product_id)
                .single()

            if (!product || !product.available) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: `商品 ${product?.name || item.product_id} 已售罄或不存在`
                    }),
                    {
                        status: 400,
                        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
                    }
                )
            }

            const modifiersPrice = (item.modifiers || []).reduce(
                (sum, mod) => sum + mod.price,
                0
            )

            const subtotal = (parseFloat(product.price) + modifiersPrice) * item.quantity

            totalAmount += subtotal

            orderItems.push({
                product_id: product.id,
                product_name: product.name,
                unit_price: product.price,
                quantity: item.quantity,
                modifiers: item.modifiers || null,
                subtotal: subtotal
            })
        }

        // 3. Apply discount
        let discountAmount = 0
        if (discount_code === 'WELCOME10') {
            discountAmount = totalAmount * 0.1
        }

        const finalAmount = totalAmount - discountAmount

        // 4. Generate order number
        const orderNumber = `ORD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

        // 5. Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                order_number: orderNumber,
                session_id: session.id,
                table_id: session.table_id,
                status: 'pending',
                total_amount: finalAmount,
                discount_amount: discountAmount,
                discount_code: discount_code || null,
                dining_option: dining_option,
                note: note || null
            })
            .select()
            .single()

        if (orderError) {
            console.error('Order creation failed:', orderError)
            throw orderError
        }

        // 6. Create order items
        const orderItemsWithOrderId = orderItems.map(item => ({
            ...item,
            order_id: order.id
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsWithOrderId)

        if (itemsError) {
            console.error('Order items creation failed:', itemsError)
            throw itemsError
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    order_id: order.id,
                    order_number: order.order_number,
                    total_amount: finalAmount,
                    discount_amount: discountAmount,
                    status: order.status,
                    created_at: order.created_at
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
