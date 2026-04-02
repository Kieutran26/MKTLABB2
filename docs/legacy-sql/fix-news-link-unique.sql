-- Fix news_articles table để hỗ trợ upsert
-- Chạy trong Supabase SQL Editor

-- Thêm UNIQUE constraint cho cột link (nếu chưa có)
ALTER TABLE public.news_articles 
ADD CONSTRAINT news_articles_link_unique UNIQUE (link);

-- Nếu bị lỗi do đã có constraint, bỏ qua
