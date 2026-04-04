import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Card,
  DatePicker,
  Button,
  Typography,
  Spin,
  Tag,
  Select,
  InputNumber,
  Alert,
} from 'antd';
import {
  CalendarOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BookOutlined,
  InfoCircleOutlined,
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

const SEMESTER_ORDER: Record<string, number> = { Spring: 1, Summer: 2, Fall: 3 };

const SEMESTER_OPTIONS = [
  { value: 'Spring', label: '1 - Spring' },
  { value: 'Summer', label: '2 - Summer' },
  { value: 'Fall',   label: '3 - Fall' },
];

/** Returns the semester name + year + numeric rank for today */
const getCurrentSemester = () => {
  const now = dayjs();
  const year = now.year();
  const mmdd = now.format('MM-DD');
  let name: 'Spring' | 'Summer' | 'Fall';
  if (mmdd < '05-01') name = 'Spring';
  else if (mmdd < '09-01') name = 'Summer';
  else name = 'Fall';
  return { name, year, rank: year * 10 + SEMESTER_ORDER[name] };
};

const semRank = (name: string | null, year: number | null) => {
  if (!name || !year || !SEMESTER_ORDER[name]) return 0;
  return year * 10 + SEMESTER_ORDER[name];
};

const SectionLabel: React.FC<{ text: string }> = ({ text }) => (
  <Text style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
    {text}
  </Text>
);

const DateConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DateConfigResponse | null>(null);

  const [holdRange, setHoldRange] = useState<RangeValue>(null);
  const [newRange, setNewRange] = useState<RangeValue>(null);
  const [targetSemester, setTargetSemester] = useState<'Spring' | 'Summer' | 'Fall' | null>(null);
  const [targetYear, setTargetYear] = useState<number | null>(null);

  useEffect(() => { loadConfig(); }, []);

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
      setTargetSemester((data.target_semester?.semester as 'Spring' | 'Summer' | 'Fall') ?? null);
      setTargetYear(data.target_semester?.year ?? null);
    } catch {
      toast.error('Failed to load date configuration');
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
        target_semester: {
          semester: targetSemester,
          year: targetYear,
        },
      };
      const updated = await updateDateConfig(payload);
      setConfig(updated);
      toast.success('Configuration saved successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save configuration');
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
  const newStatus  = getWindowStatus(config?.new_booking_window.start ?? null, config?.new_booking_window.end ?? null);
  const targetLabel = targetSemester && targetYear ? `${targetSemester}-${targetYear}` : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Date Configuration</h1>
        <p className="text-sm text-gray-500">
          Control when students can book or hold their beds, and set the target semester.
        </p>
      </div>

      {/* ── 1. Target Semester ── */}
      <Card
        style={{ borderRadius: 10, border: '1.5px solid #d1fae5' }}
        bodyStyle={{ padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#1a3c6e' }}>
              <BookOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              Target Semester for Booking
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              The semester students will book rooms for. If not set, the system will auto-calculate the next semester.
            </Text>
          </div>
          {targetLabel ? (
            <Tag color="green" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 6 }}>
              {targetLabel}
            </Tag>
          ) : (
            <Tag color="default" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 6 }}>
              Auto
            </Tag>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <SectionLabel text="Semester" />
            <Select
              value={targetSemester}
              onChange={(val) => setTargetSemester(val)}
              allowClear
              onClear={() => setTargetSemester(null)}
              size="large"
              style={{ width: '100%' }}
              placeholder="Select semester"
              options={SEMESTER_OPTIONS.map((opt) => {
                const cur = getCurrentSemester();
                const rank = semRank(opt.value, targetYear ?? cur.year);
                return { ...opt, disabled: rank < cur.rank };
              })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <SectionLabel text="Year" />
            <InputNumber
              value={targetYear}
              onChange={(val) => {
                setTargetYear(val);
                // If the newly chosen year makes the current semester invalid, clear it
                const cur = getCurrentSemester();
                if (targetSemester && val !== null && semRank(targetSemester, val) < cur.rank) {
                  setTargetSemester(null);
                }
              }}
              min={getCurrentSemester().year}
              max={2100}
              size="large"
              style={{ width: '100%' }}
              placeholder="e.g. 2026"
            />
          </div>
        </div>

        {(!targetSemester || !targetYear) && (
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message="No target semester set — the system will automatically calculate the next upcoming semester."
            style={{ marginTop: 16, borderRadius: 8 }}
          />
        )}
      </Card>

      {/* ── 2. Bed Hold Period ── */}
      <Card
        style={{ borderRadius: 10, border: '1px solid #e8e8e8' }}
        bodyStyle={{ padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#1a3c6e' }}>
              <ClockCircleOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
              Bed Hold Period
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Period when students with an active contract can re-book their current bed for the next semester.
            </Text>
          </div>
          <Tag
            color={holdStatus.color}
            icon={<CheckCircleOutlined />}
            style={{ fontSize: 13, padding: '4px 12px', borderRadius: 6 }}
          >
            {holdStatus.label}
          </Tag>
        </div>

        <SectionLabel text="Date Range" />
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
            Current: {dayjs(config.hold_window.start).format('DD/MM/YYYY')} – {dayjs(config.hold_window.end).format('DD/MM/YYYY')}
          </Text>
        )}
      </Card>

      {/* ── 3. New Booking Period ── */}
      <Card
        style={{ borderRadius: 10, border: '1px solid #e8e8e8' }}
        bodyStyle={{ padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#1a3c6e' }}>
              <CalendarOutlined style={{ marginRight: 8, color: '#1a6ef5' }} />
              New Booking Period
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Period when students without an active bed can book a new room.
            </Text>
          </div>
          <Tag
            color={newStatus.color}
            icon={<CheckCircleOutlined />}
            style={{ fontSize: 13, padding: '4px 12px', borderRadius: 6 }}
          >
            {newStatus.label}
          </Tag>
        </div>

        <SectionLabel text="Date Range" />
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
            Current: {dayjs(config.new_booking_window.start).format('DD/MM/YYYY')} – {dayjs(config.new_booking_window.end).format('DD/MM/YYYY')}
          </Text>
        )}
      </Card>

      {/* ── Save ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 32 }}>
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          style={{ borderRadius: 8, minWidth: 160 }}
        >
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default DateConfigPage;
