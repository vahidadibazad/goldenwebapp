import { useState } from 'react';
import { Input, Card, List, Tag, Typography, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title } = Typography;

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/search/global?q=${query}`);
      setResults(res.data.data);
    } catch (error) {
      console.error('خطا در جستجو:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <Title level={3}>🔍 جستجوی هوشمند در کل سیستم</Title>
      <Input.Search
        placeholder="مثلاً: قرارداد سرور، فاکتور لپ‌تاپ، ..."
        size="large"
        enterButton={<SearchOutlined />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        style={{ maxWidth: 600, marginBottom: 20 }}
      />

      <Spin spinning={loading}>
        <List
          dataSource={results}
          renderItem={(item) => (
            <List.Item>
              <Card style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{item.title || item.name}</strong>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {item.description || item.serialNumber || item.systemName}
                    </div>
                  </div>
                  <div>
                    {item.category && <Tag color="blue">{item.category}</Tag>}
                    <Tag color="green">امتیاز: {item.score}</Tag>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
          locale={{ emptyText: 'نتیجه‌ای یافت نشد' }}
        />
      </Spin>
    </div>
  );
}

export default GlobalSearch;