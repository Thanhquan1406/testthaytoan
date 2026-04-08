/**
 * @fileoverview Quản lý lớp học (Giáo viên).
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDanhSach, getById, create, update, remove, getSinhVien } from '../../services/lopHocService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

/* ─── Student Picker sub-component ─── */
const StudentPicker = ({ selectedSVs, setSelectedSVs }) => {
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['sv-search', debounced],
    queryFn: () => getSinhVien(debounced),
    staleTime: 30_000,
  });

  const isSelected = (id) => selectedSVs.some((s) => s._id === id);

  const toggle = (sv) =>
    setSelectedSVs((prev) =>
      isSelected(sv._id) ? prev.filter((s) => s._id !== sv._id) : [...prev, sv]
    );

  const remove_ = (id) => setSelectedSVs((prev) => prev.filter((s) => s._id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          Thêm Sinh Viên
          <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '4px' }}>(tuỳ chọn)</span>
        </label>
        {selectedSVs.length > 0 && (
          <span style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>
            Đã chọn: {selectedSVs.length}
          </span>
        )}
      </div>

      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên, email, mã sinh viên..."
          style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxSizing: 'border-box', fontSize: '0.875rem' }}
        />
        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>🔍</span>
        {isFetching && (
          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#9ca3af' }}>Đang tìm...</span>
        )}
      </div>

      {/* Results */}
      <div style={{ maxHeight: '190px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#fff' }}>
        {isFetching && results.length === 0 ? (
          <p style={{ margin: 0, padding: '0.75rem 1rem', color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center' }}>
            Đang tải danh sách sinh viên...
          </p>
        ) : results.length === 0 ? (
          <p style={{ margin: 0, padding: '0.75rem 1rem', color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center' }}>
            Không tìm thấy sinh viên phù hợp
          </p>
        ) : (
          results.map((sv) => {
            const sel = isSelected(sv._id);
            return (
              <label
                key={sv._id}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 1rem', cursor: 'pointer', background: sel ? '#ede9fe' : 'transparent', borderBottom: '1px solid #f3f4f6' }}
              >
                <input
                  type="checkbox" checked={sel} onChange={() => toggle(sv)}
                  style={{ width: '15px', height: '15px', cursor: 'pointer', flexShrink: 0, accentColor: '#4f46e5' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', color: sel ? '#4338ca' : '#111827' }}>
                    {sv.ho} {sv.ten}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sv.maNguoiDung} • {sv.email}
                  </div>
                </div>
                {sel && <span style={{ color: '#4f46e5', fontSize: '0.875rem' }}>✓</span>}
              </label>
            );
          })
        )}
      </div>

      {/* Selected chips */}
      {selectedSVs.length > 0 && (
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#374151', margin: '0 0 5px' }}>
            Sinh viên trong lớp ({selectedSVs.length}):
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {selectedSVs.map((sv) => (
              <span key={sv._id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ede9fe', color: '#4338ca', fontSize: '0.78rem', fontWeight: 500, padding: '3px 8px', borderRadius: '9999px' }}>
                {sv.ho} {sv.ten}
                <button
                  type="button" onClick={() => remove_(sv._id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontWeight: 700, padding: 0, lineHeight: 1, fontSize: '0.875rem' }}
                  aria-label={`Xóa ${sv.ten}`}
                >×</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main component ─── */
const LopHoc = () => {
  const queryClient = useQueryClient();

  // mode: null | 'create' | 'edit' | 'detail'
  const [mode, setMode] = useState(null);
  const [activeLop, setActiveLop] = useState(null);
  const [ten, setTen] = useState('');
  const [selectedSVs, setSelectedSVs] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // lop obj

  const { data: danhSachLop, isLoading } = useQuery({
    queryKey: ['gv-lop-hoc'],
    queryFn: getDanhSach,
  });

  // Lấy chi tiết lớp khi edit/detail
  const { data: lopDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['gv-lop-hoc-detail', activeLop?._id],
    queryFn: () => getById(activeLop._id),
    enabled: !!activeLop?._id && (mode === 'edit' || mode === 'detail'),
  });

  // Khi detail load xong và đang ở mode edit → populate form
  useEffect(() => {
    if (mode === 'edit' && lopDetail) {
      setTen(lopDetail.ten || '');
      setSelectedSVs(
        (lopDetail.sinhVienIds || []).map((sv) => ({
          _id: sv._id,
          ho: sv.ho,
          ten: sv.ten,
          email: sv.email,
          maNguoiDung: sv.maNguoiDung,
        }))
      );
    }
  }, [lopDetail, mode]);

  const createMutation = useMutation({
    mutationFn: () => create({ ten: ten.trim(), sinhVienIds: selectedSVs.map((s) => s._id) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gv-lop-hoc'] });
      setMode(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => update(activeLop._id, { ten: ten.trim(), sinhVienIds: selectedSVs.map((s) => s._id) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gv-lop-hoc'] });
      queryClient.invalidateQueries({ queryKey: ['gv-lop-hoc-detail', activeLop._id] });
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
    setSelectedSVs([]);
    setActiveLop(null);
    setMode('create');
  };

  const openEdit = (lop) => {
    setTen('');
    setSelectedSVs([]);
    setActiveLop(lop);
    setMode('edit');
  };

  const openDetail = (lop) => {
    setActiveLop(lop);
    setMode('detail');
  };

  const closeModal = () => {
    const busy = createMutation.isPending || updateMutation.isPending;
    if (!busy) setMode(null);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  const isSaveDisabled = isPending || !ten.trim() || (mode === 'edit' && loadingDetail);

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
          <div key={l._id} style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{l.ten}</h3>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
              Ngày tạo: {new Date(l.thoiGianTao).toLocaleDateString('vi-VN')}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button" onClick={() => openDetail(l)}
                style={{ flex: 1, padding: '5px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
              >
                Chi tiết
              </button>
              <button
                type="button" onClick={() => openEdit(l)}
                style={{ flex: 1, padding: '5px', background: '#fef9c3', color: '#854d0e', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
              >
                Sửa
              </button>
              <button
                type="button" onClick={() => setConfirmDelete(l)}
                style={{ flex: 1, padding: '5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
        {!danhSachLop?.length && (
          <p style={{ color: '#9ca3af', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>Chưa có lớp học nào</p>
        )}
      </div>

      {/* ── Modal Tạo / Sửa ── */}
      <Modal
        isOpen={mode === 'create' || mode === 'edit'}
        onClose={closeModal}
        title={mode === 'edit' ? `Sửa lớp: ${activeLop?.ten}` : 'Tạo Lớp Học'}
        size="md"
        footer={
          <>
            <button
              type="button" onClick={closeModal} disabled={isPending}
              style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: '#fff', cursor: 'pointer' }}
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
                : `Tạo lớp${selectedSVs.length ? ` (${selectedSVs.length} SV)` : ''}`}
            </button>
          </>
        }
      >
        {mode === 'edit' && loadingDetail ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Đang tải dữ liệu lớp...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tên lớp *</label>
              <input
                autoFocus
                type="text" value={ten} onChange={(e) => setTen(e.target.value)}
                placeholder="Ví dụ: Lớp Toán 10A1"
                style={{ width: '100%', marginTop: '4px', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxSizing: 'border-box' }}
              />
            </div>

            <StudentPicker selectedSVs={selectedSVs} setSelectedSVs={setSelectedSVs} />

            {mutationError && (
              <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0, background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
                {mutationError.message}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* ── Modal Chi Tiết ── */}
      <Modal
        isOpen={mode === 'detail'}
        onClose={() => setMode(null)}
        title={`Chi tiết lớp: ${activeLop?.ten}`}
        size="md"
        footer={
          <button
            type="button" onClick={() => setMode(null)}
            style={{ padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Đóng
          </button>
        }
      >
        {loadingDetail ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Đang tải...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: '#f9fafb', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Tên lớp</div>
                <div style={{ fontWeight: 600 }}>{lopDetail?.ten}</div>
              </div>
              <div style={{ background: '#f9fafb', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Số sinh viên</div>
                <div style={{ fontWeight: 600 }}>{lopDetail?.sinhVienIds?.length ?? 0}</div>
              </div>
              <div style={{ background: '#f9fafb', padding: '0.75rem 1rem', borderRadius: '0.5rem', gridColumn: '1/-1' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>Ngày tạo</div>
                <div style={{ fontWeight: 600 }}>
                  {lopDetail?.thoiGianTao ? new Date(lopDetail.thoiGianTao).toLocaleDateString('vi-VN') : '—'}
                </div>
              </div>
            </div>

            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 8px', color: '#374151' }}>
                Danh sách sinh viên ({lopDetail?.sinhVienIds?.length ?? 0})
              </p>
              {!lopDetail?.sinhVienIds?.length ? (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>Chưa có sinh viên nào trong lớp</p>
              ) : (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['#', 'Họ tên', 'Mã SV', 'Email'].map((h) => (
                          <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lopDetail.sinhVienIds.map((sv, i) => (
                        <tr key={sv._id} style={{ borderTop: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.6rem 0.75rem', color: '#9ca3af' }}>{i + 1}</td>
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500 }}>{sv.ho} {sv.ten}</td>
                          <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280' }}>{sv.maNguoiDung}</td>
                          <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280' }}>{sv.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
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
              style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: '#fff', cursor: 'pointer' }}
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
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Hành động này không thể hoàn tác.</span>
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
