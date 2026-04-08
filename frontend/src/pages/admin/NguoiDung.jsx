/**
 * @fileoverview Trang quản lý người dùng (Admin).
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDanhSachNguoiDung, getNguoiDung, updateNguoiDung, xoaNguoiDung } from '../../services/adminService';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

const VAI_TRO_COLORS = { ADMIN: '#dc2626', GIAO_VIEN: '#059669', SINH_VIEN: '#4f46e5' };
const VAI_TRO_LABEL = { ADMIN: 'Admin', GIAO_VIEN: 'Giáo viên', SINH_VIEN: 'Sinh viên' };

const emptyForm = () => ({ ho: '', ten: '', email: '', soDienThoai: '' });

const NguoiDung = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [detailLoading, setDetailLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-nguoi-dung', page, search],
    queryFn: () => getDanhSachNguoiDung({ page, limit: 10, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: xoaNguoiDung,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-nguoi-dung'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateNguoiDung(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nguoi-dung'] });
      setModalOpen(false);
      setEditingId(null);
      setFormError('');
    },
    onError: (err) => setFormError(err.message || 'Cập nhật thất bại'),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError('');
  };

  const openEdit = async (u) => {
    setEditingId(u._id);
    setFormError('');
    setModalOpen(true);
    setDetailLoading(true);
    try {
      const user = await getNguoiDung(u._id);
      setForm({
        ho: user.ho ?? '',
        ten: user.ten ?? '',
        email: user.email ?? '',
        soDienThoai: user.soDienThoai ?? '',
      });
    } catch (err) {
      setFormError(err.message || 'Không tải được thông tin người dùng');
      setForm(emptyForm());
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = () => {
    setFormError('');
    if (!editingId) return;
    if (!form.ho.trim() || !form.ten.trim() || !form.email.trim() || !form.soDienThoai.trim()) {
      setFormError('Vui lòng điền đầy đủ họ, tên, email và số điện thoại.');
      return;
    }
    updateMutation.mutate({
      id: editingId,
      payload: {
        ho: form.ho.trim(),
        ten: form.ten.trim(),
        email: form.email.trim().toLowerCase(),
        soDienThoai: form.soDienThoai.trim(),
      },
    });
  };

  const handleDelete = (id, ten) => {
    if (confirm(`Xóa người dùng "${ten}"? Hành động này không thể hoàn tác.`)) {
      deleteMutation.mutate(id);
    }
  };

  const formValid =
    form.ho.trim() && form.ten.trim() && form.email.trim() && form.soDienThoai.trim();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Quản lý người dùng</h1>
        <input
          type="text" placeholder="Tìm kiếm..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', width: '250px' }}
        />
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <>
          <div style={{ background: '#fff', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Mã', 'Họ và tên', 'Email', 'SĐT', 'Vai trò', 'Thao tác'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#6b7280' }}>{u.maNguoiDung}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{u.hoTen}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{u.soDienThoai}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                        background: `${VAI_TRO_COLORS[u.vaiTro]}20`, color: VAI_TRO_COLORS[u.vaiTro],
                      }}>
                        {VAI_TRO_LABEL[u.vaiTro]}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        style={{
                          padding: '4px 10px', background: '#dbeafe', color: '#1d4ed8',
                          border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem',
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u._id, u.hoTen)}
                        disabled={u.vaiTro === 'ADMIN'}
                        style={{
                          padding: '4px 10px', background: u.vaiTro === 'ADMIN' ? '#f3f4f6' : '#fee2e2',
                          border: 'none', borderRadius: '0.375rem', color: u.vaiTro === 'ADMIN' ? '#9ca3af' : '#dc2626',
                          cursor: u.vaiTro === 'ADMIN' ? 'not-allowed' : 'pointer', fontSize: '0.8rem',
                        }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </div>
        </>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Chỉnh sửa người dùng"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: '#fff', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending || detailLoading || !formValid}
              style={{
                padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none',
                borderRadius: '0.5rem', cursor: detailLoading || !formValid ? 'not-allowed' : 'pointer', fontWeight: 600,
                opacity: detailLoading || !formValid ? 0.6 : 1,
              }}
            >
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </>
        }
      >
        {detailLoading ? (
          <LoadingSpinner />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {formError ? (
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626' }}>{formError}</p>
            ) : null}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Họ *</label>
              <input
                type="text"
                value={form.ho}
                onChange={(e) => setForm((p) => ({ ...p, ho: e.target.value }))}
                style={{ width: '100%', marginTop: '4px', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tên *</label>
              <input
                type="text"
                value={form.ten}
                onChange={(e) => setForm((p) => ({ ...p, ten: e.target.value }))}
                style={{ width: '100%', marginTop: '4px', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                style={{ width: '100%', marginTop: '4px', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Số điện thoại *</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.soDienThoai}
                onChange={(e) => setForm((p) => ({ ...p, soDienThoai: e.target.value }))}
                style={{ width: '100%', marginTop: '4px', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NguoiDung;
