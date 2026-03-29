import { useEffect, useState } from 'react';
import { Card, Typography, Table, Tag, Spin, Empty, theme } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { getMyEWUsages, type MyEWRecord } from '@/lib/actions/ewUsage';

const { Title, Text } = Typography;

const Utilities = () => {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(true);
  const [blockName, setBlockName] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [records, setRecords] = useState<MyEWRecord[]>([]);
  const [noRoom, setNoRoom] = useState(false);

  useEffect(() => {
    getMyEWUsages()
      .then((res) => {
        setBlockName(res.block_name);
        setRoomNumber(res.room_number);
        setRecords(res.data);
        if (!res.block_name) setNoRoom(true);
      })
      .catch(() => setNoRoom(true))
      .finally(() => setLoading(false));
  }, []);

  const totalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0);
  const latest = records[0];

  const columns = [
    {
      title: 'Học kỳ',
      dataIndex: 'term',
      key: 'term',
    },
    {
      title: 'Ngày ghi',
      dataIndex: 'date',
      key: 'date',
      render: (d: string) => new Date(d).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Chỉ số cũ',
      dataIndex: 'meter_left',
      key: 'meter_left',
      render: (v: number) => `${v} kW`,
    },
    {
      title: 'Chỉ số mới',
      dataIndex: 'meter_right',
      key: 'meter_right',
      render: (v: number) => `${v} kW`,
    },
    {
      title: 'Tiêu thụ',
      dataIndex: 'consumption',
      key: 'consumption',
      render: (v: number) => <Tag color="orange">{v} kW</Tag>,
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price_per_unit',
      key: 'price_per_unit',
      render: (v: number) => `${v.toLocaleString('vi-VN')} đ/kW`,
    },
    {
      title: 'Số giường',
      dataIndex: 'occupied_beds',
      key: 'occupied_beds',
      render: (v: number) => `${v} giường`,
    },
    {
      title: 'Phần của bạn',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => (
        <Text strong style={{ color: token.colorError }}>
          {v.toLocaleString('vi-VN')} đ
        </Text>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 32, background: token.colorBgLayout }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 4 }}>Electric Usage</Title>
          {blockName && (
            <Text type="secondary">
              Block <b>{blockName}</b>{roomNumber ? ` — Phòng ${roomNumber}` : ''}
            </Text>
          )}
        </div>

        {noRoom ? (
          <Card>
            <Empty description="Bạn chưa được xếp phòng hoặc chưa có dữ liệu điện" />
          </Card>
        ) : (
          <>
            {/* Summary card */}
            <Card style={{ marginBottom: 24, borderLeft: `4px solid #faad14` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{
                  width: 64, height: 64, background: '#fffbe6', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ThunderboltOutlined style={{ fontSize: 32, color: '#faad14' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary">Kỳ gần nhất</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    {latest ? `${latest.consumption} kW` : '—'}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{latest?.term}</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary">Số tiền kỳ gần nhất</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, color: token.colorError, marginTop: 4 }}>
                    {latest ? latest.amount.toLocaleString('vi-VN') + ' đ' : '—'}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Tổng tất cả kỳ: <b>{totalAmount.toLocaleString('vi-VN')} đ</b>
                  </Text>
                </div>
              </div>
            </Card>

            {/* History table */}
            <Card title="Lịch sử điện theo học kỳ">
              <Table
                rowKey="id"
                columns={columns}
                dataSource={records}
                pagination={false}
                size="middle"
                locale={{ emptyText: 'Chưa có dữ liệu điện' }}
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Utilities;
