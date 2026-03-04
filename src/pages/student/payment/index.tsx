import React from 'react';
import { Card, Button, Row, Col, Typography, Tag, Space, Alert, theme } from 'antd';
import {
  CreditCardOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Invoice {
  id: number;
  month: string;
  roomFee: string;
  electricity: string;
  water: string;
  service: string;
  total: string;
  status: string;
  dueDate: string;
  paidDate?: string;
}

const Payment: React.FC = () => {
  const { token } = theme.useToken();

  const invoices: Invoice[] = [
    {
      id: 1,
      month: 'December 2024',
      roomFee: '800,000',
      electricity: '50,000',
      water: '30,000',
      service: '20,000',
      total: '900,000',
      status: 'Unpaid',
      dueDate: '31/12/2024'
    },
    {
      id: 2,
      month: 'November 2024',
      roomFee: '800,000',
      electricity: '45,000',
      water: '25,000',
      service: '20,000',
      total: '890,000',
      status: 'Unpaid',
      dueDate: '30/11/2024'
    },
    {
      id: 3,
      month: 'October 2024',
      roomFee: '800,000',
      electricity: '48,000',
      water: '28,000',
      service: '20,000',
      total: '896,000',
      status: 'Paid',
      dueDate: '31/10/2024',
      paidDate: '25/10/2024'
    },
  ];

  const paymentMethods = [
    { name: 'VNPay', icon: '💳', description: 'Pay with debit/credit card' },
    { name: 'Momo', icon: '📱', description: 'Mobile wallet payment' },
    { name: 'Bank Transfer', icon: '🏦', description: 'Direct bank transfer' },
  ];

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>Payments</Title>
          <Text type="secondary">View and manage your invoices and payments</Text>
        </div>

        {/* Summary Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} md={8}>
            <Card style={{ borderLeft: `4px solid ${token.colorError}` }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                Amount Due
              </Text>
              <Title level={2} style={{ color: token.colorError, margin: '0 0 8px 0' }}>
                ₫1,790,000
              </Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>2 unpaid invoices</Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card style={{ borderLeft: `4px solid ${token.colorSuccess}` }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                Paid This Month
              </Text>
              <Title level={2} style={{ color: token.colorSuccess, margin: '0 0 8px 0' }}>
                ₫896,000
              </Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>On 25/10/2024</Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card style={{ borderLeft: `4px solid ${token.colorPrimary}` }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                Next Due Date
              </Text>
              <Title level={2} style={{ color: token.colorPrimary, margin: '0 0 8px 0' }}>
                31/12/2024
              </Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>5 days remaining</Text>
            </Card>
          </Col>
        </Row>

        {/* Quick Pay Alert */}
        <Alert
          message="Unpaid Invoices Reminder"
          description={
            <div>
              <Text style={{ display: 'block', marginBottom: '16px' }}>
                You have 2 unpaid invoices. Please pay within the due date to avoid penalties.
              </Text>
              <Space>
                <Button
                  danger
                  type="primary"
                  icon={<CreditCardOutlined />}
                >
                  Pay Now
                </Button>
                <Button>View Details</Button>
              </Space>
            </div>
          }
          type="error"
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '32px' }}
          showIcon
        />

        {/* Invoices List */}
        <Title level={3} style={{ marginBottom: '16px' }}>Invoice History</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <div style={{ marginBottom: '16px' }}>
                <Row align="middle" justify="space-between" gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Title level={4} style={{ margin: 0 }}>{invoice.month}</Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>Due: {invoice.dueDate}</Text>
                  </Col>
                  <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
                      <div>
                        <Text type="secondary" style={{ display: 'block', fontSize: '14px' }}>
                          Total Amount
                        </Text>
                        <Title level={3} style={{ margin: 0 }}>₫{invoice.total}</Title>
                      </div>
                      <Tag
                        color={invoice.status === 'Paid' ? 'success' : 'error'}
                        style={{ margin: 0 }}
                      >
                        {invoice.status}
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </div>

              <Row
                gutter={[16, 16]}
                style={{
                  padding: '16px',
                  background: token.colorBgTextHover,
                  borderRadius: token.borderRadius,
                  marginBottom: '16px',
                }}
              >
                <Col xs={12} sm={6}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Room Fee
                  </Text>
                  <Text strong>₫{invoice.roomFee}</Text>
                </Col>
                <Col xs={12} sm={6}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Electricity
                  </Text>
                  <Text strong>₫{invoice.electricity}</Text>
                </Col>
                <Col xs={12} sm={6}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Water
                  </Text>
                  <Text strong>₫{invoice.water}</Text>
                </Col>
                <Col xs={12} sm={6}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Service
                  </Text>
                  <Text strong>₫{invoice.service}</Text>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                {invoice.status === 'Unpaid' ? (
                  <>
                    <Col xs={24} sm={12}>
                      <Button type="primary" block size="large">
                        Pay Invoice
                      </Button>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Button block size="large">
                        View Details
                      </Button>
                    </Col>
                  </>
                ) : (
                  <>
                    <Col xs={24} sm={12}>
                      <Button
                        icon={<DownloadOutlined />}
                        block
                        size="large"
                        style={{
                          borderColor: token.colorSuccess,
                          color: token.colorSuccess,
                        }}
                      >
                        Download Receipt
                      </Button>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          background: `${token.colorSuccess}10`,
                          borderRadius: token.borderRadius,
                        }}
                      >
                        <CheckCircleOutlined style={{ fontSize: '20px', color: token.colorSuccess }} />
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                            Paid on
                          </Text>
                          <Text strong>{invoice.paidDate}</Text>
                        </div>
                      </div>
                    </Col>
                  </>
                )}
              </Row>
            </Card>
          ))}
        </div>

        {/* Payment Methods */}
        <Title level={3} style={{ marginBottom: '16px' }}>Payment Methods</Title>
        <Row gutter={[24, 24]}>
          {paymentMethods.map((method) => (
            <Col xs={24} md={8} key={method.name}>
              <Card hoverable style={{ height: '100%' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{method.icon}</div>
                <Title level={4} style={{ marginBottom: '8px' }}>{method.name}</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                  {method.description}
                </Text>
                <Button
                  block
                  style={{
                    borderColor: token.colorPrimary,
                    color: token.colorPrimary,
                  }}
                >
                  Pay with {method.name}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Payment;
