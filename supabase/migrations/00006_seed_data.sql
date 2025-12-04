-- Migration: Seed Data
-- Created: 2025-12-04
-- Description: Initial test data for development

-- ============================================
-- 1. CATEGORIES
-- ============================================
INSERT INTO categories (name, description, image_url, sort_order, active) VALUES
('漢堡', '經典美味漢堡系列', 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=漢堡', 1, true),
('飲料', '清涼飲品系列', 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=飲料', 2, true),
('副餐', '薯條、點心系列', 'https://via.placeholder.com/300x200/FFE66D/FFFFFF?text=副餐', 3, true),
('甜點', '甜蜜時光甜點', 'https://via.placeholder.com/300x200/95E1D3/FFFFFF?text=甜點', 4, true);

-- ============================================
-- 2. PRODUCTS
-- ============================================

-- Burgers
INSERT INTO products (category_id, name, description, price, image_url, available) VALUES
((SELECT id FROM categories WHERE name = '漢堡' LIMIT 1), 
 '大麥克', '經典雙層牛肉堡', 109.00, 
 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=大麥克', true),
((SELECT id FROM categories WHERE name = '漢堡' LIMIT 1), 
 '勁辣雞腿堡', '香辣多汁雞腿堡', 89.00, 
 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=勁辣雞腿堡', true),
((SELECT id FROM categories WHERE name = '漢堡' LIMIT 1), 
 '四盎司牛肉堡', '厚實美味牛肉堡', 79.00, 
 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=四盎司牛肉堡', true);

-- Drinks
INSERT INTO products (category_id, name, description, price, image_url, available) VALUES
((SELECT id FROM categories WHERE name = '飲料' LIMIT 1), 
 '可口可樂', '經典可樂', 30.00, 
 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=可樂', true),
((SELECT id FROM categories WHERE name = '飲料' LIMIT 1), 
 '雪碧', '清爽雪碧', 30.00, 
 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=雪碧', true),
((SELECT id FROM categories WHERE name = '飲料' LIMIT 1), 
 '冰紅茶', '冰涼紅茶', 30.00, 
 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=紅茶', true);

-- Sides
INSERT INTO products (category_id, name, description, price, image_url, available) VALUES
((SELECT id FROM categories WHERE name = '副餐' LIMIT 1), 
 '薯條', '金黃酥脆薯條', 39.00, 
 'https://via.placeholder.com/400x300/FFE66D/FFFFFF?text=薯條', true),
((SELECT id FROM categories WHERE name = '副餐' LIMIT 1), 
 '麥克雞塊', '6塊雞塊', 59.00, 
 'https://via.placeholder.com/400x300/FFE66D/FFFFFF?text=雞塊', true);

-- Desserts
INSERT INTO products (category_id, name, description, price, image_url, available) VALUES
((SELECT id FROM categories WHERE name = '甜點' LIMIT 1), 
 '冰炫風', '奧利奧冰炫風', 49.00, 
 'https://via.placeholder.com/400x300/95E1D3/FFFFFF?text=冰炫風', true),
((SELECT id FROM categories WHERE name = '甜點' LIMIT 1), 
 '蘋果派', '酥脆蘋果派', 29.00, 
 'https://via.placeholder.com/400x300/95E1D3/FFFFFF?text=蘋果派', true);

-- ============================================
-- 3. PRODUCT MODIFIERS
-- ============================================

-- Add modifiers for Big Mac
INSERT INTO product_modifiers (product_id, name, price, required) VALUES
((SELECT id FROM products WHERE name = '大麥克' LIMIT 1), '加培根', 15.00, false),
((SELECT id FROM products WHERE name = '大麥克' LIMIT 1), '加起司', 10.00, false),
((SELECT id FROM products WHERE name = '大麥克' LIMIT 1), '去洋蔥', 0.00, false);

-- Add modifiers for Spicy Chicken
INSERT INTO product_modifiers (product_id, name, price, required) VALUES
((SELECT id FROM products WHERE name = '勁辣雞腿堡' LIMIT 1), '加辣', 0.00, false),
((SELECT id FROM products WHERE name = '勁辣雞腿堡' LIMIT 1), '加起司', 10.00, false);

-- ============================================
-- 4. TABLES
-- ============================================
INSERT INTO tables (id, name, qr_token, active) VALUES
('A01', 'A區-01桌', 'QR_A01_' || gen_random_uuid()::text, true),
('A02', 'A區-02桌', 'QR_A02_' || gen_random_uuid()::text, true),
('A03', 'A區-03桌', 'QR_A03_' || gen_random_uuid()::text, true),
('B01', 'B區-01桌', 'QR_B01_' || gen_random_uuid()::text, true),
('B02', 'B區-02桌', 'QR_B02_' || gen_random_uuid()::text, true);

-- ============================================
-- NOTES
-- ============================================
-- To create a test order, you'll need to:
-- 1. Create a session via the create-session Edge Function
-- 2. Use that session to create an order via the create-order Edge Function
-- 3. Process payment via the create-payment Edge Function
