import React from 'react';
import { Card, Row, Col, Typography, Progress, theme } from 'antd';
import {
  ExclamationCircleOutlined,
  RiseOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const CFDPoints: React.FC = () => {
  const { token } = theme.useToken();

  const violations = [
    { title: 'Vi Phạm Âm Thanh', description: 'Tiếng ồn sau giờ im lặng', date: '15/11/2024', points: '-0.5' },
    { title: 'Không Giữ Vệ Sinh', description: 'Phòng không sạch sẽ', date: '10/10/2024', points: '-1.0' },
    { title: 'Đem Vật Cấm', description: 'Giấu bình nóng lạnh', date: '05/09/2024', points: '-0.75' }
  ];

  const rewards = [
    { title: 'Tham Gia Hoạt Động Tập Thể', description: 'Khoá đào tạo kỹ năng sống', date: '20/12/2024', points: '+0.5' },
    { title: 'Giữ Vệ Sinh Xuất Sắc', description: 'Phòng đạt tiêu chuẩn sạch sẽ 3 tháng liên tiếp', date: '15/12/2024', points: '+1.0' },
    { title: 'Tình Nguyện Viên', description: 'Tham gia sinh hoạt tình nguyện', date: '10/11/2024', points: '+0.75' },
    { title: 'Học Sinh Giỏi', description: 'Đạt danh hiệu học sinh giỏi', date: '05/10/2024', points: '+1.5' }
  ];

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>Điểm CFD</Title>
          <Text type="secondary">Quản lý và theo dõi điểm rèn luyện của bạn</Text>
        </div>

        {/* Score Display */}
        <Card
          style={{
            marginBottom: '32px',
            background: `linear-gradient(135deg, ${token.colorPrimary}10 0%, ${token.colorSuccess}10 100%)`,
            borderLeft: `4px solid ${token.colorPrimary}`,
            textAlign: 'center',
          }}
        >
          <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', fontWeight: 600 }}>
            Điểm CFD Hiện Tại
          </Text>
          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
            <span style={{ fontSize: '96px', fontWeight: 'bold', color: token.colorPrimary, lineHeight: 1 }}>
              8.5
            </span>
            <span style={{ fontSize: '36px', color: token.colorPrimary, marginLeft: '8px' }}>
              /10
            </span>
          </div>
          <Progress
            percent={85}
            showInfo={false}
            strokeColor={token.colorPrimary}
            style={{ maxWidth: '400px', margin: '0 auto 24px' }}
          />
          <Text style={{ fontSize: '18px', color: token.colorSuccess, fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Điểm Tốt
          </Text>
          <Text type="secondary">Bạn đang duy trì đủ điểm rèn luyện</Text>
        </Card>

        {/* Score Breakdown */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} md={8}>
            <Card style={{ borderLeft: `4px solid ${token.colorSuccess}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                    Hạng Đạo Đức
                  </Text>
                  <Title level={3} style={{ color: token.colorSuccess, margin: 0 }}>
                    ⭐ Khá
                  </Title>
                </div>
                <TrophyOutlined style={{ fontSize: '32px', color: token.colorSuccess, opacity: 0.5 }} />
              </div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '16px' }}>
                Hạng học kỳ hiện tại
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card style={{ borderLeft: `4px solid ${token.colorPrimary}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                    Lần Vi Phạm
                  </Text>
                  <Title level={3} style={{ color: token.colorPrimary, margin: 0 }}>
                    1/3
                  </Title>
                </div>
                <ExclamationCircleOutlined style={{ fontSize: '32px', color: token.colorPrimary, opacity: 0.5 }} />
              </div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '16px' }}>
                Bạn vẫn trong tình trạng tốt
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card style={{ borderLeft: `4px solid ${token.colorText}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                    Cập Nhật Lần Cuối
                  </Text>
                  <Title level={3} style={{ margin: 0 }}>
                    Hôm nay
                  </Title>
                </div>
                <RiseOutlined style={{ fontSize: '32px', color: token.colorText, opacity: 0.5 }} />
              </div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '16px' }}>
                Cập nhật thường xuyên
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Deducted Points */}
        <Title level={3} style={{ marginBottom: '16px' }}>Điểm Bị Trừ</Title>
        <Card style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {violations.map((violation, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: `${token.colorError}10`,
                  borderRadius: token.borderRadius,
                  borderLeft: `4px solid ${token.colorError}`,
                }}
              >
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                    {violation.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {violation.description}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    {violation.date}
                  </Text>
                  <Text strong style={{ color: token.colorError, fontSize: '14px' }}>
                    {violation.points} điểm
                  </Text>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: `1px solid ${token.colorBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text strong>Tổng điểm bị trừ</Text>
            <Title level={4} style={{ color: token.colorError, margin: 0 }}>
              -2.25 điểm
            </Title>
          </div>
        </Card>

        {/* Earned Points */}
        <Title level={3} style={{ marginBottom: '16px' }}>Điểm Cộng Thêm</Title>
        <Card style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rewards.map((reward, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: `${token.colorSuccess}10`,
                  borderRadius: token.borderRadius,
                  borderLeft: `4px solid ${token.colorSuccess}`,
                }}
              >
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                    {reward.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {reward.description}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    {reward.date}
                  </Text>
                  <Text strong style={{ color: token.colorSuccess, fontSize: '14px' }}>
                    {reward.points} điểm
                  </Text>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: `1px solid ${token.colorBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text strong>Tổng điểm cộng</Text>
            <Title level={4} style={{ color: token.colorSuccess, margin: 0 }}>
              +3.75 điểm
            </Title>
          </div>
        </Card>

        {/* Score Factors */}
        <Title level={3} style={{ marginBottom: '16px' }}>Các Yếu Tố Ảnh Hưởng Điểm CFD</Title>
        <Card style={{ marginBottom: '32px' }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <div
                style={{
                  padding: '16px',
                  background: token.colorBgTextHover,
                  borderRadius: token.borderRadius,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircleOutlined style={{ fontSize: '20px', color: token.colorSuccess }} />
                  <Text strong>Vệ Sinh Phòng</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Progress
                    percent={90}
                    showInfo={false}
                    strokeColor={token.colorSuccess}
                    style={{ flex: 1 }}
                  />
                  <Text strong style={{ fontSize: '14px' }}>9/10</Text>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Luôn giữ phòng sạch sẽ
                </Text>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div
                style={{
                  padding: '16px',
                  background: token.colorBgTextHover,
                  borderRadius: token.borderRadius,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircleOutlined style={{ fontSize: '20px', color: token.colorSuccess }} />
                  <Text strong>Tuân Thủ Nội Quy</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Progress
                    percent={85}
                    showInfo={false}
                    strokeColor={token.colorSuccess}
                    style={{ flex: 1 }}
                  />
                  <Text strong style={{ fontSize: '14px' }}>8.5/10</Text>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Chủ yếu tuân thủ quy định
                </Text>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div
                style={{
                  padding: '16px',
                  background: token.colorBgTextHover,
                  borderRadius: token.borderRadius,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircleOutlined style={{ fontSize: '20px', color: token.colorSuccess }} />
                  <Text strong>Tham Gia Hoạt Động</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Progress
                    percent={80}
                    showInfo={false}
                    strokeColor={token.colorSuccess}
                    style={{ flex: 1 }}
                  />
                  <Text strong style={{ fontSize: '14px' }}>8/10</Text>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Tham gia một số hoạt động
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Tips for Improvement */}
        <Card
          style={{
            background: `${token.colorSuccess}10`,
            borderLeft: `4px solid ${token.colorSuccess}`,
          }}
        >
          <Title level={4} style={{ marginBottom: '16px' }}>Cách Nâng Cao Điểm CFD</Title>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <Text>Luôn tuân thủ nội quy ký túc xá</Text>
            </li>
            <li>
              <Text>Giữ vệ sinh phòng và khu vực chung</Text>
            </li>
            <li>
              <Text>Tham gia các hoạt động tập thể</Text>
            </li>
            <li>
              <Text>Tích cực giúp đỡ sinh viên khác</Text>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default CFDPoints;
