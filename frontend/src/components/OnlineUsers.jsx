import { useSocket } from '../context/SocketContext';
import { Avatar, Badge, Tooltip, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';

function OnlineUsers() {
  const { onlineUsers } = useSocket();

  if (onlineUsers.length === 0) return null;

  return (
    <Space size="small" style={{ padding: '8px 12px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        آنلاین:
      </span>
      {onlineUsers.map((user) => (
        <Tooltip key={user.userId} title={user.fullName || user.username}>
          <Badge dot status="success" offset={[-2, 2]}>
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{ 
                width: 24, 
                height: 24, 
                fontSize: 12,
                background: '#52c41a',
              }}
            >
              {user.fullName?.charAt(0) || user.username?.charAt(0)}
            </Avatar>
          </Badge>
        </Tooltip>
      ))}
    </Space>
  );
}

export default OnlineUsers;