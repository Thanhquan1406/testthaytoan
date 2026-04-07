/**
 * @fileoverview Trang quản lý môn học (Admin).
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDanhSachMonHoc, taoMonHoc, updateMonHoc, xoaMonHoc } from '../../services/adminService';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MonHoc = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ten: '', moTa: '' });
  const queryClient = useQueryClient();

  const { data: monHocs, isLoading } = useQuery({
    queryKey: ['admin-mon-hoc'],
    queryFn: getDanhSachMonHoc,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? updateMonHoc(editing._id, data) : taoMonHoc(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-mon-hoc'] }); setModalOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: xoaMonHoc,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-mon-hoc'] }),
  });

  const openCreate = () => { setEditing(null); setForm({ ten: '', moTa: '' }); setModalOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ten: m.ten, moTa: m.moTa }); setModalOpen(true); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Quản lý môn học</h1>
        <button onClick={openCreate} style={{ padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
          + Thêm môn học
        </button>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div style={{ background: '#fff', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Tên môn học', 'Mô tả', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monHocs?.map((m) => (
                <tr key={m._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{m.ten}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>{m.moTa || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEdit(m)} style={{ padding: '4px 10px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>Sửa</button>
                    <button onClick={() => confirm('Xóa môn học này?') && deleteMutation.mutate(m._id)} style={{ padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Sửa môn học' : 'Thêm môn học'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: '#fff', cursor: 'pointer' }}>Hủy</button>
            <button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending || !form.ten}
              style={{ padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
            >
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tên môn học *</label>
            <input
              type="text" value={form.ten} onChange={(e) => setForm(p => ({ ...p, ten: e.target.value }))}
              style={{ width: '100%', marginTop: '4px', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mô tả</label>
            <textarea
              value={form.moTa} onChange={(e) => setForm(p => ({ ...p, moTa: e.target.value }))} rows={3}
              style={{ width: '100%', marginTop: '4px', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MonHoc;
