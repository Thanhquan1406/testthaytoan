/**
 * @fileoverview Quản lý lớp học (Giáo viên) - Danh sách + Tạo/Sửa/Xóa.
 * Click vào card lớp → navigate tới chi tiết lớp.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDanhSach, create, update, remove } from '../../services/lopHocService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

const LopHoc = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // mode: null | 'create' | 'edit'
  const [mode, setMode] = useState(null);
  const [activeLop, setActiveLop] = useState(null);
  const [ten, setTen] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: danhSachLop, isLoading } = useQuery({
    queryKey: ['gv-lop-hoc'],
    queryFn: getDanhSach,
  });

  const createMutation = useMutation({
    mutationFn: () => create({ ten: ten.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gv-lop-hoc'] });
      setMode(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => update(activeLop._id, { ten: ten.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gv-lop-hoc'] });
      setMode(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gv-lop-hoc'] });
      setConfirmDelete(null);
    },
  });

  const openCreate = () => {
    setTen('');
    setActiveLop(null);
    setMode('create');
  };

  const openEdit = (e, lop) => {
    e.stopPropagation();
    setTen(lop.ten || '');
    setActiveLop(lop);
    setMode('edit');
  };

  const closeModal = () => {
    const busy = createMutation.isPending || updateMutation.isPending;
    if (!busy) setMode(null);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;
  const isSaveDisabled = isPending || !ten.trim();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Quản lý lớp học</h1>
        <button
          type="button" onClick={openCreate}
          style={{ padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
        >
          + Tạo lớp
        </button>
      </div>

      {/* Danh sách lớp */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
        {danhSachLop?.map((l) => (
          <div
            key={l._id}
            onClick={() => navigate(`/giao-vien/lop-hoc/${l._id}`)}
            style={{
              background: 'var(--bg-surface)',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              boxShadow: 'var(--shadow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
              e.currentTarget.style.borderColor = '#c7d2fe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🏫</span>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0, flex: 1 }}>{l.ten}</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Ngày tạo: {new Date(l.thoiGianTao).toLocaleDateString('vi-VN')}
            </p>
            <p style={{ fontSize: '0.78rem', color: '#4f46e5', margin: 0, fontWeight: 500 }}>
              Nhấn để xem chi tiết →
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button" onClick={(e) => openEdit(e, l)}
                style={{ flex: 1, padding: '5px', background: '#fef9c3', color: '#854d0e', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
              >
                ✏️ Sửa tên
              </button>
              <button
                type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete(l); }}
                style={{ flex: 1, padding: '5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
              >
                🗑️ Xóa
              </button>
            </div>
          </div>
        ))}
        {!danhSachLop?.length && (
          <p style={{ color: 'var(--text-secondary)', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>Chưa có lớp học nào</p>
        )}
      </div>

      {/* ── Modal Tạo / Sửa ── */}
      <Modal
        isOpen={mode === 'create' || mode === 'edit'}
        onClose={closeModal}
        title={mode === 'edit' ? `Sửa tên lớp: ${activeLop?.ten}` : 'Tạo Lớp Học'}
        size="sm"
        footer={
          <>
            <button
              type="button" onClick={closeModal} disabled={isPending}
              style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', background: 'var(--bg-surface)', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => mode === 'edit' ? updateMutation.mutate() : createMutation.mutate()}
              disabled={isSaveDisabled}
              style={{ padding: '0.5rem 1.25rem', background: isSaveDisabled ? '#a5b4fc' : '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: isSaveDisabled ? 'not-allowed' : 'pointer', fontWeight: 600 }}
            >
              {isPending
                ? (mode === 'edit' ? 'Đang lưu...' : 'Đang tạo...')
                : mode === 'edit'
                ? 'Lưu thay đổi'
                : 'Tạo lớp'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tên lớp *</label>
            <input
              autoFocus
              type="text"
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSaveDisabled && (mode === 'edit' ? updateMutation.mutate() : createMutation.mutate())}
              placeholder="Ví dụ: Lớp Toán 10A1"
              style={{ width: '100%', marginTop: '4px', padding: '0.5rem 0.75rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', boxSizing: 'border-box' }}
            />
          </div>

          {mode === 'create' && (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              💡 Sau khi tạo lớp, bạn có thể thêm sinh viên bằng MSSV hoặc import từ file Excel trong trang chi tiết lớp.
            </p>
          )}

          {mutationError && (
            <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0, background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
              {mutationError.message}
            </p>
          )}
        </div>
      </Modal>

      {/* ── Modal Xác Nhận Xóa ── */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => !deleteMutation.isPending && setConfirmDelete(null)}
        title="Xác nhận xóa lớp"
        size="sm"
        footer={
          <>
            <button
              type="button" onClick={() => setConfirmDelete(null)} disabled={deleteMutation.isPending}
              style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', background: 'var(--bg-surface)', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(confirmDelete._id)}
              disabled={deleteMutation.isPending}
              style={{ padding: '0.5rem 1.25rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa lớp'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Bạn có chắc muốn xóa lớp <strong>{confirmDelete?.ten}</strong>?
          <br />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Hành động này không thể hoàn tác.</span>
        </p>
        {deleteMutation.isError && (
          <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.75rem', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
            {deleteMutation.error?.message}
          </p>
        )}
      </Modal>
    </div>
  );
};

export default LopHoc;
