-- Migration: Create RLS Policies
-- Created: 2025-12-04
-- Description: Row Level Security policies for data access control

-- ============================================
-- 1. PUBLIC READ ACCESS (Menu Data)
-- ============================================

-- Categories: Public can view active categories
CREATE POLICY "Public can view active categories"
ON categories FOR SELECT
USING (active = true);

-- Products: Public can view available products
CREATE POLICY "Public can view available products"
ON products FOR SELECT
USING (available = true);

-- Product Modifiers: Public can view modifiers
CREATE POLICY "Public can view modifiers"
ON product_modifiers FOR SELECT
USING (true);

-- ============================================
-- 2. SESSION MANAGEMENT
-- ============================================

-- Sessions: Anyone can create sessions
CREATE POLICY "Anyone can create sessions"
ON sessions FOR INSERT
WITH CHECK (true);

-- Sessions: Users can view own sessions
CREATE POLICY "Users can view own sessions"
ON sessions FOR SELECT
USING (
    session_token = current_setting('request.headers', true)::json->>'x-session-id'
);

-- ============================================
-- 3. ORDER MANAGEMENT
-- ============================================

-- Orders: Users with valid session can create orders
CREATE POLICY "Users with valid session can create orders"
ON orders FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = orders.session_id 
        AND sessions.status = 'active'
        AND sessions.expires_at > NOW()
    )
);

-- Orders: Users can view own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (
    session_id IN (
        SELECT id FROM sessions 
        WHERE session_token = current_setting('request.headers', true)::json->>'x-session-id'
    )
);

-- Orders: Authenticated users (admin) can update orders
CREATE POLICY "Authenticated users can update orders"
ON orders FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 4. ORDER ITEMS
-- ============================================

-- Order Items: Users can view items from own orders
CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
USING (
    order_id IN (
        SELECT orders.id FROM orders
        JOIN sessions ON orders.session_id = sessions.id
        WHERE sessions.session_token = current_setting('request.headers', true)::json->>'x-session-id'
    )
);

-- Order Items: Can insert items for own orders
CREATE POLICY "Users can create order items"
ON order_items FOR INSERT
WITH CHECK (
    order_id IN (
        SELECT orders.id FROM orders
        JOIN sessions ON orders.session_id = sessions.id
        WHERE sessions.status = 'active'
        AND sessions.expires_at > NOW()
    )
);

-- ============================================
-- 5. PAYMENTS
-- ============================================

-- Payments: Users can view own payments
CREATE POLICY "Users can view own payments"
ON payments FOR SELECT
USING (
    order_id IN (
        SELECT orders.id FROM orders
        JOIN sessions ON orders.session_id = sessions.id
        WHERE sessions.session_token = current_setting('request.headers', true)::json->>'x-session-id'
    )
);

-- ============================================
-- 6. NOTIFICATIONS
-- ============================================

-- Notifications: Users can view notifications for own orders
CREATE POLICY "Users can view own order notifications"
ON notifications FOR SELECT
USING (
    order_id IN (
        SELECT orders.id FROM orders
        JOIN sessions ON orders.session_id = sessions.id
        WHERE sessions.session_token = current_setting('request.headers', true)::json->>'x-session-id'
    )
);

-- Notifications: Users can mark own notifications as read
CREATE POLICY "Users can mark own notifications as read"
ON notifications FOR UPDATE
USING (
    order_id IN (
        SELECT orders.id FROM orders
        JOIN sessions ON orders.session_id = sessions.id
        WHERE sessions.session_token = current_setting('request.headers', true)::json->>'x-session-id'
    )
)
WITH CHECK (true);
