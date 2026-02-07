import { useState } from 'react';
import { Layout, Menu, Avatar, Space, Button, theme } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  CalendarOutlined,
  KeyOutlined,
  ThunderboltOutlined,
  CreditCardOutlined,
  FileSearchOutlined,
  ToolOutlined,
  AlertOutlined,
  BookOutlined,
  TeamOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts';

const { Sider, Content } = Layout;

const StudentLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  // Get user data from AuthContext
  const { user, profile, logout } = useAuth();

  const menuItems = [
    {
      key: ROUTES.STUDENT_DASHBOARD,
      icon: <HomeOutlined />,
      label: 'Trang chủ',
    },
    {
      key: ROUTES.STUDENT_NEWS,
      icon: <FileTextOutlined />,
      label: 'Tin tức',
    },
    {
      key: ROUTES.STUDENT_SCHEDULE,
      icon: <CalendarOutlined />,
      label: 'Lịch ở phòng',
    },
    {
      key: ROUTES.STUDENT_BOOKING,
      icon: <KeyOutlined />,
      label: 'Đặt phòng',
    },
    {
      key: ROUTES.STUDENT_UTILITIES,
      icon: <ThunderboltOutlined />,
      label: 'Điện nước',
    },
    {
      key: ROUTES.STUDENT_PAYMENT,
      icon: <CreditCardOutlined />,
      label: 'Thanh toán',
    },
    {
      key: ROUTES.STUDENT_REQUESTS,
      icon: <FileSearchOutlined />,
      label: 'Yêu cầu',
    },
    {
      key: ROUTES.STUDENT_MAINTENANCE,
      icon: <ToolOutlined />,
      label: 'Sửa chữa',
    },
    {
      key: ROUTES.STUDENT_CFD_POINTS,
      icon: <AlertOutlined />,
      label: 'Điểm CFD',
    },
    {
      key: ROUTES.STUDENT_GUIDELINES,
      icon: <BookOutlined />,
      label: 'Hướng dẫn',
    },
    {
      key: ROUTES.STUDENT_DORM_RULES,
      icon: <TeamOutlined />,
      label: 'Nội quy KTX FU',
    },
    {
      key: ROUTES.STUDENT_FAQ,
      icon: <QuestionCircleOutlined />,
      label: 'FAQ',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
  };

  // Get display name from profile or user email
  const displayName = profile?.full_name || profile?.student_code || user?.email?.split('@')[0] || 'Student';
  const studentCode = profile?.student_code || '';
  const behavioralScore = profile?.behavioral_score ?? 'N/A';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        style={{
          backgroundColor: token.colorPrimary,
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {!collapsed ? (
            <Space>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <EnvironmentOutlined
                  style={{ fontSize: '24px', color: 'white' }}
                />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>DOM</div>
                <div
                  style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}
                >
                  FPT Dormitory
                </div>
              </div>
            </Space>
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <EnvironmentOutlined style={{ fontSize: '24px', color: 'white' }} />
            </div>
          )}
          <Button
            type="text"
            icon={
              collapsed ? (
                <MenuUnfoldOutlined style={{ color: 'white' }} />
              ) : (
                <MenuFoldOutlined style={{ color: 'white' }} />
              )
            }
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: 'white' }}
          />
        </div>

        {/* Student Profile - Real data from AuthContext */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Space size="middle">
            <Avatar
              size={collapsed ? 32 : 40}
              src={profile?.avatar_url}
              icon={!profile?.avatar_url && <UserOutlined />}
              style={{
                border: '2px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }}
            />
            {!collapsed && (
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '12px' }}>
                  {displayName}
                </div>
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '11px',
                  }}
                >
                  {studentCode && `${studentCode} • `}CFD: {behavioralScore}
                </div>
              </div>
            )}
          </Space>
        </div>

        {/* Menu */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={handleMenuClick}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            marginTop: '16px',
          }}
          theme="dark"
          items={menuItems}
        />

        {/* Logout */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            block
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: collapsed ? 'center' : 'left',
            }}
          >
            {!collapsed && 'Đăng xuất'}
          </Button>
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;
