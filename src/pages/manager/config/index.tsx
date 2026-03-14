import React, { useState, useEffect } from 'react';
import {
  Card,
  DatePicker,
  Button,
  Typography,
  message,
  Spin,
  Tag,
  Divider,
} from 'antd';
import {
  CalendarOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { getDateConfig, updateDateConfig } from '@/lib/actions';
import type { DateConfigResponse } from '@/lib/actions';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type RangeValue = [Dayjs | null, Dayjs | null] | null;

const getWindowStatus = (start: string | null, end: string | null) => {
  if (!start || !end) return { label: 'Not configured', color: 'default' as const };
  const now = dayjs();
  const s = dayjs(start);
  const e = dayjs(end).endOf('day');
  if (now.isBefore(s)) return { label: 'Upcoming', color: 'processing' as const };
  if (now.isAfter(e)) return { label: 'Closed', color: 'default' as const };
  return { label: 'Open', color: 'success' as const };
};

const DateConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DateConfigResponse | null>(null);

  const [holdRange, setHoldRange] = useState<RangeValue>(null);
  const [newRange, setNewRange] = useState<RangeValue>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await getDateConfig();
      setConfig(data);
      setHoldRange(
        data.hold_window.start && data.hold_window.end
          ? [dayjs(data.hold_window.start), dayjs(data.hold_window.end)]
          : null
      );
      setNewRange(
        data.new_booking_window.start && data.new_booking_window.end
          ? [dayjs(data.new_booking_window.start), dayjs(data.new_booking_window.end)]
          : null
      );
    } catch {
      message.error('Failed to load date configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        hold_window: {
          start: holdRange?.[0]?.startOf('day').toISOString() ?? null,
          end: holdRange?.[1]?.endOf('day').toISOString() ?? null,
        },
        new_booking_window: {
          start: newRange?.[0]?.startOf('day').toISOString() ?? null,
          end: newRange?.[1]?.endOf('day').toISOString() ?? null,
        },
      };
      const updated = await updateDateConfig(payload);
      setConfig(updated);
      message.success('Date configuration saved successfully');
    } catch {
      message.error('Failed to save date configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const holdStatus = getWindowStatus(config?.hold_window.start ?? null, config?.hold_window.end ?? null);
  const newStatus = getWindowStatus(config?.new_booking_window.start ?? null, config?.new_booking_window.end ?? null);

  return (
    <div style={{ padding: '32px 40px', background: '#fff', minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ color: '#1a3c6e', marginBottom: 4 }}>
            <CalendarOutlined style={{ marginRight: 10 }} />
            Date Configuration
          </Title>
          <Text type="secondary">
            Configure the booking windows that control when students can book or hold their beds.
          </Text>
        </div>

        {/* Hold Window */}
        <Card
          style={{ marginBottom: 24, borderRadius: 10, border: '1px solid #e8e8e8' }}
          bodyStyle={{ padding: 28 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <Title level={4} style={{ margin: 0, color: '#1a3c6e' }}>
                <ClockCircleOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                Bed Hold Period
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                For students who already have an active bed contract (giữ giường)
              </Text>
            </div>
            <Tag color={holdStatus.color} icon={<CheckCircleOutlined />}>
              {holdStatus.label}
            </Tag>
          </div>

          <div>
            <Text style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Start Date → End Date
            </Text>
            <RangePicker
              value={holdRange}
              onChange={(val) => setHoldRange(val as RangeValue)}
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              allowClear
              size="large"
              placeholder={['Start date', 'End date']}
            />
            {config?.hold_window.start && config?.hold_window.end && (
              <Text type="secondary" style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
                Current: {dayjs(config.hold_window.start).format('DD/MM/YYYY')} →{' '}
                {dayjs(config.hold_window.end).format('DD/MM/YYYY')}
              </Text>
            )}
          </div>
        </Card>

        {/* New Booking Window */}
        <Card
          style={{ marginBottom: 32, borderRadius: 10, border: '1px solid #e8e8e8' }}
          bodyStyle={{ padding: 28 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <Title level={4} style={{ margin: 0, color: '#1a3c6e' }}>
                <CalendarOutlined style={{ marginRight: 8, color: '#1a6ef5' }} />
                New Booking Period
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                For students who do not have a bed yet (book giường mới)
              </Text>
            </div>
            <Tag color={newStatus.color} icon={<CheckCircleOutlined />}>
              {newStatus.label}
            </Tag>
          </div>

          <div>
            <Text style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Start Date → End Date
            </Text>
            <RangePicker
              value={newRange}
              onChange={(val) => setNewRange(val as RangeValue)}
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              allowClear
              size="large"
              placeholder={['Start date', 'End date']}
            />
            {config?.new_booking_window.start && config?.new_booking_window.end && (
              <Text type="secondary" style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
                Current: {dayjs(config.new_booking_window.start).format('DD/MM/YYYY')} →{' '}
                {dayjs(config.new_booking_window.end).format('DD/MM/YYYY')}
              </Text>
            )}
          </div>
        </Card>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
            style={{ borderRadius: 8, minWidth: 140 }}
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DateConfigPage;
