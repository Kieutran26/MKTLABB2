import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { NewsCard, NewsArticle } from './NewsCard';
import { RefreshCw, Filter, Trash2, Calendar, X, Wifi, WifiOff, Download } from 'lucide-react';
import { useToast } from '../Toast';

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
        <div className="min-h-screen bg-[#F9FAFB] p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Tin Tức Tổng Hợp</h1>
                    <p className="text-gray-500">Cập nhật tin tức mới nhất về Tài chính, Marketing & Công nghệ</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {/* Realtime Status */}
                    <div className="flex items-center gap-2">
                        {isRealtimeConnected ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                                <Wifi size={12} />
                                <span>Realtime</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                                <WifiOff size={12} />
                                <span>Đang kết nối...</span>
                            </div>
                        )}
                        {lastUpdated && (
                            <span className="text-xs text-gray-400">
                                Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
                            </span>
                        )}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-3">
                        {/* Category Filter */}
                        <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilter(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5
                                        ${filter === cat
                                            ? 'bg-gray-900 text-white shadow-md'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <span>{cat === 'All' ? 'Tất cả' : cat}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === cat ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {getCategoryCount(cat)}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <button
                            onClick={() => fetchNews()}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Làm mới"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={crawlNews}
                            disabled={crawling}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 text-sm font-medium"
                            title="Thu thập tin mới từ các nguồn RSS"
                        >
                            <Download size={16} className={crawling ? 'animate-bounce' : ''} />
                            <span>{crawling ? 'Đang crawl...' : 'Crawl'}</span>
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Quản lý xóa bài"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    {/* Advanced Filters Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Source Dropdown */}
                        <select
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                        >
                            <option value="all">Tất cả nguồn</option>
                            {uniqueSources.map(source => (
                                <option key={source} value={source}>{source}</option>
                            ))}
                        </select>

                        {/* Date Filters */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-100">
                            {[
                                { key: 'all', label: 'Tất cả' },
                                { key: 'new', label: 'Mới' },
                                { key: 'today', label: 'Hôm nay' },
                                { key: 'yesterday', label: 'Hôm qua' },
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => { setDateFilter(item.key as any); setFilterDate(''); }}
                                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all
                                        ${dateFilter === item.key
                                            ? 'bg-indigo-500 text-white'
                                            : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Picker */}
                        <div className="flex items-center gap-1">
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => { setFilterDate(e.target.value); setDateFilter('custom'); }}
                                className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            {filterDate && (
                                <button
                                    onClick={() => { setFilterDate(''); setDateFilter('all'); }}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Filter Count */}
                        <span className="text-xs text-gray-400">
                            {filteredArticles.length} / {articles.length} tin
                        </span>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Quản Lý Bài Viết</h2>
                            <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleDeleteYesterday}
                                disabled={deleting}
                                className="w-full p-4 text-left rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                <Calendar size={20} className="text-red-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Xóa bài viết hôm qua</p>
                                    <p className="text-sm text-gray-500">Xóa tất cả bài viết của ngày hôm qua</p>
                                </div>
                            </button>

                            <button
                                onClick={handleDeleteLastWeek}
                                disabled={deleting}
                                className="w-full p-4 text-left rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                <Calendar size={20} className="text-orange-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Xóa bài viết tuần trước</p>
                                    <p className="text-sm text-gray-500">Xóa tất cả bài viết cũ hơn 7 ngày</p>
                                </div>
                            </button>

                            <div className="p-4 rounded-xl border border-gray-200">
                                <p className="font-medium text-gray-900 mb-3">Xóa theo ngày cụ thể</p>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleDeleteCustomDate}
                                        disabled={deleting || !customDate}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>

                            <hr className="my-4" />

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
                            <div className="mt-4 text-center text-gray-500">
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
                            <div key={i} className="bg-white rounded-2xl p-6 h-64 animate-pulse shadow-sm">
                                <div className="h-4 bg-gray-100 rounded w-1/4 mb-4"></div>
                                <div className="h-48 bg-gray-100 rounded-xl mb-4"></div>
                                <div className="h-6 bg-gray-100 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-gray-300 mb-4">
                            <Filter size={48} className="mx-auto" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900">Không tìm thấy tin tức</h3>
                        <p className="text-gray-500 mt-2">Hệ thống đang thu thập tin tức. Vui lòng quay lại sau.</p>
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
    );
};

export default NewsPage;
