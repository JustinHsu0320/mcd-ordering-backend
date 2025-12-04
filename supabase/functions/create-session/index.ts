// Edge Function: Create Session
// POST /create-session
// Creates a new session when user scans QR code

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, corsHeaders } from '../_shared/supabase.ts'

interface CreateSessionRequest {
    table_id: string
    qr_token: string
}

interface CreateSessionResponse {
    success: boolean
    data?: {
        session_id: string
        session_token: string
        table_id: string
        table_name: string
        expires_at: string
    }
    error?: string
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders() })
    }

    try {
        const { table_id, qr_token }: CreateSessionRequest = await req.json()

        if (!table_id || !qr_token) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: '缺少必要參數：table_id 或 qr_token'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
                }
            )
        }

        const supabase = createServiceClient()

        // 1. Verify QR Code and table
        const { data: table, error: tableError } = await supabase
            .from('tables')
            .select('*')
            .eq('id', table_id)
            .eq('qr_token', qr_token)
            .eq('active', true)
            .single()

        if (tableError || !table) {
            console.error('Table verification failed:', tableError)
            return new Response(
                JSON.stringify({
                    success: false,
                    error: '無效的 QR Code 或桌號'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
                }
            )
        }

        // 2. Create session
        const sessionToken = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours

        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert({
                session_token: sessionToken,
                table_id: table_id,
                status: 'active',
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single()

        if (sessionError) {
            console.error('Session creation failed:', sessionError)
            throw sessionError
        }

        const response: CreateSessionResponse = {
            success: true,
            data: {
                session_id: session.id,
                session_token: sessionToken,
                table_id: table.id,
                table_name: table.name,
                expires_at: expiresAt.toISOString()
            }
        }

        return new Response(
            JSON.stringify(response),
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
