/**
 * @fileoverview Chi tiết lớp học (Giáo viên) - 3 tab: Danh sách SV, Đề thi, Bảng điểm.
 */
import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getById,
  timSinhVien,
  themSinhVien,
  xoaSinhVien,
  importSinhVienExcel,
  getDeThiCuaLop,
  getBangDiem,
} from '../../services/lopHocService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

const TABS = [
  { key: 'sinh-vien', label: 'Danh sách sinh viên', icon: '👨‍🎓' },
  { key: 'de-thi', label: 'Đề thi', icon: '📄' },
  { key: 'bang-diem', label: 'Bảng điểm', icon: '📊' },
];

/* ─── Tab styles ─── */
const tabBarStyle = {
  display: 'flex',
  gap: '0',
  borderBottom: '2px solid var(--border-default)',
  marginBottom: '1.5rem',
  background: 'var(--bg-surface)',
  borderRadius: '0.75rem 0.75rem 0 0',
  overflow: 'hidden',
};

const tabStyle = (active) => ({
  padding: '0.85rem 1.5rem',
  border: 'none',
  background: active ? 'var(--bg-surface)' : 'transparent',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: active ? 700 : 500,
  color: active ? '#4f46e5' : 'var(--text-secondary)',
  borderBottom: active ? '3px solid #4f46e5' : '3px solid transparent',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  whiteSpace: 'nowrap',
});

/* ─── Shared Styles ─── */
const cardStyle = {
  background: 'var(--bg-surface)',
  borderRadius: '0.75rem',
  border: '1px solid var(--border-default)',
  overflow: 'hidden',
};

const thStyle = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
};

const btnPrimary = {
  padding: '0.5rem 1.25rem',
  background: '#4f46e5',
  color: '#fff',
  border: 'none',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.875rem',
  transition: 'background 0.15s',
};

/* ─── Form field style ─── */
const inputStyle = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  border: '1px solid var(--border-default)',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
  background: 'var(--bg-surface)',
};
const labelStyle = { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' };

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 1: DANH SÁCH SINH VIÊN
   ═══════════════════════════════════════════════════════════════════════════════ */
const TabSinhVien = ({ lopId, sinhVienIds = [], queryClient }) => {
  // Modal thêm SV
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState({ mssv: '', ho: '', ten: '', email: '', soDienThoai: '' });
  const [lookupResult, setLookupResult] = useState(null); // { status: 'found' | 'not_found' | 'loading' | null, data }
  const [mapped, setMapped] = useState(false);

  // Import Excel
  const [importResult, setImportResult] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileInputRef = useRef(null);

  // ─── MSSV Lookup ─────────────────────────────────────────────────────────────
  const handleMssvBlur = async () => {
    const mssv = form.mssv.trim();
    if (!mssv) {
      setLookupResult(null);
      setMapped(false);
      return;
    }
    setLookupResult({ status: 'loading', data: null });
    setMapped(false);
    try {
      const sv = await timSinhVien(mssv);
      setLookupResult({ status: 'found', data: sv });
    } catch {
      setLookupResult({ status: 'not_found', data: null });
    }
  };

  const handleMssvKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleMssvBlur();
    }
  };

  const handleAutoMap = () => {
    if (!lookupResult?.data) return;
    const sv = lookupResult.data;
    setForm({
      mssv: sv.maNguoiDung || form.mssv,
      ho: sv.ho || '',
      ten: sv.ten || '',
      email: sv.email || '',
      soDienThoai: sv.soDienThoai || '',
    });
    setMapped(true);
  };

  const openAddModal = () => {
    setForm({ mssv: '', ho: '', ten: '', email: '', soDienThoai: '' });
    setLookupResult(null);
    setMapped(false);
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    if (!addMutation.isPending) setAddModalOpen(false);
  };

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (svId) => themSinhVien(lopId, svId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gv-lop-hoc-detail', lopId] });
      setAddModalOpen(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (svId) => xoaSinhVien(lopId, svId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gv-lop-hoc-detail', lopId] });
      setConfirmDelete(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: (file) => importSinhVienExcel(lopId, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gv-lop-hoc-detail', lopId] });
      setImportResult(data);
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportResult(null);
      importMutation.mutate(file);
    }
    e.target.value = '';
  };

  const alreadyInClass = lookupResult?.data && sinhVienIds.some(
    (sv) => sv._id === lookupResult.data._id
  );

  const canSubmit = lookupResult?.status === 'found' && lookupResult.data && mapped && !alreadyInClass;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Bảng danh sách SV */}
      <div style={cardStyle}>
        <div style={{
          padding: '0.85rem 1rem',
          borderBottom: '1px solid var(--border-default)',
          background: 'var(--bg-surface-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            Sinh viên trong lớp ({sinhVienIds.length})
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Import Excel */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
              title="Import danh sách MSSV từ file Excel (cột A, từ hàng 2)"
              style={{
                padding: '0.4rem 0.85rem',
                background: '#0f766e',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: importMutation.isPending ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem',
                opacity: importMutation.isPending ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              📥 {importMutation.isPending ? 'Đang import...' : 'Import Excel'}
            </button>
            {/* Thêm SV */}
            <button
              type="button"
              onClick={openAddModal}
              style={{
                ...btnPrimary,
                padding: '0.4rem 1rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              + Thêm sinh viên
            </button>
          </div>
        </div>

        {/* Import result */}
        {importResult && (
          <div style={{
            margin: '0.75rem',
            padding: '0.75rem 1rem',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#166534' }}>Kết quả import:</p>
              <button type="button" onClick={() => setImportResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: '1rem' }}>×</button>
            </div>
            <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, lineHeight: 1.8 }}>
              <li>Đã thêm mới: <strong>{importResult.daThemMoi}</strong></li>
              <li>Đã có trong lớp: <strong>{importResult.daTonTai}</strong></li>
              {importResult.khongTimThay?.length > 0 && (
                <li style={{ color: '#dc2626' }}>
                  Không tìm thấy: <strong>{importResult.khongTimThay.join(', ')}</strong>
                </li>
              )}
            </ul>
          </div>
        )}
        {importMutation.isError && (
          <p style={{ margin: '0.75rem', fontSize: '0.85rem', color: '#dc2626', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
            {importMutation.error?.response?.data?.message || importMutation.error?.message}
          </p>
        )}

        {!sinhVienIds.length ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 0.75rem', fontSize: '1.75rem' }}>📭</p>
            <p style={{ margin: 0, fontWeight: 500 }}>Chưa có sinh viên nào trong lớp</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
              Nhấn <strong>"+ Thêm sinh viên"</strong> hoặc <strong>"Import Excel"</strong> để bắt đầu.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-muted)', borderBottom: '1px solid var(--border-default)' }}>
                  {['#', 'MSSV', 'Họ tên', 'Email', 'SĐT', ''].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sinhVienIds.map((sv, i) => (
                  <tr key={sv._id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)', width: '40px' }}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#4f46e5' }}>{sv.maNguoiDung}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{sv.ho} {sv.ten}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{sv.email}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{sv.soDienThoai || '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(sv)}
                        style={{
                          padding: '4px 10px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 500,
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
        )}
      </div>

      {/* ── Modal Thêm Sinh Viên ── */}
      <Modal
        isOpen={addModalOpen}
        onClose={closeAddModal}
        title="Thêm sinh viên vào lớp"
        size="md"
        footer={
          <>
            <button
              type="button" onClick={closeAddModal} disabled={addMutation.isPending}
              style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', background: 'var(--bg-surface)', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => canSubmit && addMutation.mutate(lookupResult.data._id)}
              disabled={!canSubmit || addMutation.isPending}
              style={{
                ...btnPrimary,
                background: canSubmit && !addMutation.isPending ? '#059669' : '#94a3b8',
                cursor: canSubmit && !addMutation.isPending ? 'pointer' : 'not-allowed',
              }}
            >
              {addMutation.isPending ? 'Đang thêm...' : 'Thêm vào lớp'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* MSSV - là trường chính */}
          <div>
            <label style={labelStyle}>Mã sinh viên (MSSV) *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                autoFocus
                type="text"
                value={form.mssv}
                onChange={(e) => {
                  setForm((p) => ({ ...p, mssv: e.target.value }));
                  setLookupResult(null);
                  setMapped(false);
                }}
                onBlur={handleMssvBlur}
                onKeyDown={handleMssvKeyDown}
                placeholder="Nhập MSSV rồi nhấn Enter..."
                style={{ ...inputStyle, flex: 1 }}
              />
              {lookupResult?.status === 'loading' && (
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  ⏳ Đang kiểm tra...
                </span>
              )}
            </div>

            {/* Kết quả lookup */}
            {lookupResult?.status === 'found' && !mapped && (
              <div style={{
                marginTop: '0.6rem',
                padding: '0.75rem 1rem',
                background: alreadyInClass ? '#fef9c3' : '#ede9fe',
                border: `1px solid ${alreadyInClass ? '#fde047' : '#c4b5fd'}`,
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: alreadyInClass ? '#854d0e' : '#5b21b6' }}>
                    {alreadyInClass
                      ? '⚠️ Sinh viên này đã có trong lớp!'
                      : `✅ Tìm thấy: ${lookupResult.data.ho} ${lookupResult.data.ten}`}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {lookupResult.data.maNguoiDung} • {lookupResult.data.email}
                  </p>
                </div>
                {!alreadyInClass && (
                  <button
                    type="button"
                    onClick={handleAutoMap}
                    style={{
                      padding: '0.4rem 1rem',
                      background: '#4f46e5',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Điền tự động
                  </button>
                )}
              </div>
            )}
            {lookupResult?.status === 'not_found' && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#dc2626', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
                ❌ Không tìm thấy sinh viên với MSSV này trong hệ thống.
              </p>
            )}
            {mapped && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#059669', fontWeight: 500 }}>
                ✓ Đã auto-map thông tin từ hệ thống
              </p>
            )}
          </div>

          {/* Họ & Tên */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Họ</label>
              <input
                type="text"
                value={form.ho}
                onChange={(e) => setForm((p) => ({ ...p, ho: e.target.value }))}
                placeholder="Nguyen Van"
                disabled={mapped}
                style={{ ...inputStyle, background: mapped ? 'var(--bg-surface-muted)' : 'var(--bg-surface)' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Tên</label>
              <input
                type="text"
                value={form.ten}
                onChange={(e) => setForm((p) => ({ ...p, ten: e.target.value }))}
                placeholder="An"
                disabled={mapped}
                style={{ ...inputStyle, background: mapped ? 'var(--bg-surface-muted)' : 'var(--bg-surface)' }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="email@example.com"
              disabled={mapped}
              style={{ ...inputStyle, background: mapped ? 'var(--bg-surface-muted)' : 'var(--bg-surface)' }}
            />
          </div>

          {/* SĐT */}
          <div>
            <label style={labelStyle}>Số điện thoại</label>
            <input
              type="text"
              value={form.soDienThoai}
              onChange={(e) => setForm((p) => ({ ...p, soDienThoai: e.target.value }))}
              placeholder="0901234567"
              disabled={mapped}
              style={{ ...inputStyle, background: mapped ? 'var(--bg-surface-muted)' : 'var(--bg-surface)' }}
            />
          </div>

          {addMutation.isError && (
            <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0, background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
              {addMutation.error?.response?.data?.message || addMutation.error?.message}
            </p>
          )}
        </div>
      </Modal>

      {/* ── Modal Xác Nhận Xóa SV ── */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => !removeMutation.isPending && setConfirmDelete(null)}
        title="Xóa sinh viên khỏi lớp"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              disabled={removeMutation.isPending}
              style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', background: 'var(--bg-surface)', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => removeMutation.mutate(confirmDelete._id)}
              disabled={removeMutation.isPending}
              style={{ ...btnPrimary, background: '#dc2626' }}
            >
              {removeMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Xóa <strong>{confirmDelete?.ho} {confirmDelete?.ten}</strong> ({confirmDelete?.maNguoiDung}) khỏi lớp?
        </p>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 2: ĐỀ THI
   ═══════════════════════════════════════════════════════════════════════════════ */
const TabDeThi = ({ lopId }) => {
  const { data: deThi, isLoading } = useQuery({
    queryKey: ['gv-lop-de-thi', lopId],
    queryFn: () => getDeThiCuaLop(lopId),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div style={cardStyle}>
      <div style={{
        padding: '0.85rem 1rem',
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--bg-surface-muted)',
        fontWeight: 600,
        fontSize: '0.9rem',
      }}>
        Đề thi đã xuất bản cho lớp ({deThi?.length || 0})
      </div>

      {!deThi?.length ? (
        <p style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)', margin: 0 }}>
          Chưa có đề thi nào được xuất bản cho lớp này.
          <br />
          <span style={{ fontSize: '0.85rem' }}>Xuất bản đề thi từ trang "Đề thi" → Sửa → Giao theo lớp.</span>
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-muted)', borderBottom: '1px solid var(--border-default)' }}>
                {['#', 'Tên đề thi', 'Mã đề', 'Môn học', 'Thời gian', 'Số câu', 'Ngày xuất bản'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deThi.map((d, i) => {
                const xuatBanInfo = d.lopHocIds?.find(
                  (l) => (l.lopHocId?._id || l.lopHocId) === lopId
                );
                return (
                  <tr key={d._id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)', width: '40px' }}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{d.ten}</td>
                    <td style={{ ...tdStyle, color: '#4f46e5', fontWeight: 500 }}>{d.maDeThi}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{d.monHocId?.ten || '—'}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{d.thoiGianPhut} phút</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{d.cauHois?.length || 0} câu</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {xuatBanInfo?.thoiGianXuatBan
                        ? new Date(xuatBanInfo.thoiGianXuatBan).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 3: BẢNG ĐIỂM
   ═══════════════════════════════════════════════════════════════════════════════ */
const TabBangDiem = ({ lopId }) => {
  const [deThiId, setDeThiId] = useState('');

  const { data: deThi } = useQuery({
    queryKey: ['gv-lop-de-thi', lopId],
    queryFn: () => getDeThiCuaLop(lopId),
  });

  const { data: bangDiem, isLoading } = useQuery({
    queryKey: ['gv-lop-bang-diem', lopId, deThiId],
    queryFn: () => getBangDiem(lopId, deThiId),
    enabled: !!deThiId,
  });

  const scoreList = bangDiem?.map((k) => k.ketQua?.tongDiem).filter((s) => typeof s === 'number') ?? [];
  const tongBai = bangDiem?.length ?? 0;
  const diemTB = scoreList.length ? (scoreList.reduce((a, b) => a + b, 0) / scoreList.length) : 0;
  const diemCao = scoreList.length ? Math.max(...scoreList) : 0;
  const soLuongDat = scoreList.filter((s) => s >= 5).length;
  const tiLeDat = tongBai > 0 ? ((soLuongDat / tongBai) * 100) : 0;

  const formatScore = (s) => (typeof s === 'number' ? s.toFixed(2) : '—');
  const getScoreColor = (s) => {
    if (typeof s !== 'number') return {};
    if (s >= 8) return { background: '#dcfce7', color: '#166534' };
    if (s >= 5) return { background: '#dbeafe', color: '#1d4ed8' };
    return { background: '#fee2e2', color: '#b91c1c' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Chọn đề */}
      <div style={{ ...cardStyle, padding: '1rem' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
          Chọn đề thi
        </label>
        <select
          value={deThiId}
          onChange={(e) => setDeThiId(e.target.value)}
          style={{
            padding: '0.6rem 0.85rem',
            border: '1px solid var(--border-default)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            minWidth: '300px',
            background: 'var(--bg-surface)',
          }}
        >
          <option value="">-- Chọn đề thi để xem bảng điểm --</option>
          {deThi?.map((d) => (
            <option key={d._id} value={d._id}>{d.ten} ({d.maDeThi})</option>
          ))}
        </select>
      </div>

      {!deThiId && (
        <div style={{
          background: 'var(--bg-surface-muted)',
          borderRadius: '0.75rem',
          border: '1px dashed #cbd5e1',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}>
          Chọn một đề thi để xem bảng điểm
        </div>
      )}

      {isLoading && deThiId && <LoadingSpinner />}

      {bangDiem && !isLoading && (
        <>
          {/* Thống kê */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Tổng bài', value: tongBai, bg: '#ede9fe', color: '#5b21b6' },
              { label: 'Điểm TB', value: diemTB.toFixed(2), bg: '#dbeafe', color: '#1d4ed8' },
              { label: 'Điểm cao nhất', value: diemCao.toFixed(2), bg: '#dcfce7', color: '#166534' },
              { label: 'Tỉ lệ đạt', value: `${tiLeDat.toFixed(1)}%`, bg: '#fef3c7', color: '#92400e' },
            ].map(({ label, value, bg, color }) => (
              <div key={label} style={{
                background: bg,
                borderRadius: '0.75rem',
                padding: '1rem 1.25rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.78rem', color, fontWeight: 500, marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Bảng điểm */}
          <div style={cardStyle}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-muted)', borderBottom: '1px solid var(--border-default)' }}>
                    {['STT', 'MSSV', 'Họ tên', 'Điểm', 'Thời gian nộp'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bangDiem.map((k, i) => {
                    const score = k.ketQua?.tongDiem;
                    return (
                      <tr key={k._id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', width: '50px' }}>{i + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#4f46e5' }}>
                          {k.nguoiDungId?.maNguoiDung || '—'}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>
                          {k.nguoiDungId ? `${k.nguoiDungId.ho} ${k.nguoiDungId.ten}` : k.hoTenAnDanh || 'Ẩn danh'}
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-block',
                            minWidth: '52px',
                            textAlign: 'center',
                            fontWeight: 700,
                            borderRadius: '999px',
                            padding: '0.2rem 0.55rem',
                            fontSize: '0.8rem',
                            ...getScoreColor(score),
                          }}>
                            {formatScore(score)}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {k.thoiGianNop ? new Date(k.thoiGianNop).toLocaleString('vi-VN') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!bangDiem.length && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', margin: 0 }}>
                Chưa có sinh viên nào nộp bài
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
const ChiTietLopHoc = () => {
  const { lopId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sinh-vien');

  const { data: lopDetail, isLoading } = useQuery({
    queryKey: ['gv-lop-hoc-detail', lopId],
    queryFn: () => getById(lopId),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!lopDetail) return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Không tìm thấy lớp học</p>
      <button type="button" onClick={() => navigate('/giao-vien/lop-hoc')} style={btnPrimary}>← Quay lại</button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => navigate('/giao-vien/lop-hoc')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            padding: 0,
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← Quay lại danh sách lớp
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{lopDetail.ten}</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              {lopDetail.sinhVienIds?.length || 0} sinh viên •
              Ngày tạo: {lopDetail.thoiGianTao ? new Date(lopDetail.thoiGianTao).toLocaleDateString('vi-VN') : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={tabBarStyle}>
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            style={tabStyle(activeTab === key)}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'sinh-vien' && (
        <TabSinhVien
          lopId={lopId}
          sinhVienIds={lopDetail.sinhVienIds || []}
          queryClient={queryClient}
        />
      )}
      {activeTab === 'de-thi' && <TabDeThi lopId={lopId} />}
      {activeTab === 'bang-diem' && <TabBangDiem lopId={lopId} />}
    </div>
  );
};

export default ChiTietLopHoc;
