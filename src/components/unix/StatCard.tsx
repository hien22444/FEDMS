import { Card, theme } from 'antd';
import type { FC } from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'success' | 'info';
}

export const StatCard: FC<StatCardProps> = ({
  icon,
  label,
  value,
  change,
  changeType,
}) => {
  const { token } = theme.useToken();

  const getColors = () => {
    switch (changeType) {
      case 'positive':
        return {
          bg: '#fef9c3', // yellow-100
          iconBg: '#fde047', // yellow-300
          changeColor: '#ea580c', // orange-600
        };
      case 'negative':
        return {
          bg: '#dbeafe', // blue-100
          iconBg: '#93c5fd', // blue-300
          changeColor: '#dc2626', // red-600
        };
      case 'success':
        return {
          bg: '#dcfce7', // green-100
          iconBg: '#86efac', // green-300
          changeColor: '#16a34a', // green-600
        };
      case 'info':
        return {
          bg: '#ffedd5', // orange-100
          iconBg: '#fdba74', // orange-300
          changeColor: '#6b7280', // gray-600
        };
      default:
        return {
          bg: '#f3f4f6', // gray-100
          iconBg: '#d1d5db', // gray-300
          changeColor: '#6b7280', // gray-500
        };
    }
  };

  const colors = getColors();

  return (
    <Card
      bordered
      style={{
        backgroundColor: colors.bg,
        borderRadius: '8px',
        borderColor: token.colorBorder,
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: colors.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          marginBottom: '16px',
        }}
      >
        {icon}
      </div>
      <p
        style={{
          fontSize: '14px',
          color: token.colorTextSecondary,
          marginBottom: '4px',
        }}
      >
        {label}
      </p>
      <h3
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '8px',
          marginTop: 0,
          color: token.colorText,
        }}
      >
        {value}
      </h3>
      <p
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: colors.changeColor,
          margin: 0,
        }}
      >
        {change}
      </p>
    </Card>
  );
};
