-- Manual migration for performance indexes
-- Run this SQL directly on your database for better text search performance
-- These indexes will significantly speed up ILIKE/contains queries

-- Enable pg_trgm extension for text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for case-insensitive text search on product titles
-- This will speed up: title contains 'query' mode: insensitive
CREATE INDEX IF NOT EXISTS "products_title_gin_idx" ON "products" USING gin (LOWER("title") gin_trgm_ops);

-- GIN index for case-insensitive text search on category names
CREATE INDEX IF NOT EXISTS "categories_name_gin_idx" ON "categories" USING gin (LOWER("name") gin_trgm_ops);

-- GIN index for case-insensitive text search on subcategory names
CREATE INDEX IF NOT EXISTS "sub_categories_name_gin_idx" ON "sub_categories" USING gin (LOWER("name") gin_trgm_ops);

-- Composite GIN index for product title search with created_at sorting
CREATE INDEX IF NOT EXISTS "products_title_created_gin_idx" ON "products" USING gin (LOWER("title") gin_trgm_ops, "created_at");

-- Note: After running this migration, you may need to run ANALYZE to update statistics
-- ANALYZE products;
-- ANALYZE categories;
-- ANALYZE sub_categories;

