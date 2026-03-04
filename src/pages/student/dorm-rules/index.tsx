import React from 'react';
import { Card, Typography, Collapse, theme } from 'antd';
import {
  BookOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  UserOutlined,
  HomeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const DormRules: React.FC = () => {
  const { token } = theme.useToken();

  const rules = [
    {
      icon: <ClockCircleOutlined style={{ fontSize: '24px', color: token.colorPrimary }} />,
      title: 'Quiet Hours',
      content: 'Maintain quiet hours from 10:00 PM to 7:00 AM. Avoid loud music, conversations, or activities that may disturb other residents.',
    },
    {
      icon: <SafetyOutlined style={{ fontSize: '24px', color: token.colorPrimary }} />,
      title: 'Safety & Security',
      content: 'Keep your room locked at all times. Do not share room keys or access cards. Report any suspicious activities to security immediately.',
    },
    {
      icon: <UserOutlined style={{ fontSize: '24px', color: token.colorPrimary }} />,
      title: 'Visitor Policy',
      content: 'All visitors must register at the front desk. Visitors are allowed from 8:00 AM to 10:00 PM only. Overnight guests are not permitted.',
    },
    {
      icon: <HomeOutlined style={{ fontSize: '24px', color: token.colorPrimary }} />,
      title: 'Room Cleanliness',
      content: 'Maintain cleanliness in your room and common areas. Participate in scheduled room inspections. Dispose of trash properly.',
    },
  ];

  const faqs = [
    {
      question: 'Can I cook in my room?',
      answer: 'No, cooking in rooms is strictly prohibited due to fire safety regulations. Please use the designated kitchen areas in common spaces.',
    },
    {
      question: 'What items are prohibited in the dormitory?',
      answer: 'Prohibited items include: electric stoves, hot plates, candles, incense, weapons, illegal drugs, alcohol, and pets (except service animals with prior approval).',
    },
    {
      question: 'Can I change rooms?',
      answer: 'Room change requests can be submitted through the Room Management page. Approval depends on room availability and valid reasons for the transfer.',
    },
    {
      question: 'What happens if I violate the rules?',
      answer: 'Violations may result in warnings, fines, or loss of housing privileges depending on severity. Serious or repeated violations may lead to expulsion from the dormitory.',
    },
    {
      question: 'When is the payment deadline?',
      answer: 'Monthly fees are due on the last day of each month. Late payments may incur additional charges. Set up automatic payments to avoid late fees.',
    },
    {
      question: 'How do I report maintenance issues?',
      answer: 'Submit maintenance requests through the Maintenance page. Emergency issues (water leaks, electrical problems) should be reported immediately to the front desk.',
    },
  ];

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>Dormitory Rules & Regulations</Title>
          <Text type="secondary">Please read and follow these guidelines to ensure a safe and comfortable living environment</Text>
        </div>

        {/* Introduction */}
        <Card style={{ marginBottom: '32px', borderLeft: `4px solid ${token.colorPrimary}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <BookOutlined style={{ fontSize: '32px', color: token.colorPrimary }} />
            <div>
              <Title level={4} style={{ marginBottom: '8px' }}>Welcome to FPT Dormitory</Title>
              <Paragraph>
                Living in a dormitory is a unique experience that requires mutual respect and cooperation.
                These rules and regulations are designed to create a harmonious living environment for all residents.
                Please familiarize yourself with these guidelines and adhere to them at all times.
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                Violations of dormitory rules may result in disciplinary action, including fines, probation,
                or termination of housing contract. If you have any questions, please contact the Housing Office.
              </Paragraph>
            </div>
          </div>
        </Card>

        {/* Main Rules */}
        <Title level={3} style={{ marginBottom: '16px' }}>Main Rules & Guidelines</Title>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          {rules.map((rule, idx) => (
            <Card
              key={idx}
              hoverable
              style={{ height: '100%' }}
            >
              <div style={{ marginBottom: '16px' }}>{rule.icon}</div>
              <Title level={4} style={{ marginBottom: '12px' }}>{rule.title}</Title>
              <Text type="secondary">{rule.content}</Text>
            </Card>
          ))}
        </div>

        {/* Additional Rules */}
        <Title level={3} style={{ marginBottom: '16px' }}>Detailed Regulations</Title>
        <Card style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <Title level={5} style={{ color: token.colorPrimary }}>Prohibited Items</Title>
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li><Text>Cooking appliances (electric stoves, hot plates, rice cookers)</Text></li>
                <li><Text>Candles, incense, and open flames</Text></li>
                <li><Text>Weapons of any kind</Text></li>
                <li><Text>Illegal drugs and alcohol</Text></li>
                <li><Text>Pets (except approved service animals)</Text></li>
                <li><Text>High-power electrical equipment</Text></li>
              </ul>
            </div>

            <div>
              <Title level={5} style={{ color: token.colorPrimary }}>Conduct Guidelines</Title>
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li><Text>Respect the rights and privacy of other residents</Text></li>
                <li><Text>No gambling, fighting, or disruptive behavior</Text></li>
                <li><Text>Comply with all fire safety regulations</Text></li>
                <li><Text>Participate in fire drills and safety training</Text></li>
                <li><Text>Report any damages or maintenance issues promptly</Text></li>
                <li><Text>No subletting or unauthorized room transfers</Text></li>
              </ul>
            </div>

            <div>
              <Title level={5} style={{ color: token.colorPrimary }}>Common Area Usage</Title>
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li><Text>Keep common areas clean and tidy</Text></li>
                <li><Text>Do not monopolize shared facilities</Text></li>
                <li><Text>Clean up after using kitchen and laundry facilities</Text></li>
                <li><Text>Report any damaged or broken equipment</Text></li>
                <li><Text>Respect quiet hours in common spaces</Text></li>
              </ul>
            </div>
          </div>
        </Card>

        {/* FAQ Section */}
        <Title level={3} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QuestionCircleOutlined />
          Frequently Asked Questions
        </Title>
        <Card>
          <Collapse
            bordered={false}
            expandIconPosition="end"
            style={{ background: 'transparent' }}
          >
            {faqs.map((faq, idx) => (
              <Panel
                header={<Text strong>{faq.question}</Text>}
                key={idx}
                style={{ marginBottom: '8px', borderRadius: token.borderRadius }}
              >
                <Text type="secondary">{faq.answer}</Text>
              </Panel>
            ))}
          </Collapse>
        </Card>

        {/* Contact Information */}
        <Card
          style={{
            marginTop: '32px',
            background: `${token.colorPrimary}10`,
            borderLeft: `4px solid ${token.colorPrimary}`,
          }}
        >
          <Title level={4} style={{ marginBottom: '16px' }}>Need Help?</Title>
          <Paragraph style={{ marginBottom: '8px' }}>
            If you have any questions or concerns about the dormitory rules, please contact:
          </Paragraph>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Text><Text strong>Housing Office:</Text> Building A, Ground Floor</Text>
            <Text><Text strong>Phone:</Text> (024) 1234 5678</Text>
            <Text><Text strong>Email:</Text> housing@fpt.edu.vn</Text>
            <Text><Text strong>Office Hours:</Text> Monday - Friday, 8:00 AM - 5:00 PM</Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DormRules;
