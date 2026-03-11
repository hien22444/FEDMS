import { useEffect, useMemo, useState } from 'react';
import { Card, Empty, Input, Select, Skeleton, Tag, message } from 'antd';
import { CalendarDays, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { fetchNews, type News } from '@/lib/actions/news';

const categoryOptions = [
  { label: 'Announcement', value: 'announcement' },
  { label: 'Event', value: 'event' },
  { label: 'Policy', value: 'policy' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'General', value: 'general' },
];

const getCategoryLabel = (value: string) =>
  categoryOptions.find((c) => c.value === value)?.label || value || 'General';

export default function StudentNewsPage() {
  const navigate = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

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

  const featured = filteredNews[0];
  const rest = filteredNews.slice(1);

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">News & Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with dormitory news and events.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-orange-600" />
          <div className="font-semibold text-gray-900">News</div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search news by title or content..."
              style={{ minWidth: 240 }}
            />
            <Select
              value={category}
              onChange={(v) => setCategory(v)}
              style={{ minWidth: 200 }}
              options={[{ label: 'All categories', value: 'all' }, ...categoryOptions]}
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="rounded-xl border border-gray-200">
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ))}
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="py-10">
              <Empty description="No news found" />
            </div>
          ) : (
            <>
              {featured && (
                <Card
                  className="rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  bodyStyle={{ padding: 20 }}
                  onClick={() => navigate(`/student/news/${featured.id}`)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                    <div className="md:col-span-3 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag color="blue" className="text-xs">
                          {getCategoryLabel(featured.category as string)}
                        </Tag>
                        <Tag color="green" className="text-xs">
                          Published
                        </Tag>
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                        {featured.title}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={14} />
                          {featured.published_at
                            ? dayjs(featured.published_at).format('DD/MM/YYYY HH:mm')
                            : dayjs(featured.createdAt).format('DD/MM/YYYY HH:mm')}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>
                          Updated: {dayjs(featured.updatedAt).format('DD/MM/YYYY HH:mm')}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-orange-600">Read more</div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="w-full aspect-[16/9] overflow-hidden rounded-xl border border-gray-100 bg-orange-50 flex items-center justify-center">
                        <img
                          src="/images/news-illustration.jpg"
                          alt="News illustration"
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rest.map((item) => (
                    <Card
                      key={item.id}
                      size="small"
                      className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/student/news/${item.id}`)}
                      bodyStyle={{ padding: 16 }}
                    >
                      <div className="flex gap-3 items-start">
                        <div className="shrink-0">
                          <div className="w-[88px] h-[64px] overflow-hidden rounded-lg border border-gray-100 bg-orange-50 flex items-center justify-center">
                            <img
                              src="/images/news-illustration.jpg"
                              alt="News illustration"
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Tag color="blue" className="text-xs">
                              {getCategoryLabel(item.category as string)}
                            </Tag>
                            <Tag color="green" className="text-xs">
                              Published
                            </Tag>
                          </div>

                          <div className="font-semibold text-gray-900 break-words">{item.title}</div>

                          <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={14} />
                              {item.published_at
                                ? dayjs(item.published_at).format('DD/MM/YYYY')
                                : dayjs(item.createdAt).format('DD/MM/YYYY')}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span>Updated: {dayjs(item.updatedAt).format('DD/MM/YYYY')}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
