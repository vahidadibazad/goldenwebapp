// frontend/src/components/OnlineUsers.jsx
import React from 'react';
import { Avatar, Tooltip, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useSocket } from '../context/SocketContext';

const OnlineUsers = () => {
  const { onlineUsers } = useSocket();

  // اگر کاربر آنلاین وجود ندارد، چیزی نمایش نده
  if (!onlineUsers || onlineUsers.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* متن تعداد آنلاین */}
      <span style={{ color: '#52c41a', fontSize: '13px', fontWeight: '500' }}>
        ● {onlineUsers.length} آنلاین
      </span>

      {/* آواتار کاربران آنلاین */}
      <Avatar.Group max={{ count: 3 }} size="small">
        {onlineUsers.map((user) => (
          <Tooltip key={user.id || user._id} title={user.fullName || user.username}>
            <Badge 
              dot 
              color="#52c41a" 
              offset={[-5, 5]}
              // ✅ فقط نقطه سبز (بدون نقطه قرمز)
            >
              <Avatar 
                icon={<UserOutlined />} 
                style={{ 
                  backgroundColor: '#1677ff',
                  border: '2px solid #52c41a',
                }} 
              />
            </Badge>
          </Tooltip>
        ))}
      </Avatar.Group>
    </div>
  );
};

export default OnlineUsers;