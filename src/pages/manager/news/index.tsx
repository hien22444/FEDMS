import { useEffect, useState } from 'react';
import { connectSocket } from '@/lib/socket';
import { Button, Tag, Modal, Form, Input, Select, Switch, message, Card, Space } from 'antd';
import { FileText, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { createNews, deleteNews, fetchNews, updateNews, type News } from '@/lib/actions/news';

const categoryOptions = [
  { label: 'Announcement', value: 'announcement' },
  { label: 'Event', value: 'event' },
  { label: 'Policy', value: 'policy' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'General', value: 'general' },
];

const getCategoryLabel = (value: string) =>
  categoryOptions.find((c) => c.value === value)?.label || value || 'General';

export default function ManagerNewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingNews, setDeletingNews] = useState<News | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const loadNews = async () => {
    try {
      const res = await fetchNews({ page: 1, limit: 50 });
      setNews(res.items);
    } catch (error: any) {
      console.error(error);
      message.error('Failed to load news list');
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    socket.on('news_updated', () => {
      loadNews();
    });
    return () => {
      socket.off('news_updated');
    };
  }, []);

  const openCreateModal = () => {
    setEditingNews(null);
    setModalOpen(true);
  };

  const openEditModal = (record: News) => {
    setEditingNews(record);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen) return;

    if (editingNews) {
      form.setFieldsValue({
        title: editingNews.title,
        content: editingNews.content,
        category: editingNews.category || 'general',
        is_published: editingNews.is_published,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        category: 'general',
        is_published: true,
      });
    }
  }, [modalOpen, editingNews, form]);

  const handleDeleteClick = (record: News) => {
    setDeletingNews(record);
    setDeleteModalOpen(true);
  };

  const handleSubmitNews = async () => {
    try {
      const values = await form.validateFields();
      if (editingNews) {
        await updateNews(editingNews.id, values);
        message.success('News updated successfully');
      } else {
        await createNews(values);
        message.success('News created successfully');
      }
      setModalOpen(false);
      loadNews();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error(error);
      const errMsg = Array.isArray(error?.message)
        ? error.message.join(', ')
        : error?.message || 'Failed to save news';
      message.error(errMsg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">News Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage news & announcements for students.
          </p>
        </div>
        <Button type="primary" onClick={openCreateModal}>
          Create News
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-orange-600" />
          <div className="font-semibold text-gray-900">News List</div>
        </div>

        {news.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">No news created yet.</div>
        ) : (
          <div className="space-y-3">
            {news.map((item) => (
              <Card
                key={item.id}
                size="small"
                className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                onClick={() => navigate(`/manager/news/${item.id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{item.title}</span>
                      <Tag color="blue" className="text-xs">
                        {getCategoryLabel(item.category as string)}
                      </Tag>
                      <Tag color={item.is_published ? 'green' : 'orange'} className="text-xs">
                        {item.is_published ? 'Published' : 'Draft'}
                      </Tag>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={14} />
                        <span>
                          Published:{' '}
                          {item.published_at
                            ? dayjs(item.published_at).format('DD/MM/YYYY HH:mm')
                            : 'N/A'}
                        </span>
                      </span>
                      <span>
                        Last updated: {dayjs(item.updatedAt).format('DD/MM/YYYY HH:mm')}
                      </span>
                    </div>
                  </div>
                  <Space className="self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
                    <Button size="small" onClick={() => openEditModal(item)}>
                      Edit
                    </Button>
                    <Button size="small" danger onClick={() => handleDeleteClick(item)}>
                      Delete
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingNews ? 'Update News' : 'Create New News'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmitNews}
        okText="Save"
        cancelText="Cancel"
        destroyOnClose
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter news title' }]}
          >
            <Input placeholder="Enter news title" />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select options={categoryOptions} placeholder="Select category" />
          </Form.Item>

          <Form.Item
            label="Content"
            name="content"
            rules={[{ required: true, message: 'Please enter content' }]}
          >
            <Input.TextArea
              rows={6}
              placeholder="Write the content of the news..."
              showCount
              maxLength={5000}
            />
          </Form.Item>

          <Form.Item label="Published" name="is_published" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="Confirm Delete News"
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeletingNews(null);
        }}
        onOk={async () => {
          if (!deletingNews) return;
          try {
            await deleteNews(deletingNews.id);
            message.success('News deleted successfully');
            setDeleteModalOpen(false);
            setDeletingNews(null);
            loadNews();
          } catch (error: any) {
            console.error(error);
            const errMsg = Array.isArray(error?.message)
              ? error.message.join(', ')
              : error?.message || 'Failed to delete news';
            message.error(errMsg);
          }
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        centered
      >
        {deletingNews && (
          <div className="space-y-2">
            <p>
              Are you sure you want to delete news{' '}
              <span className="font-semibold text-red-600">"{deletingNews.title}"</span>?
            </p>
            <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
