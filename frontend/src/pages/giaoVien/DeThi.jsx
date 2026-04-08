/**
 * @fileoverview Quản lý đề thi (Giáo viên) - CRUD, import file PDF/DOCX.
 */
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getDanhSach, getMonHoc, create, importFile } from '../../services/deThiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

const INIT_FORM = {
  ten: '',
  monHocId: '',
  thoiGianPhut: 60,
  moTa: '',
  trangThai: 'NHAP',
  soLanThiToiDa: 0,
  thoiGianMo: '',
  thoiGianDong: '',
  choPhepXemLai: true,
};

const inputStyle = {
  width: '100%', marginTop: '4px', padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db', borderRadius: '0.5rem', boxSizing: 'border-box',
  fontSize: '0.875rem',
};
const labelStyle = { fontSize: '0.875rem', fontWeight: 500, color: '#374151', display: 'block' };

const FormRow = ({ label, children, hint }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
    {hint && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#6b7280' }}>{hint}</p>}
  </div>
);

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

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [importFileObj, setImportFileObj] = useState(null);
  const [chuDeId, setChuDeId] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [importResult, setImportResult] = useState(null); // { soLuongNhap }

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => {
      const next = { ...p, [key]: value };
      // Khi đổi môn học → reset chuDeId
      if (key === 'monHocId') setChuDeId('');
      return next;
    });
  };

  const { data: deThiList, isLoading } = useQuery({
    queryKey: ['gv-de-thi'],
    queryFn: () => getDanhSach({}),
  });

  const { data: monHocs, isLoading: loadingMon } = useQuery({
    queryKey: ['gv-de-thi-mon-hoc'],
    queryFn: getMonHoc,
    enabled: modalOpen,
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
        trangThai: form.trangThai,
        soLanThiToiDa: Number(form.soLanThiToiDa) || 0,
        choPhepXemLai: form.choPhepXemLai,
        thoiGianMo: form.thoiGianMo ? new Date(form.thoiGianMo).toISOString() : null,
        thoiGianDong: form.thoiGianDong ? new Date(form.thoiGianDong).toISOString() : null,
      }),
    onSuccess: async (created) => {
      queryClient.invalidateQueries({ queryKey: ['gv-de-thi'] });

      // Nếu có file → import câu hỏi ngay sau khi tạo đề
      if (importFileObj && chuDeId && created?._id) {
        try {
          const result = await importFile(created._id, importFileObj, chuDeId);
          setImportResult(result);
        } catch {
          // Import lỗi không block redirect
        }
      }

      setModalOpen(false);
      if (created?._id) navigate(`/giao-vien/de-thi/${created._id}/chinh-sua`);
    },
  });

  const openModal = () => {
    setForm(INIT_FORM);
    setImportFileObj(null);
    setChuDeId('');
    setImportResult(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!createMutation.isPending) setModalOpen(false);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowed.includes(file.type)) {
      alert('Chỉ chấp nhận file PDF hoặc DOCX');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn. Tối đa 10MB');
      return;
    }
    setImportFileObj(file);
  };

  const isFormValid = form.ten.trim() && form.monHocId;
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
          <div key={d._id} style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{d.ten}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {d.monHocId?.ten} • {d.thoiGianPhut} phút • {d.cauHois?.length || 0} câu
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" style={{ padding: '4px 12px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Sửa</button>
              <button type="button" style={{ padding: '4px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Xóa</button>
            </div>
          </div>
        ))}
        {!deThiList?.data?.length && (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Chưa có đề thi nào. Tạo đề thi đầu tiên!</p>
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
              style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: '#fff', cursor: 'pointer' }}
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

          {/* Tên đề thi */}
          <FormRow label="Tên Đề Thi *">
            <input type="text" value={form.ten} onChange={set('ten')} placeholder="VD: Kiểm tra giữa kỳ môn Toán" style={inputStyle} autoFocus />
          </FormRow>

          {/* Môn học */}
          <FormRow label="Môn Học *">
            {loadingMon ? (
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Đang tải...</p>
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

          {/* Thời gian */}
          <FormRow label="Thời Gian Làm Bài (phút) *">
            <input type="number" min={1} value={form.thoiGianPhut} onChange={set('thoiGianPhut')} style={{ ...inputStyle, width: '160px' }} />
          </FormRow>

          {/* Mô tả */}
          <FormRow label="Mô Tả">
            <textarea rows={2} value={form.moTa} onChange={set('moTa')} placeholder="Mô tả ngắn về đề thi..." style={{ ...inputStyle, resize: 'vertical' }} />
          </FormRow>

          {/* Trạng thái */}
          <FormRow label="Trạng Thái">
            <select value={form.trangThai} onChange={set('trangThai')} style={{ ...inputStyle, width: '260px' }}>
              <option value="NHAP">📝 Nháp (chưa công khai)</option>
              <option value="CONG_KHAI">🌐 Công khai</option>
            </select>
          </FormRow>

          {/* Số lần thi */}
          <FormRow label="Số Lần Thi Tối Đa" hint="Nhập 0 để không giới hạn">
            <input type="number" min={0} value={form.soLanThiToiDa} onChange={set('soLanThiToiDa')} style={{ ...inputStyle, width: '160px' }} />
          </FormRow>

          {/* Thời gian mở/đóng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormRow label="Thời Gian Mở">
              <input type="datetime-local" value={form.thoiGianMo} onChange={set('thoiGianMo')} style={inputStyle} />
            </FormRow>
            <FormRow label="Thời Gian Đóng">
              <input type="datetime-local" value={form.thoiGianDong} onChange={set('thoiGianDong')} style={inputStyle} />
            </FormRow>
          </div>

          {/* Cho phép xem lại */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <input id="xem-lai" type="checkbox" checked={form.choPhepXemLai} onChange={set('choPhepXemLai')} style={{ marginTop: '2px', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0, accentColor: '#4f46e5' }} />
            <label htmlFor="xem-lai" style={{ cursor: 'pointer' }}>
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Cho phép sinh viên xem lại chi tiết từng câu sau khi nộp bài</span>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#6b7280' }}>
                Tắt nếu chỉ muốn hiển thị điểm/tóm tắt, không cho xem đáp án từng câu.
              </p>
            </label>
          </div>

          {/* ── Phần import file ── */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
              Nhập câu hỏi từ file
              <span style={{ marginLeft: '6px', fontSize: '0.75rem', fontWeight: 400, color: '#6b7280' }}>(tuỳ chọn)</span>
            </p>

            {/* Chủ đề để lưu câu hỏi */}
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>
                Chủ đề lưu câu hỏi
                {hasFile && <span style={{ color: '#dc2626' }}> *</span>}
              </label>
              {!form.monHocId ? (
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#9ca3af' }}>Chọn môn học trước để hiển thị chủ đề</p>
              ) : loadingChuDe ? (
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>Đang tải chủ đề...</p>
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

            {/* Drop zone */}
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
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {importFileObj ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>📄</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, color: '#059669', fontSize: '0.875rem' }}>{importFileObj.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
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
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#9ca3af' }}>
                    Kéo thả file vào đây hoặc nhấn nút trên
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: '#d1d5db' }}>
                    PDF, DOCX · tối đa 10MB
                  </p>
                </>
              )}
            </div>

            {/* Cảnh báo thiếu chủ đề khi có file */}
            {hasFile && !chuDeId && (
              <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: '#b45309', background: '#fef9c3', padding: '6px 10px', borderRadius: '0.375rem' }}>
                Vui lòng chọn chủ đề để câu hỏi trong file được lưu vào đúng nơi.
              </p>
            )}

            {/* Hướng dẫn định dạng */}
            <details style={{ marginTop: '0.75rem' }}>
              <summary style={{ fontSize: '0.8125rem', color: '#6b7280', cursor: 'pointer', userSelect: 'none' }}>
                Xem định dạng file được hỗ trợ
              </summary>
              <pre style={{ margin: '0.5rem 0 0', padding: '0.75rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
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

          {/* Lỗi */}
          {createMutation.isError && (
            <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0, background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
              {createMutation.error?.message}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DeThi;
