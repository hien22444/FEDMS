import React from 'react';
import { Card, Button, Row, Col, Typography, Tag, Space, theme } from 'antd';
import {
  WifiOutlined,
  TeamOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Room {
  id: number;
  building: string;
  number: string;
  type: string;
  price: string;
  amenities: string[];
  status: string;
  residents: number;
  image: string;
}

const Booking: React.FC = () => {
  const { token } = theme.useToken();

  const rooms: Room[] = [
    {
      id: 1,
      building: 'Block A',
      number: '205',
      type: '4-bed',
      price: '800,000',
      amenities: ['WiFi', 'AC', 'Fan'],
      status: 'Current',
      residents: 3,
      image: '🏠'
    },
    {
      id: 2,
      building: 'Block B',
      number: '310',
      type: '2-bed',
      price: '600,000',
      amenities: ['WiFi', 'AC'],
      status: 'Available',
      residents: 0,
      image: '🏢'
    },
    {
      id: 3,
      building: 'Block C',
      number: '105',
      type: '6-bed',
      price: '500,000',
      amenities: ['WiFi', 'Fan', 'Locker'],
      status: 'Available',
      residents: 0,
      image: '🏘️'
    },
  ];

  const currentRoom = rooms.find(r => r.status === 'Current');
  const availableRooms = rooms.filter(r => r.status === 'Available');

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>Room Management</Title>
          <Text type="secondary">View available rooms and manage your booking</Text>
        </div>

        {/* Current Room */}
        {currentRoom && (
          <Card
            style={{
              marginBottom: '32px',
              background: `linear-gradient(135deg, ${token.colorPrimary}10 0%, ${token.colorSuccess}10 100%)`,
              borderLeft: `4px solid ${token.colorPrimary}`,
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <Title level={3} style={{ margin: 0 }}>Your Current Room</Title>
                  <Text type="secondary">{currentRoom.building} - Room {currentRoom.number}</Text>
                </div>
                <Tag color="success">Active</Tag>
              </div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={12} sm={6}>
                <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>Room Type</Text>
                <Text strong>{currentRoom.type}</Text>
              </Col>
              <Col xs={12} sm={6}>
                <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>Monthly Fee</Text>
                <Text strong>₫{currentRoom.price}</Text>
              </Col>
              <Col xs={12} sm={6}>
                <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>Roommates</Text>
                <Text strong>{currentRoom.residents} people</Text>
              </Col>
              <Col xs={12} sm={6}>
                <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>Contract Until</Text>
                <Text strong>31/08/2024</Text>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Button
                  block
                  style={{
                    borderColor: token.colorPrimary,
                    color: token.colorPrimary
                  }}
                >
                  Request Transfer
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  block
                  style={{
                    borderColor: token.colorPrimary,
                    color: token.colorPrimary
                  }}
                >
                  Extend Contract
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  block
                  danger
                >
                  Cancel Booking
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        {/* Available Rooms */}
        <Title level={3} style={{ marginBottom: '16px' }}>Available Rooms</Title>
        <Row gutter={[24, 24]} style={{ marginBottom: '48px' }}>
          {availableRooms.map((room) => (
            <Col xs={24} md={12} lg={8} key={room.id}>
              <Card
                hoverable
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '32px' }}>{room.image}</span>
                  <Tag color="success">Available</Tag>
                </div>

                <Title level={4} style={{ marginBottom: '16px' }}>
                  {room.building} - Room {room.number}
                </Title>

                <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HomeOutlined style={{ color: token.colorTextSecondary }} />
                    <Text type="secondary">{room.type}</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarOutlined style={{ color: token.colorTextSecondary }} />
                    <Text type="secondary">₫{room.price}/month</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TeamOutlined style={{ color: token.colorTextSecondary }} />
                    <Text type="secondary">{room.residents} residents</Text>
                  </div>
                </Space>

                <div style={{ marginBottom: '24px' }}>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Amenities
                  </Text>
                  <Space wrap>
                    {room.amenities.map((amenity) => (
                      <Tag key={amenity}>{amenity}</Tag>
                    ))}
                  </Space>
                </div>

                <Button
                  type="primary"
                  block
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                  style={{ marginTop: 'auto' }}
                >
                  Book Room
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Booking History */}
        <Title level={3} style={{ marginBottom: '16px' }}>Booking History</Title>
        <Card>
          {rooms.filter(r => r.status === 'Current').map((room) => (
            <div
              key={room.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: token.colorBgTextHover,
                borderRadius: token.borderRadius,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '32px' }}>{room.image}</span>
                <div>
                  <Text strong style={{ display: 'block' }}>
                    {room.building} - Room {room.number}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {room.type} • ₫{room.price}/month
                  </Text>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Tag color="success" style={{ marginBottom: '8px', display: 'block' }}>
                  {room.status}
                </Tag>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Booked 3 days ago
                </Text>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default Booking;
