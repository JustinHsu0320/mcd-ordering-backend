-- Migration: Setup Storage Buckets
-- Created: 2025-12-04
-- Description: Create storage buckets and policies for images

-- Create product-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create qr-codes bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Public can view product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Storage Policy: Authenticated users can upload product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
);

-- Storage Policy: Authenticated users can update product images
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
);

-- Storage Policy: Authenticated users can delete product images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
);

-- Storage Policy: Public can view QR codes
CREATE POLICY "Public can view qr codes"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-codes');

-- Storage Policy: Authenticated users can upload QR codes
CREATE POLICY "Authenticated users can upload qr codes"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'qr-codes' AND
    auth.role() = 'authenticated'
);
