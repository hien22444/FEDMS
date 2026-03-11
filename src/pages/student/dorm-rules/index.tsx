import React, { useState } from 'react';
import { Alert, Button, Card, Input, List, Space, Tag, Typography, theme } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { queryDormRules } from '@/lib/actions';
import type { DormRuleQueryResponse } from '@/lib/actions';

const { Title, Text, Paragraph } = Typography;

const quickQuestions = [
  'What time does the dorm close?',
  'Can my friend stay overnight?',
  'Can I cook in my dorm room?',
  'Can I keep a cat in the dorm?',
  'What electrical devices can I bring?',
];

const DormRules: React.FC = () => {
  const { token } = theme.useToken();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DormRuleQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (q?: string) => {
    const currentQuestion = (q ?? question).trim();
    if (!currentQuestion) return;

    setLoading(true);
    setError(null);

    try {
      const response = await queryDormRules(currentQuestion);
      setResult(response);
      if (!q) setQuestion('');
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message?: string }).message || 'Failed to query dormitory rules')
          : 'Failed to query dormitory rules';
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <Title level={2} style={{ marginBottom: 8 }}>Dormitory Rules Assistant</Title>
          <Text type="secondary">
            Ask any question about dormitory regulations. Answers are generated from official rules only.
          </Text>
        </div>

        <Card style={{ marginBottom: 24 }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              size="large"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Example: Can I come back after 10PM?"
              onPressEnter={() => handleAsk()}
            />
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              loading={loading}
              onClick={() => handleAsk()}
            >
              Ask
            </Button>
          </Space.Compact>
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Quick questions:</Text>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {quickQuestions.map((item) => (
                <Button key={item} size="small" onClick={() => handleAsk(item)}>
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {error && (
          <Alert
            type="error"
            showIcon
            message="Could not get answer"
            description={error}
            style={{ marginBottom: 16 }}
          />
        )}

        {result && (
          <>
            <Card style={{ marginBottom: 16 }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text strong>Assistant answer</Text>
                  <Tag color={result.confidence === 'high' ? 'success' : result.confidence === 'medium' ? 'warning' : 'default'}>
                    Confidence: {result.confidence}
                  </Tag>
                </div>
                <Paragraph style={{ marginBottom: 0 }}>{result.answer}</Paragraph>
              </Space>
            </Card>

            <Card title="Matched Rules" style={{ marginBottom: 16 }}>
              <List
                dataSource={result.matched_rules}
                locale={{ emptyText: 'No matching rules found' }}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <Space style={{ marginBottom: 6 }}>
                        <Tag color="blue">{item.id}</Tag>
                        <Tag>{item.category}</Tag>
                        <Text type="secondary">Score: {item.score}</Text>
                      </Space>
                      <Text strong>{item.title}</Text>
                      <Paragraph style={{ marginBottom: 6, marginTop: 6 }}>{item.rule}</Paragraph>
                      {item.details && <Paragraph type="secondary" style={{ marginBottom: 6 }}>{item.details}</Paragraph>}
                      {item.penalty?.fine_vnd && (
                        <Text type="danger">Penalty fine: {new Intl.NumberFormat('vi-VN').format(item.penalty.fine_vnd)} VND</Text>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            <Card size="small">
              <Text type="secondary">
                Source: {result.source.source} | Issued date: {result.source.issued_date} | Version: {result.source.version}
              </Text>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default DormRules;
