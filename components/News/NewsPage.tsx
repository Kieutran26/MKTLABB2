import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { NewsCard, NewsArticle } from './NewsCard';
import { RefreshCw, Filter, Trash2, Calendar, X, Wifi, WifiOff, Download } from 'lucide-react';
import { useToast } from '../Toast';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const NewsPage: React.FC = () => {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [customDate, setCustomDate] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
    const [crawling, setCrawling] = useState(false);
    const [lastCrawlTime, setLastCrawlTime] = useState<string | null>(() => {
        try {
            return localStorage.getItem('optimkt_last_crawl_time');
        } catch {
            return null;
        }
    });

    const toast = useToast();

    // Memoized fetchNews to avoid recreation on every render
    const fetchNews = useCallback(async (showLoadingState = true) => {
        if (showLoadingState) setLoading(true);
        try {
            const { data, error } = await supabase
                .from('news_articles')
                .select('*')
                .order('pub_date', { ascending: false })
                .limit(500);

            if (data) {
                setArticles(data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Error fetching news:', err);
        } finally {
            if (showLoadingState) setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchNews();

        // Set up Supabase Realtime subscription for live updates
        const channel = supabase
            .channel('news_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'news_articles'
                },
                (payload) => {
                    console.log('📰 New article received:', payload.new);
                    // Add new article to the top of the list
                    setArticles(prev => {
                        // Avoid duplicates
                        if (prev.some(a => a.id === (payload.new as NewsArticle).id)) {
                            return prev;
                        }
                        return [payload.new as NewsArticle, ...prev];
                    });
                    setLastUpdated(new Date());
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'news_articles'
                },
                (payload) => {
                    console.log('🗑️ Article deleted:', payload.old);
                    setArticles(prev => prev.filter(a => a.id !== (payload.old as any).id));
                    setLastUpdated(new Date());
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
                setIsRealtimeConnected(status === 'SUBSCRIBED');
            });

        // Auto-refresh every 5 minutes as fallback
        const refreshInterval = setInterval(() => {
            fetchNews(false); // Silent refresh
        }, 5 * 60 * 1000);

        // Cleanup on unmount
        return () => {
            channel.unsubscribe();
            clearInterval(refreshInterval);
        };
    }, [fetchNews]);

    // Crawl new articles from RSS feeds
    const crawlNews = async () => {
        setCrawling(true);

        // Save current time as the threshold for "new" articles
        const crawlStartTime = new Date().toISOString();

        try {
            // Use local server in development, Netlify function in production
            const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiUrl = isDev
                ? 'http://localhost:3001/api/news/fetch'
                : '/.netlify/functions/news-fetch';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.success) {
                // Update the last crawl time AFTER successful crawl
                localStorage.setItem('optimkt_last_crawl_time', crawlStartTime);
                setLastCrawlTime(crawlStartTime);

                toast.success('Thu thập thành công', data.message);
                fetchNews();
            } else {
                toast.error('Lỗi', data.error);
            }
        } catch (err) {
            toast.error('Lỗi kết nối', 'Không thể thu thập tin. Vui lòng thử lại sau.');
            console.error('Crawl error:', err);
        } finally {
            setCrawling(false);
        }
    };

    // Check if an article is "new" (created within last 1 hour OR after last crawl)
    const isArticleNew = (article: NewsArticle): boolean => {
        const articleCreatedAt = (article as any).created_at;
        if (!articleCreatedAt) return false;

        const articleTime = new Date(articleCreatedAt).getTime();
        const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour in ms

        // Article is "new" if created within last hour
        if (articleTime > oneHourAgo) return true;

        // Or if created after last crawl time
        if (lastCrawlTime) {
            return articleTime > new Date(lastCrawlTime).getTime();
        }

        return false;
    };

    // Delete articles before a specific date
    const deleteArticlesBefore = async (beforeDate: Date) => {
        setDeleting(true);
        try {
            const { error, count } = await supabase
                .from('news_articles')
                .delete({ count: 'exact' })
                .lt('pub_date', beforeDate.toISOString());

            if (error) {
                toast.error('Lỗi', error.message);
            } else {
                toast.success('Xóa thành công', `Đã xóa ${count || 0} bài viết`);
                fetchNews();
            }
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // Delete articles from a specific date range
    const deleteArticlesOnDate = async (date: Date) => {
        setDeleting(true);
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

        try {
            const { error, count } = await supabase
                .from('news_articles')
                .delete({ count: 'exact' })
                .gte('pub_date', startOfDay.toISOString())
                .lte('pub_date', endOfDay.toISOString());

            if (error) {
                toast.error('Lỗi', error.message);
            } else {
                toast.success('Xóa thành công', `Đã xóa ${count || 0} bài viết ngày ${date.toLocaleDateString('vi-VN')}`);
                fetchNews();
            }
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleDeleteYesterday = async () => {
        const confirmed = await toast.showConfirm({
            title: 'Xóa bài viết hôm qua',
            message: 'Bạn có chắc muốn xóa tất cả bài viết của ngày hôm qua?',
            confirmText: 'Xóa',
            type: 'warning'
        });
        if (!confirmed) return;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        deleteArticlesOnDate(yesterday);
    };

    const handleDeleteLastWeek = async () => {
        const confirmed = await toast.showConfirm({
            title: 'Xóa bài viết tuần trước',
            message: 'Bạn có chắc muốn xóa tất cả bài viết cũ hơn 7 ngày?',
            confirmText: 'Xóa',
            type: 'warning'
        });
        if (!confirmed) return;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        deleteArticlesBefore(oneWeekAgo);
    };

    const handleDeleteCustomDate = async () => {
        if (!customDate) {
            toast.warning('Chưa chọn ngày', 'Vui lòng chọn ngày cần xóa');
            return;
        }
        const selectedDate = new Date(customDate);
        const confirmed = await toast.showConfirm({
            title: 'Xóa bài viết',
            message: `Bạn có chắc muốn xóa tất cả bài viết ngày ${selectedDate.toLocaleDateString('vi-VN')}?`,
            confirmText: 'Xóa',
            type: 'warning'
        });
        if (!confirmed) return;
        deleteArticlesOnDate(selectedDate);
    };

    const handleDeleteAll = async () => {
        const confirmed = await toast.showConfirm({
            title: 'Xóa tất cả bài viết',
            message: 'Hành động này không thể hoàn tác! Bạn có chắc chắn muốn xóa TẤT CẢ bài viết?',
            confirmText: 'Xóa tất cả',
            type: 'danger'
        });
        if (!confirmed) return;

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('news_articles')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');

            if (error) {
                toast.error('Lỗi', error.message);
            } else {
                toast.success('Hoàn tất', 'Đã xóa tất cả bài viết');
                fetchNews();
            }
        } catch (err) {
            console.error('Delete all error:', err);
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const categories = ['All', 'Finance', 'Marketing', 'Tech', 'Lifestyle'];
    const [dateFilter, setDateFilter] = useState<'all' | 'new' | 'today' | 'yesterday' | 'custom'>('all');
    const [filterDate, setFilterDate] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all');

    // Get unique sources from articles
    const uniqueSources = [...new Set(articles.map(a => a.source))].sort();

    // Helper functions for date filtering
    const isToday = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isYesterday = (dateStr: string) => {
        const date = new Date(dateStr);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.toDateString() === yesterday.toDateString();
    };

    const isOnDate = (dateStr: string, targetDate: string) => {
        const date = new Date(dateStr);
        const target = new Date(targetDate);
        return date.toDateString() === target.toDateString();
    };

    // Combined filter logic
    const filteredArticles = articles.filter(article => {
        // Category filter
        if (filter !== 'All' && article.category !== filter) return false;

        // Source filter
        if (sourceFilter !== 'all' && article.source !== sourceFilter) return false;

        // Date filter
        switch (dateFilter) {
            case 'new':
                if (!isArticleNew(article)) return false;
                break;
            case 'today':
                if (!isToday(article.pub_date)) return false;
                break;
            case 'yesterday':
                if (!isYesterday(article.pub_date)) return false;
                break;
            case 'custom':
                if (filterDate && !isOnDate(article.pub_date, filterDate)) return false;
                break;
        }

        return true;
    });

    const getCategoryCount = (cat: string) => {
        if (cat === 'All') return articles.length;
        return articles.filter(a => a.category === cat).length;
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            {/* ── Standardized Header ────────────────────────────────────────── */}
            <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 lg:flex-row lg:items-start lg:justify-between md:px-8">
                <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                        <RefreshCw size={20} strokeWidth={1.25} className={`shrink-0 ${loading ? 'animate-spin' : ''}`} aria-hidden />
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                            News Intelligence
                        </span>
                    </div>
                    <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                        Tin Tức Tổng Hợp
                    </h1>
                    <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                        Cập nhật tin tức mới nhất về Tài chính, Marketing & Công nghệ hàng ngày.
                    </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3 pt-2">
                     {/* Realtime Status Overlay */}
                     <div className="flex items-center gap-2">
                        {isRealtimeConnected ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                <Wifi size={10} />
                                <span>Realtime</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-500 rounded-full text-[10px] font-medium uppercase">
                                <WifiOff size={10} />
                                <span>Kết nối...</span>
                            </div>
                        )}
                        {lastUpdated && (
                            <span className="text-[10px] text-stone-400 font-medium">
                                Last seen {lastUpdated.toLocaleTimeString('vi-VN')}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchNews()}
                            className="rounded-full border border-stone-200 bg-white p-2.5 text-stone-500 shadow-sm transition-all hover:bg-stone-50 hover:text-stone-900"
                        >
                            <RefreshCw size={18} strokeWidth={1.5} className={loading ? 'animate-spin' : ''} />
                        </button>
                        
                        <button
                            onClick={crawlNews}
                            disabled={crawling}
                            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:opacity-50"
                        >
                            <Download size={16} className={crawling ? 'animate-bounce' : ''} />
                            <span>{crawling ? 'Crawling...' : 'Crawl'}</span>
                        </button>

                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="rounded-full border border-stone-200 bg-white p-2.5 text-rose-400 shadow-sm transition-all hover:bg-rose-50 hover:text-rose-600"
                        >
                            <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Filter Bar Overlay ────────────────────────────────────────── */}
            <div className="flex shrink-0 items-center gap-4 border-b border-stone-100 bg-[#FCFDFC]/80 px-5 py-3 backdrop-blur-md md:px-8">
                <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 p-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
                                ${filter === cat
                                    ? 'bg-white text-stone-900 shadow-sm'
                                    : 'text-stone-500 hover:text-stone-900'
                                }`}
                        >
                            <span>{cat === 'All' ? 'Tất cả' : cat}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === cat ? 'bg-stone-100 text-stone-600' : 'bg-stone-200/50 text-stone-400'}`}>
                                {getCategoryCount(cat)}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="h-4 w-px bg-stone-200" />
                
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm text-stone-700 outline-none hover:border-stone-300"
                    >
                        <option value="all">Mọi nguồn tin</option>
                        {uniqueSources.map(source => (
                            <option key={source} value={source}>{source}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 p-1">
                         {(['all', 'new', 'today', 'yesterday'] as const).map(item => (
                            <button
                                key={item}
                                onClick={() => { setDateFilter(item); setFilterDate(''); }}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all
                                    ${dateFilter === item
                                        ? 'bg-stone-900 text-white shadow-sm'
                                        : 'text-stone-500 hover:text-stone-900'
                                    }`}
                            >
                                {item === 'all' ? 'Toàn bộ' : item === 'new' ? 'Tin mới' : item === 'today' ? 'Hôm nay' : 'Hôm qua'}
                            </button>
                        ))}
                    </div>

                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => { setFilterDate(e.target.value); setDateFilter('custom'); }}
                        className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs text-stone-700 outline-none hover:border-stone-300"
                    />
                </div>
            </div>

            {/* ── Scrollable Content Area ───────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-8 md:px-8">
                <div className="mx-auto max-w-7xl">

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="max-w-md w-full rounded-2xl border border-stone-200/90 bg-white shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-medium text-stone-900">Quản Lý Bài Viết</h2>
                            <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-stone-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3 px-6 pb-6">
                            <button
                                onClick={handleDeleteYesterday}
                                disabled={deleting}
                                className="w-full p-4 text-left rounded-xl border border-stone-200 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                <Calendar size={20} className="text-red-500" />
                                <div>
                                    <p className="font-medium text-stone-900">Xóa bài viết hôm qua</p>
                                    <p className="text-sm text-stone-500">Xóa tất cả bài viết của ngày hôm qua</p>
                                </div>
                            </button>

                            <button
                                onClick={handleDeleteLastWeek}
                                disabled={deleting}
                                className="w-full p-4 text-left rounded-xl border border-stone-200 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                <Calendar size={20} className="text-orange-500" />
                                <div>
                                    <p className="font-medium text-stone-900">Xóa bài viết tuần trước</p>
                                    <p className="text-sm text-stone-500">Xóa tất cả bài viết cũ hơn 7 ngày</p>
                                </div>
                            </button>

                            <div className="p-4 rounded-xl border border-stone-200">
                                <p className="font-medium text-stone-900 mb-3">Xóa theo ngày cụ thể</p>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        className={`flex-1 ${inputClass}`}
                                    />
                                    <button
                                        onClick={handleDeleteCustomDate}
                                        disabled={deleting || !customDate}
                                        className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>

                            <hr className="my-4 border-stone-100" />

                            <button
                                onClick={handleDeleteAll}
                                disabled={deleting}
                                className="w-full p-4 text-left rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                <Trash2 size={20} className="text-red-600" />
                                <div>
                                    <p className="font-medium text-red-600">⚠️ Xóa TẤT CẢ bài viết</p>
                                    <p className="text-sm text-red-500">Hành động này không thể hoàn tác!</p>
                                </div>
                            </button>
                        </div>

                        {deleting && (
                            <div className="mt-4 pb-6 text-center text-stone-500">
                                <RefreshCw className="animate-spin inline mr-2" size={16} />
                                Đang xóa...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={`${cardClass} p-6 h-64 animate-pulse`}>
                                <div className="h-4 bg-stone-100 rounded w-1/4 mb-4"></div>
                                <div className="h-48 bg-stone-100 rounded-xl mb-4"></div>
                                <div className="h-6 bg-stone-100 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-stone-300 mb-4">
                            <Filter size={48} className="mx-auto" />
                        </div>
                        <h3 className="text-xl font-medium text-stone-900">Không tìm thấy tin tức</h3>
                        <p className="text-stone-500 mt-2">Hệ thống đang thu thập tin tức. Vui lòng quay lại sau.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredArticles.map((article, index) => (
                            <NewsCard
                                key={article.id}
                                article={article}
                                index={index}
                                isNew={isArticleNew(article)}
                            />
                        ))}
                    </div>
                )}
                </div>
            </div>
        </div>
    </div>
    );
};

export default NewsPage;
