import { useEffect, useMemo, useState } from 'react';
import { Empty, Input, Skeleton, Tag, message, theme } from 'antd';
import { CalendarDays, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { fetchNews, type News } from '@/lib/actions/news';

// System categories (from backend NewsCategory) – UI: hide "announcement"
const categoryOptions: Array<{ label: string; value: string }> = [
  { label: 'Event', value: 'event' },
  { label: 'Policy', value: 'policy' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'General', value: 'general' },
];

const getCategoryLabel = (value: string) =>
  (value === 'announcement'
    ? 'Announcement'
    : categoryOptions.find((c) => c.value === value)?.label) || value || 'General';

const getDefaultCategoryThumbnail = (category: string, position0: number) => {
  const cat = String(category || 'general').toLowerCase();
  const safeCat = ['event', 'policy', 'maintenance', 'general'].includes(cat) ? cat : 'general';
  const idx = (position0 % 5) + 1;
  return `/images/news/${safeCat}/${safeCat}${idx}.png`;
};

export default function StudentNewsPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [showSearch, setShowSearch] = useState(false);

  const loadNews = async () => {
    try {
      setLoading(true);
      const res = await fetchNews({ page: 1, limit: 50 });
      setNews(res.items || []);
    } catch (error: any) {
      console.error(error);
      message.error('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const filteredNews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...news]
      .sort((a, b) => {
        const aDate = a.published_at || a.createdAt;
        const bDate = b.published_at || b.createdAt;
        return dayjs(bDate).valueOf() - dayjs(aDate).valueOf();
      })
      .filter((n) => {
        if (category !== 'all' && String(n.category) !== category) return false;
        if (!q) return true;
        return (
          String(n.title || '').toLowerCase().includes(q) ||
          String(n.content || '').toLowerCase().includes(q)
        );
      });
  }, [news, search, category]);

  const thumbnailsById = useMemo(() => {
    const counters = new Map<string, number>();
    const map = new Map<string, string>();
    for (const item of filteredNews) {
      const cat = String(item.category || 'general').toLowerCase();
      const n = counters.get(cat) ?? 0;
      const url =
        item.thumbnail_url ||
        getDefaultCategoryThumbnail(cat, n) ||
        '/images/news-illustration.jpg';
      counters.set(cat, n + 1);
      map.set(item.id, url);
    }
    return map;
  }, [filteredNews]);

  const getThumb = (item?: News | null) =>
    (item?.id ? thumbnailsById.get(item.id) : undefined) ||
    item?.thumbnail_url ||
    '/images/news-illustration.jpg';

  const featured = filteredNews[0];
  const rest = filteredNews.slice(1);

  const sections = useMemo(() => {
    const portalCats = categoryOptions;
    const byCat = new Map<string, News[]>();
    for (const c of portalCats) byCat.set(c.value, []);
    for (const n of filteredNews) {
      const key = String(n.category || '').toLowerCase();
      if (byCat.has(key)) byCat.get(key)!.push(n);
    }
    return portalCats.map((c) => ({
      ...c,
      items: (byCat.get(c.value) || []).slice(0, 6),
    }));
  }, [filteredNews]);

  return (
    <div className="w-full">
      {/* Top portal header */}
      <div style={{ backgroundColor: token.colorPrimary }} className="text-white">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="font-black tracking-wide text-lg sm:text-xl whitespace-nowrap">
                FPT NEWS
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showSearch && (
                <Input
                  allowClear
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-[220px] sm:w-[320px]"
                />
              )}
              <button
                type="button"
                onClick={() => setShowSearch((v) => !v)}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center"
                aria-label="Toggle search"
              >
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Category nav */}
          <div className="border-t border-white/10">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${category === 'all' ? 'bg-white' : 'bg-white/10 hover:bg-white/15'}`}
                style={category === 'all' ? { color: token.colorPrimary } : undefined}
              >
                Tất cả
              </button>
              {categoryOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${category === c.value ? 'bg-white' : 'bg-white/10 hover:bg-white/15'}`}
                  style={category === c.value ? { color: token.colorPrimary } : undefined}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="py-10 bg-white border border-gray-200 rounded-2xl">
            <Empty description="No news found" />
          </div>
        ) : category !== 'all' ? (
          <div className="space-y-6">
            {/* Hàng đầu: news lớn + Đọc nhiều nhất */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4">
                {featured && (
                  <div
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/student/news/${featured.id}`)}
                  >
                    <div className="w-full aspect-[16/10] max-h-[340px] bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={getThumb(featured)}
                        alt="Featured thumbnail"
                        className="max-w-full max-h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag color="red" className="text-xs">
                          {getCategoryLabel(String(featured.category))}
                        </Tag>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={14} />
                            {featured.published_at
                              ? dayjs(featured.published_at).format('DD/MM/YYYY HH:mm')
                              : dayjs(featured.createdAt).format('DD/MM/YYYY HH:mm')}
                          </span>
                        </div>
                      </div>
                      <div
                        className="text-lg sm:text-2xl font-extrabold text-gray-900 break-words"
                        style={{
                          fontFamily:
                            '"InterTight-Bold","InterTight-SemiBold","InterTight-Medium","InterTight-Regular","Segoe UI",system-ui,-apple-system,sans-serif',
                        }}
                      >
                        {featured.title}
                      </div>
                      <div className="text-sm font-medium" style={{ color: token.colorPrimary }}>
                        Xem thêm
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right sidebar: Đọc nhiều nhất */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 font-bold text-gray-900">
                    Đọc nhiều nhất
                  </div>
                  <div className="divide-y divide-gray-100">
                    {filteredNews.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer flex gap-3"
                        onClick={() => navigate(`/student/news/${item.id}`)}
                      >
                        <div className="shrink-0 w-16 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                          <img
                            src={getThumb(item)}
                            alt="News thumbnail"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div
                            className="text-sm font-semibold text-gray-900 line-clamp-2"
                            style={{
                              fontFamily:
                                '"InterTight-SemiBold","InterTight-Medium","InterTight-Regular","Segoe UI",system-ui,-apple-system,sans-serif',
                            }}
                          >
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getCategoryLabel(String(item.category))} •{' '}
                            {item.published_at
                              ? dayjs(item.published_at).format('DD/MM/YYYY')
                              : dayjs(item.createdAt).format('DD/MM/YYYY')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Hàng thứ hai: tất cả news nhỏ kéo dài full width */}
            {rest.length > 0 && (
              <div className="space-y-2.5">
                {rest.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/student/news/${item.id}`)}
                  >
                    <div className="flex gap-4 items-stretch">
                      <div className="w-32 sm:w-40 md:w-48 h-20 sm:h-24 md:h-28 bg-white flex items-center justify-center overflow-hidden">
                        <img
                          src={getThumb(item)}
                          alt="News thumbnail"
                          className="max-w-full max-h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 py-2.5 pr-4 min-w-0 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Tag color="red" className="text-[10px] leading-none">
                              {getCategoryLabel(String(item.category))}
                            </Tag>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={14} />
                            {item.published_at
                              ? dayjs(item.published_at).format('DD/MM/YYYY')
                              : dayjs(item.createdAt).format('DD/MM/YYYY')}
                          </span>
                        </div>
                        <div
                          className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2"
                          style={{
                            fontFamily:
                              '"InterTight-SemiBold","InterTight-Medium","InterTight-Regular","Segoe UI",system-ui,-apple-system,sans-serif',
                          }}
                        >
                          {item.title}
                        </div>
                        <div className="text-xs font-medium" style={{ color: token.colorPrimary }}>
                          Xem thêm
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Featured + sidebar (homepage) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4">
                {featured && (
                  <div
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/student/news/${featured.id}`)}
                  >
                    <div className="w-full aspect-[16/10] max-h-[340px] bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={getThumb(featured)}
                        alt="Featured thumbnail"
                        className="max-w-full max-h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag color="red" className="text-xs">
                          {getCategoryLabel(String(featured.category))}
                        </Tag>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={14} />
                            {featured.published_at
                              ? dayjs(featured.published_at).format('DD/MM/YYYY HH:mm')
                              : dayjs(featured.createdAt).format('DD/MM/YYYY HH:mm')}
                          </span>
                        </div>
                      </div>
                      <div
                        className="text-lg sm:text-2xl font-extrabold text-gray-900 break-words"
                        style={{ fontFamily: '"InterTight-Bold","InterTight-SemiBold","InterTight-Medium","InterTight-Regular","Segoe UI",system-ui,-apple-system,sans-serif' }}
                      >
                        {featured.title}
                      </div>
                      <div className="text-sm font-medium" style={{ color: token.colorPrimary }}>
                        Xem thêm
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 font-bold text-gray-900">
                    News
                  </div>
                  <div className="divide-y divide-gray-100">
                    {rest.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 hover:bg-gray-50 cursor-pointer flex gap-2.5"
                        onClick={() => navigate(`/student/news/${item.id}`)}
                      >
                        <div className="shrink-0 w-14 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                          <img
                            src={getThumb(item)}
                            alt="News thumbnail"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div
                            className="text-[13px] font-semibold text-gray-900 line-clamp-2"
                            style={{
                              fontFamily:
                                '"InterTight-SemiBold","InterTight-Medium","InterTight-Regular","Segoe UI",system-ui,-apple-system,sans-serif',
                            }}
                          >
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getCategoryLabel(String(item.category))} •{' '}
                            {item.published_at
                              ? dayjs(item.published_at).format('DD/MM/YYYY')
                              : dayjs(item.createdAt).format('DD/MM/YYYY')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Category sections */}
            {sections.map((sec) =>
              sec.items.length === 0 ? null : (
                <div key={sec.value} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-extrabold text-gray-900">
                      {sec.label}
                    </div>
                    <button
                      type="button"
                      className="text-sm font-semibold hover:underline"
                      style={{ color: token.colorPrimary }}
                      onClick={() => setCategory(sec.value)}
                    >
                      Xem tất cả
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sec.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/student/news/${item.id}`)}
                      >
                        <div className="w-full aspect-[16/9] bg-gray-100 overflow-hidden">
                          <img
                            src={getThumb(item)}
                            alt="News thumbnail"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="text-xs text-gray-500 inline-flex items-center gap-1">
                            <CalendarDays size={14} />
                            {item.published_at
                              ? dayjs(item.published_at).format('DD/MM/YYYY')
                              : dayjs(item.createdAt).format('DD/MM/YYYY')}
                          </div>
                          <div
                            className="font-semibold text-gray-900 break-words line-clamp-2"
                            style={{ fontFamily: '"InterTight-SemiBold","InterTight-Medium","InterTight-Regular","Segoe UI",system-ui,-apple-system,sans-serif' }}
                          >
                            {item.title}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
