-- Migration: Create triggers and database functions
-- Created: 2025-12-04
-- Description: Auto-update triggers and order notification functions

-- Function: Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update categories.updated_at
CREATE TRIGGER update_categories_updated_at 
BEFORE UPDATE ON categories
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update products.updated_at
CREATE TRIGGER update_products_updated_at 
BEFORE UPDATE ON products
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update orders.updated_at
CREATE TRIGGER update_orders_updated_at 
BEFORE UPDATE ON orders
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Function: Notify order ready
CREATE OR REPLACE FUNCTION notify_order_ready()
RETURNS TRIGGER AS $$
BEGIN
    -- When order status changes to 'ready', create notification
    IF NEW.status = 'ready' AND OLD.status != 'ready' THEN
        INSERT INTO notifications (order_id, type, title, message)
        VALUES (
            NEW.id,
            'order_ready',
            '🔔 餐點已完成！',
            '您的餐點已準備完成，請至櫃檯取餐！訂單編號：' || NEW.order_number
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create notification when order is ready
CREATE TRIGGER trigger_order_ready
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_ready();
