import { useEffect, useMemo, useState } from 'react';
import { CalendarOutlined, CreditCardOutlined, DropboxOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Col, Row, Typography, message, theme } from 'antd';
import { NewsSection, StatCard, StudentInfo } from '@/components/unix';
import { useAuth } from '@/contexts';
import { fetchNews, type News } from '@/lib/actions/news';
import { getMyEWUsages, type MyEWRecord } from '@/lib/actions/ewUsage';
import { getMyBookings, type BookingRequestItem } from '@/lib/actions/booking';
import { getMyInvoices, type StudentInvoice } from '@/lib/actions/invoice';

const { Title, Text } = Typography;

type DashboardStats = {
  electricityValue: string;
  electricityChange: string;
  electricityChangeType: 'positive' | 'negative' | 'success' | 'info';
  waterValue: string;
  waterChange: string;
  waterChangeType: 'positive' | 'negative' | 'success' | 'info';
  paymentValue: string;
  paymentChange: string;
  paymentChangeType: 'positive' | 'negative' | 'success' | 'info';
  contractValue: string;
  contractChange: string;
  contractChangeType: 'positive' | 'negative' | 'success' | 'info';
};

type DashboardNewsItem = {
  id: string;
  badge?: string;
  title: string;
  date: string;
  category?: string;
};

const DEFAULT_STATS: DashboardStats = {
  electricityValue: '--',
  electricityChange: 'No utility data',
  electricityChangeType: 'info',
  waterValue: '--',
  waterChange: 'No utility data',
  waterChangeType: 'info',
  paymentValue: '0 VND',
  paymentChange: 'No unpaid invoices',
  paymentChangeType: 'success',
  contractValue: 'No contract',
  contractChange: 'Not assigned',
  contractChangeType: 'info',
};

const formatCurrency = (value: number) => `${value.toLocaleString('en-US')} VND`;

const getLatestMonthKey = (dates: string[]) =>
  [...dates]
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0]
    ?.slice(0, 7) || null;

const isCurrentBooking = (booking: BookingRequestItem, now: Date) => {
  if (booking.status !== 'approved' || booking.checkout_date) return false;
  const start = new Date(booking.start_date);
  const end = new Date(booking.end_date);
  return start <= now && now <= end;
};

const isUpcomingBooking = (booking: BookingRequestItem, now: Date) =>
  booking.status === 'approved' && !booking.checkout_date && new Date(booking.start_date) > now;

const StudentDashboard = () => {
  const { token } = theme.useToken();
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [newsItems, setNewsItems] = useState<DashboardNewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  const displayName =
    profile?.full_name || user?.fullname || user?.email?.split('@')[0] || 'Student';

  const greetingSubtitle = useMemo(() => {
    if (profile?.student_code) {
      return `Student code: ${profile.student_code}`;
    }
    return 'Welcome back to the dormitory management system';
  }, [profile?.student_code]);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const [ewRes, invoices, bookingsRes, newsRes] = await Promise.all([
          getMyEWUsages(),
          getMyInvoices(),
          getMyBookings({ page: 1, limit: 50 }),
          fetchNews({ page: 1, limit: 3 }),
        ]);

        if (!active) return;

        const now = new Date();
        const latestMonthKey = getLatestMonthKey(ewRes.data.map((item: MyEWRecord) => item.date));
        const latestMonthRecords = latestMonthKey
          ? ewRes.data.filter((item: MyEWRecord) => item.date.slice(0, 7) === latestMonthKey)
          : [];
        const electricityRecords = latestMonthRecords.filter(
          (item: MyEWRecord) => item.type === 'electric'
        );
        const waterRecords = latestMonthRecords.filter((item: MyEWRecord) => item.type === 'water');
        const electricityConsumption = electricityRecords.reduce(
          (sum: number, item: MyEWRecord) => sum + Number(item.consumption || 0),
          0
        );
        const waterConsumption = waterRecords.reduce(
          (sum: number, item: MyEWRecord) => sum + Number(item.consumption || 0),
          0
        );

        const unpaidInvoices = invoices.filter((invoice: StudentInvoice) =>
          ['unpaid', 'overdue'].includes(invoice.payment_status)
        );
        const unpaidAmount = unpaidInvoices.reduce(
          (sum: number, invoice: StudentInvoice) => sum + Number(invoice.total_amount || 0),
          0
        );

        const bookings = bookingsRes.items || [];
        const currentBooking = bookings.find((booking: BookingRequestItem) =>
          isCurrentBooking(booking, now)
        );
        const upcomingBooking = bookings
          .filter((booking: BookingRequestItem) => isUpcomingBooking(booking, now))
          .sort(
            (left: BookingRequestItem, right: BookingRequestItem) =>
              new Date(left.start_date).getTime() - new Date(right.start_date).getTime()
          )[0];
        const latestApprovedBooking = bookings
          .filter((booking: BookingRequestItem) => booking.status === 'approved')
          .sort(
            (left: BookingRequestItem, right: BookingRequestItem) =>
              new Date(right.start_date).getTime() - new Date(left.start_date).getTime()
          )[0];
        const contractBooking = currentBooking || upcomingBooking || latestApprovedBooking || null;

        setStats({
          electricityValue: electricityRecords.length > 0 ? `${electricityConsumption} kWh` : '--',
          electricityChange: latestMonthKey || 'No utility data',
          electricityChangeType: electricityRecords.length > 0 ? 'positive' : 'info',
          waterValue: waterRecords.length > 0 ? `${waterConsumption} m3` : '--',
          waterChange: latestMonthKey || 'No utility data',
          waterChangeType: waterRecords.length > 0 ? 'negative' : 'info',
          paymentValue: formatCurrency(unpaidAmount),
          paymentChange:
            unpaidAmount > 0
              ? `${unpaidInvoices.length} unpaid invoice${unpaidInvoices.length > 1 ? 's' : ''}`
              : 'Paid',
          paymentChangeType: unpaidAmount > 0 ? 'negative' : 'success',
          contractValue: contractBooking?.semester || 'No contract',
          contractChange: currentBooking
            ? 'Active'
            : upcomingBooking
              ? 'Upcoming'
              : latestApprovedBooking
                ? latestApprovedBooking.status
                : 'Not assigned',
          contractChangeType: currentBooking ? 'success' : 'info',
        });

        setNewsItems(
          (newsRes.items || []).map((item: News, index: number) => ({
            id: item.id,
            badge: index === 0 ? 'New' : undefined,
            title: item.title,
            date: item.published_at || item.createdAt,
            category: item.category,
          }))
        );
      } catch (error) {
        console.error(error);
        message.error('Failed to load dashboard data');
      } finally {
        if (active) setLoadingNews(false);
      }
    };

    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <main
        style={{
          padding: '32px',
          backgroundColor: token.colorBgLayout,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            Hello, <span style={{ color: token.colorPrimary }}>{displayName}</span>
          </Title>
          <Text type="secondary">{greetingSubtitle}</Text>
        </div>

        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={<ThunderboltOutlined style={{ fontSize: '24px' }} />}
              label="Electricity This Month"
              value={stats.electricityValue}
              change={stats.electricityChange}
              changeType={stats.electricityChangeType}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={<DropboxOutlined style={{ fontSize: '24px' }} />}
              label="Water This Month"
              value={stats.waterValue}
              change={stats.waterChange}
              changeType={stats.waterChangeType}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={<CreditCardOutlined style={{ fontSize: '24px' }} />}
              label="Payment"
              value={stats.paymentValue}
              change={stats.paymentChange}
              changeType={stats.paymentChangeType}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={<CalendarOutlined style={{ fontSize: '24px' }} />}
              label="Contract"
              value={stats.contractValue}
              change={stats.contractChange}
              changeType={stats.contractChangeType}
            />
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <NewsSection items={newsItems} loading={loadingNews} />
          </Col>
          <Col xs={24} lg={8}>
            <StudentInfo />
          </Col>
        </Row>
      </main>
    </div>
  );
};

export default StudentDashboard;
