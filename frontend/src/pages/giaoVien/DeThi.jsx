/**
 * @fileoverview Quản lý đề thi (Giáo viên) - CRUD, import file PDF/DOCX.
 */
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getDanhSach, getMonHoc, getById as getDeThiById, create, update, softDelete, importFile, createPublicLink } from '../../services/deThiService';
import { getDanhSach as getLopHocDanhSach } from '../../services/lopHocService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

const INIT_FORM = {
  ten: '',
  monHocId: '',
  thoiGianPhut: 60,
  moTa: '',
  soLanThiToiDa: 0,
  thoiGianMo: '',
  thoiGianDong: '',
  choPhepXemLai: true,
};

const INIT_EDIT_FORM = {
  ten: '',
  monHocId: '',
  thoiGianPhut: 60,
  moTa: '',
  soLanThiToiDa: 0,
  thoiGianMo: '',
  thoiGianDong: '',
  choPhepXemLai: true,
  doiTuongThi: 'TAT_CA',
  lopHocIds: [],
  sinhVienIds: [],
  cheDoXemDiem: 'THI_XONG',
  cheDoXemDapAn: 'THI_XONG',
  diemToiThieuXemDapAn: 0,
};

const inputStyle = {
  width: '100%', marginTop: '4px', padding: '0.5rem 0.75rem',
  border: '1px solid var(--border-default)', borderRadius: '0.5rem', boxSizing: 'border-box',
  fontSize: '0.875rem',
};
const labelStyle = { fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block' };

const FormRow = ({ label, children, hint }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
    {hint && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{hint}</p>}
  </div>
);

/** Radio group dùng cho Ai được phép làm & Chế độ xem điểm/đáp án */
const RadioGroup = ({ name, value, onChange, options }) => (
  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
    {options.map((opt) => (
      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
        <input
          type="radio" name={name} value={opt.value} checked={value === opt.value}
          onChange={() => onChange(opt.value)}
          style={{ accentColor: '#2563eb', cursor: 'pointer', width: '15px', height: '15px' }}
        />
        {opt.label}
      </label>
    ))}
  </div>
);

/**
 * Chuyển ISO string UTC → định dạng datetime-local theo giờ địa phương (YYYY-MM-DDTHH:mm).
 * datetime-local input hiển thị theo giờ local, nên phải trừ đi lệch múi giờ.
 */
const toDatetimeLocal = (iso) => {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    // getTimezoneOffset() trả về phút lệch so với UTC (VN = -420 phút = UTC+7)
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  } catch { return ''; }
};

const mapDoiTuongThiToApi = (value) => {
  if (value === 'GIAO_THEO_LOP') return 'LOP_HOC';
  if (value === 'GIAO_THEO_HOC_SINH') return 'HOC_SINH';
  return 'TAT_CA';
};

const mapDoiTuongThiFromApi = (value) => {
  if (value === 'LOP_HOC') return 'GIAO_THEO_LOP';
  if (value === 'HOC_SINH') return 'GIAO_THEO_HOC_SINH';
  return 'TAT_CA';
};

const mapCheDoXemDiemToApi = (value) => (value === 'TAT_CA_THI_XONG' ? 'TAT_CA_XONG' : value);
const mapCheDoXemDiemFromApi = (value) => (value === 'TAT_CA_XONG' ? 'TAT_CA_THI_XONG' : (value || 'THI_XONG'));

const mapCheDoXemDapAnToApi = (value) => {
  if (value === 'TAT_CA_THI_XONG') return 'TAT_CA_XONG';
  if (value === 'DIEM_TOI_THIEU') return 'DAT_DIEM';
  return value;
};

const mapCheDoXemDapAnFromApi = (value) => {
  if (value === 'TAT_CA_XONG') return 'TAT_CA_THI_XONG';
  if (value === 'DAT_DIEM') return 'DIEM_TOI_THIEU';
  return value || 'THI_XONG';
};

/* ── Lấy chủ đề theo monHocId ── */
const useChuDe = (monHocId) =>
  useQuery({
    queryKey: ['gv-chu-de', monHocId],
    queryFn: () =>
      axios
        .get(`/api/giao-vien/ngan-hang-cau-hoi/chu-de?monHocId=${monHocId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        })
        .then((r) => r.data?.data || []),
    enabled: !!monHocId,
    staleTime: 60_000,
  });

const DeThi = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  /* ── State tạo mới ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [importFileObj, setImportFileObj] = useState(null);
  const [chuDeId, setChuDeId] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [importResult, setImportResult] = useState(null);

  /* ── State chỉnh sửa ── */
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(INIT_EDIT_FORM);

  /* ── State xóa ── */
  const [deleteTarget, setDeleteTarget] = useState(null); // { _id, ten }

  /* ── State copy link ── */
  const [copiedId, setCopiedId] = useState(null);
  const [copyingId, setCopyingId] = useState(null);

  const handleCopyLink = async (d) => {
    if (d.doiTuongThi && d.doiTuongThi !== 'TAT_CA') {
      alert('Chỉ đề thi ở chế độ "Tất cả mọi người" mới có thể tạo link. Vui lòng cập nhật mục "Ai được phép làm" trước.');
      return;
    }

    try {
      setCopyingId(d._id);
      let maTruyCap = d.maTruyCap;
      if (!maTruyCap) {
        const result = await createPublicLink(d._id);
        maTruyCap = result.maTruyCap;
        queryClient.invalidateQueries({ queryKey: ['gv-de-thi'] });
      }
      const link = `${window.location.origin}/thi-mo?code=${maTruyCap}`;
      await navigator.clipboard.writeText(link);
      setCopiedId(d._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      alert(err?.message || 'Không thể sao chép link. Vui lòng thử lại.');
    } finally {
      setCopyingId(null);
    }
  };

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => {
      const next = { ...p, [key]: value };
      if (key === 'monHocId') setChuDeId('');
      return next;
    });
  };

  const setEdit = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditForm((p) => ({ ...p, [key]: value }));
  };

  const { data: deThiList, isLoading } = useQuery({
    queryKey: ['gv-de-thi'],
    queryFn: () => getDanhSach({}),
  });

  const { data: monHocs, isLoading: loadingMon } = useQuery({
    queryKey: ['gv-de-thi-mon-hoc'],
    queryFn: getMonHoc,
    enabled: modalOpen || editModalOpen,
  });

  const { data: lopHocs = [], isLoading: loadingLopHoc } = useQuery({
    queryKey: ['gv-lop-hoc-for-de-thi'],
    queryFn: getLopHocDanhSach,
    enabled: editModalOpen,
  });


  const { data: chuDeList = [], isLoading: loadingChuDe } = useChuDe(form.monHocId);

  /* ── Tạo đề thi ── */
  const createMutation = useMutation({
    mutationFn: () =>
      create({
        ten: form.ten.trim(),
        monHocId: form.monHocId,
        thoiGianPhut: Number(form.thoiGianPhut) || 60,
        moTa: form.moTa.trim() || undefined,
        soLanThiToiDa: Number(form.soLanThiToiDa) || 0,
        choPhepXemLai: form.choPhepXemLai,
        thoiGianMo: form.thoiGianMo ? new Date(form.thoiGianMo).toISOString() : null,
        thoiGianDong: form.thoiGianDong ? new Date(form.thoiGianDong).toISOString() : null,
      }),
    onSuccess: async (created) => {
      queryClient.invalidateQueries({ queryKey: ['gv-de-thi'] });
      if (importFileObj && chuDeId && created?._id) {
        try {
          const result = await importFile(created._id, importFileObj, chuDeId);
          setImportResult(result);
        } catch { /* Import lỗi không block redirect */ }
      }
      setModalOpen(false);
      if (created?._id) navigate(`/giao-vien/de-thi/${created._id}/chinh-sua`);
    },
  });

  /* ── Cập nhật đề thi ── */
  const updateMutation = useMutation({
    mutationFn: () =>
      update(editingId, {
        ten: editForm.ten.trim(),
        monHocId: editForm.monHocId,
        thoiGianPhut: Number(editForm.thoiGianPhut) || 60,
        moTa: editForm.moTa.trim() || undefined,
        soLanThiToiDa: Number(editForm.soLanThiToiDa) || 0,
        choPhepXemLai: editForm.cheDoXemDapAn !== 'KHONG',
        // datetime-local value "YYYY-MM-DDTHH:mm" → new Date() hiểu là giờ địa phương → toISOString() ra UTC đúng
        thoiGianMo: editForm.thoiGianMo ? new Date(editForm.thoiGianMo).toISOString() : null,
        thoiGianDong: editForm.thoiGianDong ? new Date(editForm.thoiGianDong).toISOString() : null,
        doiTuongThi: mapDoiTuongThiToApi(editForm.doiTuongThi),
        lopHocIds: editForm.doiTuongThi === 'GIAO_THEO_LOP' ? editForm.lopHocIds : [],
        sinhVienIds: editForm.doiTuongThi === 'GIAO_THEO_HOC_SINH' ? editForm.sinhVienIds : [],
        cheDoXemDiem: mapCheDoXemDiemToApi(editForm.cheDoXemDiem),
        cheDoXemDapAn: mapCheDoXemDapAnToApi(editForm.cheDoXemDapAn),
        diemToiThieuXemDapAn: mapCheDoXemDapAnToApi(editForm.cheDoXemDapAn) === 'DAT_DIEM'
          ? Number(editForm.diemToiThieuXemDapAn) || 0
          : 0,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['gv-de-thi'] });
      setEditModalOpen(false);
      setEditingId(null);
    },
  });

  /* ── Xóa đề thi (soft delete) ── */
  const deleteMutation = useMutation({
    mutationFn: () => softDelete(deleteTarget._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gv-de-thi'] });
      setDeleteTarget(null);
    },
  });

  /* ── Mở modal tạo ── */
  const openModal = () => {
    setForm(INIT_FORM);
    setImportFileObj(null);
    setChuDeId('');
    setImportResult(null);
    setModalOpen(true);
  };

  const closeModal = () => { if (!createMutation.isPending) setModalOpen(false); };

  /* ── Mở modal chỉnh sửa ── */
  const openEditModal = async (d) => {
    setEditingId(d._id);
    setEditForm({
      ten: d.ten || '',
      monHocId: d.monHocId?._id || d.monHocId || '',
      thoiGianPhut: d.thoiGianPhut ?? 60,
      moTa: d.moTa || '',
      soLanThiToiDa: d.soLanThiToiDa ?? 0,
      thoiGianMo: toDatetimeLocal(d.thoiGianMo),
      thoiGianDong: toDatetimeLocal(d.thoiGianDong),
      choPhepXemLai: d.choPhepXemLai ?? true,
      doiTuongThi: mapDoiTuongThiFromApi(d.doiTuongThi),
      lopHocIds: [],
      sinhVienIds: [],
      cheDoXemDiem: mapCheDoXemDiemFromApi(d.cheDoXemDiem),
      cheDoXemDapAn: mapCheDoXemDapAnFromApi(d.cheDoXemDapAn),
      diemToiThieuXemDapAn: d.diemToiThieuXemDapAn ?? 0,
    });
    setEditModalOpen(true);

    try {
      const detail = await getDeThiById(d._id);
      const lopHocIds = (detail?.lopHocIds || [])
        .map((item) => {
          const raw = item?.lopHocId;
          if (!raw) return null;
          return typeof raw === 'string' ? raw : raw._id;
        })
        .filter(Boolean);
      const sinhVienIds = (detail?.sinhVienIds || [])
        .map((item) => {
          const raw = item?.sinhVienId;
          if (!raw) return null;
          return typeof raw === 'string' ? raw : raw._id;
        })
        .filter(Boolean);
      setEditForm((prev) => ({
        ...prev,
        doiTuongThi: mapDoiTuongThiFromApi(detail?.doiTuongThi || prev.doiTuongThi),
        lopHocIds,
        sinhVienIds,
        cheDoXemDiem: mapCheDoXemDiemFromApi(detail?.cheDoXemDiem || prev.cheDoXemDiem),
        cheDoXemDapAn: mapCheDoXemDapAnFromApi(detail?.cheDoXemDapAn || prev.cheDoXemDapAn),
        diemToiThieuXemDapAn: detail?.diemToiThieuXemDapAn ?? prev.diemToiThieuXemDapAn,
      }));
    } catch {
      // Giữ nguyên dữ liệu đã có nếu tải chi tiết lỗi.
    }
  };

  const closeEditModal = () => { if (!updateMutation.isPending) setEditModalOpen(false); };

  const handleFileSelect = (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowed.includes(file.type)) { alert('Chỉ chấp nhận file PDF hoặc DOCX'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('File quá lớn. Tối đa 10MB'); return; }
    setImportFileObj(file);
  };

  const isFormValid = form.ten.trim() && form.monHocId;
  const isEditFormValid = editForm.ten.trim() && editForm.monHocId;
  const hasFile = !!importFileObj;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Quản lý đề thi</h1>
        <button
          type="button" onClick={() => navigate('/giao-vien/de-thi/tao-moi')}
          style={{ padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
        >
          + Tạo đề thi
        </button>
      </div>

      {/* Danh sách đề thi */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {deThiList?.data?.map((d) => (
          <div
            key={d._id}
            style={{ background: 'var(--bg-surface)', padding: '1rem 1.25rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600 }}>{d.ten}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {d.monHocId?.ten} • {d.thoiGianPhut} phút
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }}>
              <button
                type="button"
                onClick={() => handleCopyLink(d)}
                disabled={copyingId === d._id || (d.doiTuongThi && d.doiTuongThi !== 'TAT_CA')}
                title="Sao chép link thi công khai"
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px',
                  background: d.doiTuongThi && d.doiTuongThi !== 'TAT_CA'
                    ? '#f3f4f6'
                    : (copiedId === d._id ? '#dcfce7' : '#f3e8ff'),
                  color: d.doiTuongThi && d.doiTuongThi !== 'TAT_CA'
                    ? '#6b7280'
                    : (copiedId === d._id ? '#15803d' : '#7c3aed'),
                  border: `1px solid ${d.doiTuongThi && d.doiTuongThi !== 'TAT_CA'
                    ? '#e5e7eb'
                    : (copiedId === d._id ? '#bbf7d0' : '#e9d5ff')}`,
                  borderRadius: '0.375rem',
                  cursor: (copyingId === d._id || (d.doiTuongThi && d.doiTuongThi !== 'TAT_CA')) ? 'not-allowed' : 'pointer',
                  fontSize: '0.8125rem', fontWeight: 500,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (d.doiTuongThi === 'TAT_CA' && copiedId !== d._id) e.currentTarget.style.background = '#e9d5ff';
                }}
                onMouseLeave={(e) => {
                  if (d.doiTuongThi === 'TAT_CA' && copiedId !== d._id) e.currentTarget.style.background = '#f3e8ff';
                }}
              >
                {d.doiTuongThi && d.doiTuongThi !== 'TAT_CA'
                  ? '🔒 Chỉ Tất cả mọi người'
                  : (copyingId === d._id ? '⏳ Đang tạo...' : copiedId === d._id ? '✅ Đã sao chép!' : '🔗 Copy link')}
              </button>
              <button
                type="button"
                onClick={() => openEditModal(d)}
                title="Chỉnh sửa thông tin đề thi"
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px', background: '#dbeafe', color: '#1d4ed8',
                  border: '1px solid #bfdbfe', borderRadius: '0.375rem',
                  cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#bfdbfe'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#dbeafe'}
              >
                ✏️ Sửa
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(d)}
                title="Xóa đề thi"
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px', background: '#fee2e2', color: '#dc2626',
                  border: '1px solid #fecaca', borderRadius: '0.375rem',
                  cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
              >
                🗑️ Xóa
              </button>
            </div>
          </div>
        ))}
        {!deThiList?.data?.length && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Chưa có đề thi nào. Tạo đề thi đầu tiên!</p>
        )}
      </div>

      {/* ── Modal tạo đề thi ── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Tạo Đề Thi Mới"
        size="lg"
        footer={
          <>
            <button
              type="button" onClick={closeModal} disabled={createMutation.isPending}
              style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', background: 'var(--bg-surface)', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !isFormValid}
              style={{ padding: '0.5rem 1.5rem', background: isFormValid ? '#4f46e5' : '#a5b4fc', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: isFormValid ? 'pointer' : 'not-allowed', fontWeight: 600 }}
            >
              {createMutation.isPending
                ? (hasFile ? 'Đang tạo & nhập câu hỏi...' : 'Đang lưu...')
                : 'Lưu Đề Thi'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <FormRow label="Tên Đề Thi *">
            <input type="text" value={form.ten} onChange={set('ten')} placeholder="VD: Kiểm tra giữa kỳ môn Toán" style={inputStyle} autoFocus />
          </FormRow>

          <FormRow label="Môn Học *">
            {loadingMon ? (
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Đang tải...</p>
            ) : (
              <>
                <select value={form.monHocId} onChange={set('monHocId')} style={inputStyle}>
                  <option value="">-- Chọn môn học --</option>
                  {monHocs?.map((m) => <option key={m._id} value={m._id}>{m.ten}</option>)}
                </select>
                {monHocs !== undefined && !monHocs?.length && (
                  <p style={{ margin: '4px 0 0', color: '#b45309', fontSize: '0.8125rem' }}>
                    Chưa có môn học. Nhờ quản trị viên thêm môn học.
                  </p>
                )}
              </>
            )}
          </FormRow>

          <FormRow label="Thời Gian Làm Bài (phút) *">
            <input type="number" min={1} value={form.thoiGianPhut} onChange={set('thoiGianPhut')} style={{ ...inputStyle, width: '160px' }} />
          </FormRow>

          <FormRow label="Mô Tả">
            <textarea rows={2} value={form.moTa} onChange={set('moTa')} placeholder="Mô tả ngắn về đề thi..." style={{ ...inputStyle, resize: 'vertical' }} />
          </FormRow>

          <FormRow label="Số Lần Thi Tối Đa" hint="Nhập 0 để không giới hạn">
            <input type="number" min={0} value={form.soLanThiToiDa} onChange={set('soLanThiToiDa')} style={{ ...inputStyle, width: '160px' }} />
          </FormRow>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormRow label="Thời Gian Mở">
              <input type="datetime-local" value={form.thoiGianMo} onChange={set('thoiGianMo')} style={inputStyle} />
            </FormRow>
            <FormRow label="Thời Gian Đóng">
              <input type="datetime-local" value={form.thoiGianDong} onChange={set('thoiGianDong')} style={inputStyle} />
            </FormRow>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <input id="xem-lai" type="checkbox" checked={form.choPhepXemLai} onChange={set('choPhepXemLai')} style={{ marginTop: '2px', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0, accentColor: '#4f46e5' }} />
            <label htmlFor="xem-lai" style={{ cursor: 'pointer' }}>
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Cho phép sinh viên xem lại chi tiết từng câu sau khi nộp bài</span>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Tắt nếu chỉ muốn hiển thị điểm/tóm tắt, không cho xem đáp án từng câu.
              </p>
            </label>
          </div>

          {/* ── Phần import file ── */}
          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '1rem' }}>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Nhập câu hỏi từ file
              <span style={{ marginLeft: '6px', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>(tuỳ chọn)</span>
            </p>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>
                Chủ đề lưu câu hỏi
                {hasFile && <span style={{ color: '#dc2626' }}> *</span>}
              </label>
              {!form.monHocId ? (
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Chọn môn học trước để hiển thị chủ đề</p>
              ) : loadingChuDe ? (
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Đang tải chủ đề...</p>
              ) : (
                <>
                  <select value={chuDeId} onChange={(e) => setChuDeId(e.target.value)} style={inputStyle}>
                    <option value="">-- Chọn chủ đề --</option>
                    {chuDeList.map((c) => <option key={c._id} value={c._id}>{c.ten}</option>)}
                  </select>
                  {!chuDeList.length && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#b45309' }}>
                      Chưa có chủ đề nào. Tạo chủ đề trong trang Ngân hàng câu hỏi trước.
                    </p>
                  )}
                </>
              )}
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer?.files?.[0]); }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#4f46e5' : importFileObj ? '#10b981' : '#d1d5db'}`,
                borderRadius: '0.5rem', padding: '1.25rem', textAlign: 'center',
                background: dragOver ? '#ede9fe' : importFileObj ? '#ecfdf5' : '#f9fafb',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <input
                ref={fileInputRef} type="file" accept=".pdf,.docx,.doc"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
              {importFileObj ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>📄</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, color: '#059669', fontSize: '0.875rem' }}>{importFileObj.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {(importFileObj.size / 1024).toFixed(0)} KB
                      {' · '}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setImportFileObj(null); setChuDeId(''); }}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0, fontSize: '0.75rem', fontWeight: 500 }}
                      >
                        Xóa file
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>📂</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={{ padding: '0.35rem 0.875rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', marginBottom: '0.4rem' }}
                  >
                    Chọn File PDF/DOCX
                  </button>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Kéo thả file vào đây hoặc nhấn nút trên</p>
                  <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: '#d1d5db' }}>PDF, DOCX · tối đa 10MB</p>
                </>
              )}
            </div>

            {hasFile && !chuDeId && (
              <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: '#b45309', background: '#fef9c3', padding: '6px 10px', borderRadius: '0.375rem' }}>
                Vui lòng chọn chủ đề để câu hỏi trong file được lưu vào đúng nơi.
              </p>
            )}

            <details style={{ marginTop: '0.75rem' }}>
              <summary style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                Xem định dạng file được hỗ trợ
              </summary>
              <pre style={{ margin: '0.5rem 0 0', padding: '0.75rem', background: 'var(--bg-surface-muted)', border: '1px solid var(--border-default)', borderRadius: '0.375rem', fontSize: '0.75rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
{`Câu 1: Nội dung câu hỏi?
A. Lựa chọn A
B. Lựa chọn B
C. Lựa chọn C
D. Lựa chọn D
Đáp án: A

Câu 2. Câu hỏi tiếp theo?
A) Phương án A
B) Phương án B
C) Phương án C
D) Phương án D
ĐA: C`}
              </pre>
            </details>
          </div>

          {createMutation.isError && (
            <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0, background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
              {createMutation.error?.message}
            </p>
          )}
        </div>
      </Modal>

      {/* ── Modal chỉnh sửa đề thi ── */}
      <Modal
        isOpen={editModalOpen}
        onClose={closeEditModal}
        title=""
        size="lg"
        footer={
          <>
            <button
              type="button" onClick={closeEditModal} disabled={updateMutation.isPending}
              style={{ padding: '0.5rem 1.25rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', background: 'var(--bg-surface)', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !isEditFormValid}
              style={{
                padding: '0.5rem 1.5rem',
                background: isEditFormValid ? '#2563eb' : '#93c5fd',
                color: '#fff', border: 'none', borderRadius: '0.5rem',
                cursor: isEditFormValid ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.875rem',
              }}
            >
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── Section header ── */}
          <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.05em', color: '#1d4ed8', textTransform: 'uppercase' }}>
              Cấu hình chung
            </h3>
          </div>

          {/* Tên */}
          <FormRow label="Tên">
            <input
              type="text" value={editForm.ten} onChange={setEdit('ten')}
              placeholder="Nhập tên đề thi..." style={inputStyle} autoFocus
            />
          </FormRow>

          {/* Môn học */}
          <FormRow label="Môn học">
            {loadingMon ? (
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Đang tải...</p>
            ) : (
              <select value={editForm.monHocId} onChange={setEdit('monHocId')} style={inputStyle}>
                <option value="">-- Chọn môn học --</option>
                {monHocs?.map((m) => <option key={m._id} value={m._id}>{m.ten}</option>)}
              </select>
            )}
          </FormRow>

          {/* Mô tả */}
          <FormRow label="Mô tả">
            <textarea
              rows={2} value={editForm.moTa} onChange={setEdit('moTa')}
              placeholder="Nhập mô tả..." style={{ ...inputStyle, resize: 'vertical' }}
            />
          </FormRow>

          {/* Thời gian làm bài */}
          <div>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
              Thời gian làm bài (phút)
              <span title="Nhập 0 để không giới hạn thời gian làm bài" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: '#e5e7eb', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 700, cursor: 'default' }}>i</span>
            </label>
            <input
              type="number" min={0} value={editForm.thoiGianPhut} onChange={setEdit('thoiGianPhut')}
              style={{ ...inputStyle, width: '180px' }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Nhập 0 để không giới hạn thời gian</p>
          </div>

          {/* Thời gian giao đề */}
          <div>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
              Thời gian giao đề
              <span title="Khoảng thời gian học sinh có thể bắt đầu làm bài" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: '#e5e7eb', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 700, cursor: 'default' }}>i</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px', flexWrap: 'wrap' }}>
              <input
                type="datetime-local" value={editForm.thoiGianMo} onChange={setEdit('thoiGianMo')}
                style={{ ...inputStyle, width: 'auto', flex: 1, minWidth: '180px' }}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Đến</span>
              <input
                type="datetime-local" value={editForm.thoiGianDong} onChange={setEdit('thoiGianDong')}
                style={{ ...inputStyle, width: 'auto', flex: 1, minWidth: '180px' }}
              />
              <button
                type="button"
                onClick={() => setEditForm((p) => ({ ...p, thoiGianMo: '', thoiGianDong: '' }))}
                style={{ padding: '0.45rem 0.875rem', background: 'var(--bg-surface-muted)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
              >
                ↺ Đặt lại
              </button>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Bỏ trống nếu không muốn giới hạn thời gian giao đề.
            </p>
          </div>

          {/* Ai được phép làm */}
          <div>
            <label style={labelStyle}>Ai được phép làm</label>
            <RadioGroup
              name="edit-doiTuongThi"
              value={editForm.doiTuongThi}
              onChange={(v) => setEditForm((p) => ({ ...p, doiTuongThi: v }))}
              options={[
                { value: 'TAT_CA', label: 'Tất cả mọi người' },
                { value: 'GIAO_THEO_LOP', label: 'Giao theo lớp' },
              ]}
            />
            {editForm.doiTuongThi === 'TAT_CA' && (
              <p style={{ margin: '5px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Lựa chọn này cho phép những học sinh không đăng ký/đăng nhập tài khoản vẫn có thể tham gia thi.
              </p>
            )}
            {editForm.doiTuongThi === 'GIAO_THEO_LOP' && (
              <div style={{ marginTop: '0.75rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <div style={{ background: 'var(--bg-surface-muted)', padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--border-default)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Danh sách lớp học
                </div>
                <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'var(--bg-surface)' }}>
                  {loadingLopHoc ? (
                    <p style={{ margin: 0, padding: '0.75rem 0.875rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Đang tải danh sách lớp...</p>
                  ) : !lopHocs.length ? (
                    <p style={{ margin: 0, padding: '0.75rem 0.875rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Chưa có lớp học nào</p>
                  ) : (
                    lopHocs.map((lop) => (
                      <label
                        key={lop._id}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--border-default)', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={editForm.lopHocIds.includes(lop._id)}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              lopHocIds: e.target.checked
                                ? [...prev.lopHocIds, lop._id]
                                : prev.lopHocIds.filter((id) => id !== lop._id),
                            }))
                          }
                          style={{ accentColor: '#2563eb', cursor: 'pointer', width: '15px', height: '15px' }}
                        />
                        <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{lop.ten}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Điểm và đáp án khi làm xong */}
          <div style={{ border: '1px solid var(--border-default)', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <div style={{ background: 'var(--bg-surface-muted)', padding: '0.625rem 1rem', borderBottom: '1px solid var(--border-default)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Điểm và đáp án khi làm xong</span>
            </div>
            <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

              {/* Cho xem điểm */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', minWidth: '180px', paddingTop: '6px' }}>Cho xem điểm</span>
                <RadioGroup
                  name="edit-cheDoXemDiem"
                  value={editForm.cheDoXemDiem}
                  onChange={(v) => setEditForm((p) => ({ ...p, cheDoXemDiem: v }))}
                  options={[
                    { value: 'KHONG', label: 'Không' },
                    { value: 'THI_XONG', label: 'Khi làm bài xong' },
                    { value: 'TAT_CA_THI_XONG', label: 'Khi tất cả thi xong' },
                  ]}
                />
              </div>

              {/* Cho xem đề và đáp án */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', minWidth: '180px', paddingTop: '6px' }}>Cho xem đề thi và đáp án</span>
                <div>
                  <RadioGroup
                    name="edit-cheDoXemDapAn"
                    value={editForm.cheDoXemDapAn}
                    onChange={(v) => setEditForm((p) => ({ ...p, cheDoXemDapAn: v }))}
                    options={[
                      { value: 'KHONG', label: 'Không' },
                      { value: 'THI_XONG', label: 'Khi làm bài xong' },
                      { value: 'TAT_CA_THI_XONG', label: 'Khi tất cả thi xong' },
                    ]}
                  />
                  {/* Tùy chọn điểm tối thiểu */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    <input
                      type="radio" name="edit-cheDoXemDapAn" value="DIEM_TOI_THIEU"
                      checked={editForm.cheDoXemDapAn === 'DIEM_TOI_THIEU'}
                      onChange={() => setEditForm((p) => ({ ...p, cheDoXemDapAn: 'DIEM_TOI_THIEU' }))}
                      style={{ accentColor: '#2563eb', cursor: 'pointer', width: '15px', height: '15px' }}
                    />
                    Khi đạt đến số điểm nhất định
                    {editForm.cheDoXemDapAn === 'DIEM_TOI_THIEU' && (
                      <input
                        type="number" min={0} max={100}
                        value={editForm.diemToiThieuXemDapAn}
                        onChange={(e) => setEditForm((p) => ({ ...p, diemToiThieuXemDapAn: e.target.value }))}
                        style={{ width: '80px', padding: '2px 6px', border: '1px solid var(--border-default)', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                        placeholder="Điểm..."
                      />
                    )}
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* Nút chỉnh sửa câu hỏi trong đề */}
          <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false);
                navigate(`/giao-vien/de-thi/${editingId}/chinh-sua`);
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '0.75rem 1.25rem', background: '#f0fdf4', color: '#15803d',
                border: '1.5px solid #bbf7d0', borderRadius: '0.5rem',
                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.borderColor = '#86efac'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#bbf7d0'; }}
            >
              📝 Sửa câu hỏi trong đề thi
            </button>
          </div>

          {updateMutation.isError && (
            <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0, background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
              {updateMutation.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'}
            </p>
          )}
        </div>
      </Modal>

      {/* ── Modal xác nhận xóa ── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => { if (!deleteMutation.isPending) setDeleteTarget(null); }}
        title="Xác Nhận Xóa Đề Thi"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
              style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', background: 'var(--bg-surface)', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              style={{ padding: '0.5rem 1.25rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa Đề Thi'}
            </button>
          </>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>⚠️</span>
            <div>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 500 }}>
                Bạn có chắc muốn xóa đề thi này?
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', background: 'var(--bg-surface-muted)', padding: '6px 10px', borderRadius: '0.375rem', fontWeight: 600 }}>
                "{deleteTarget?.ten}"
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', background: '#fef9c3', padding: '8px 12px', borderRadius: '0.375rem' }}>
            Đề thi sẽ được chuyển vào thùng rác và có thể khôi phục sau.
          </p>
          {deleteMutation.isError && (
            <p style={{ margin: '0.75rem 0 0', color: '#dc2626', fontSize: '0.875rem', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
              {deleteMutation.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DeThi;
