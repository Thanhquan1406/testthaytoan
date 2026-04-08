/**
 * @fileoverview Dashboard giám sát thi realtime — giáo viên theo dõi live.
 * Dữ liệu ban đầu load từ API, cập nhật tức thời qua Socket.io.
 * Tự động fallback polling 15s khi socket mất kết nối.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { SkeletonTable } from '../../components/common/Skeleton';
import useSocket from '../../hooks/useSocket';
import useMonitorRoom from '../../hooks/useMonitorRoom';

// ─── Cấu hình hiển thị ──────────────────────────────────────────────────────

const TRANG_THAI_CONFIG = {
  DANG_THI:        { label: 'Đang thi',    color: '#059669', bg: '#d1fae5' },
  DA_NOP_BAI:      { label: 'Đã nộp',      color: '#4f46e5', bg: '#ede9fe' },
  CHUA_VAO_THI:    { label: 'Chưa vào',    color: 'var(--text-secondary)', bg: '#f3f4f6' },
  DA_VAO_CHUA_NOP: { label: 'Đang làm',    color: '#d97706', bg: '#fef3c7' },
};

const HANH_VI_LABEL = {
  CHUYEN_TAB:          'Chuyển tab',
  THOAT_TOAN_MAN_HINH: 'Thoát toàn màn hình',
  COPY_PASTE:          'Copy / Paste',
  RIGHT_CLICK:         'Chuột phải',
};

const getStudentName = (p) =>
  p?.nguoiDungId
    ? `${p.nguoiDungId.ho || ''} ${p.nguoiDungId.ten || ''}`.trim()
    : p?.hoTenAnDanh || 'Ẩn danh';

// ─── Sub-components ──────────────────────────────────────────────────────────

const ViolationToast = ({ alert, studentMap, onDismiss }) => {
  const student = studentMap[alert.phienThiId];
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid #fca5a5',
      borderLeft: '4px solid #ef4444',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      display: 'flex', flexDirection: 'column', gap: '0.2rem',
      minWidth: '280px', maxWidth: '340px',
      animation: 'toastSlideIn 0.3s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#dc2626' }}>⚠️ Vi phạm phát hiện</span>
        <button
          onClick={() => onDismiss(alert.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1, padding: 0 }}
        >×</button>
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
        <strong>{getStudentName(student)}</strong>: {HANH_VI_LABEL[alert.hanhVi] || alert.hanhVi}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        Tổng {alert.soViPham} vi phạm • {alert.time.toLocaleTimeString('vi')}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, bg }) => (
  <div style={{ background: bg, borderRadius: '0.75rem', padding: '0.875rem 1rem' }}>
    <div style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color, opacity: 0.75, marginTop: '0.25rem' }}>{label}</div>
  </div>
);

const ProgressBar = ({ answered, total }) => {
  if (!total) return <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>—</span>;
  const pct = Math.round((answered / total) * 100);
  const barColor = pct >= 80 ? '#10b981' : pct >= 40 ? '#3b82f6' : '#f59e0b';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
        <span>{answered}/{total} câu</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: barColor,
          borderRadius: '9999px', transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
};

const ConnectionBadge = ({ isConnected, isReconnecting }) => {
  const cfg = isConnected
    ? { text: 'Realtime',            dot: '#10b981', bg: '#d1fae5', color: '#065f46', pulse: true }
    : isReconnecting
    ? { text: 'Đang kết nối lại...', dot: '#f59e0b', bg: '#fef3c7', color: '#92400e', pulse: false }
    : { text: 'Chế độ polling',      dot: '#9ca3af', bg: '#f3f4f6', color: 'var(--text-secondary)', pulse: false };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.45rem',
      padding: '0.35rem 0.85rem', borderRadius: '9999px',
      fontSize: '0.78rem', fontWeight: 600, background: cfg.bg, color: cfg.color,
    }}>
      <span style={{
        width: '8px', height: '8px', borderRadius: '50%', background: cfg.dot,
        display: 'inline-block',
        animation: cfg.pulse ? 'livePulse 2s infinite' : 'none',
      }} />
      {cfg.text}
    </div>
  );
};

// ─── Trang chính ──────────────────────────────────────────────────────────────

const TheoDoi = () => {
  const [deThiId, setDeThiId] = useState('');
  const [trangThaiFilter, setTrangThaiFilter] = useState('');
  const [keyword, setKeyword] = useState('');

  // Lấy isConnected từ socket context để dùng trong refetchInterval
  const { isConnected, isReconnecting } = useSocket();

  // Danh sách đề của giáo viên
  const { data: deThiList } = useQuery({
    queryKey: ['gv-theo-doi-de-thi'],
    queryFn: () => api.get('/giao-vien/theo-doi-thi/de-thi').then((r) => r.data),
  });

  // Snapshot ban đầu: polling 15s khi socket offline, không poll khi realtime
  const {
    data: snapshot,
    isLoading,
    refetch: refetchSnapshot,
  } = useQuery({
    queryKey: ['gv-theo-doi-snapshot', deThiId],
    queryFn: () => api.get('/giao-vien/theo-doi-thi', { params: { deThiId } }).then((r) => r.data),
    enabled: !!deThiId,
    staleTime: 0,
    refetchInterval: deThiId && !isConnected ? 15000 : false,
  });

  // Realtime hook: join room, nhận events, merge vào studentMap
  const { studentMap, alerts, dismissAlert } = useMonitorRoom(
    deThiId || null,
    snapshot,
    refetchSnapshot,
  );

  // ─── Filter & sort ─────────────────────────────────────────────────────────

  const students = Object.values(studentMap);

  const filtered = students
    .filter((p) => {
      if (trangThaiFilter && p.trangThai !== trangThaiFilter) return false;
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        if (!getStudentName(p).toLowerCase().includes(kw)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const ord = { DANG_THI: 0, DA_VAO_CHUA_NOP: 1, DA_NOP_BAI: 2, CHUA_VAO_THI: 3 };
      const diff = (ord[a.trangThai] ?? 9) - (ord[b.trangThai] ?? 9);
      if (diff !== 0) return diff;
      return (b.lastUpdate ? new Date(b.lastUpdate) : 0) -
             (a.lastUpdate ? new Date(a.lastUpdate) : 0);
    });

  const stats = {
    total:   students.length,
    dangThi: students.filter((p) => p.trangThai === 'DANG_THI').length,
    daNop:   students.filter((p) => p.trangThai === 'DA_NOP_BAI').length,
    viPham:  students.filter((p) => (p.soViPham || 0) > 0).length,
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'relative' }}>

      {/* Toast vi phạm */}
      {alerts.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          zIndex: 9999, display: 'flex', flexDirection: 'column-reverse', gap: '0.5rem',
        }}>
          {alerts.map((alert) => (
            <ViolationToast key={alert.id} alert={alert} studentMap={studentMap} onDismiss={dismissAlert} />
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Theo dõi thi</h1>
        {deThiId && <ConnectionBadge isConnected={isConnected} isReconnecting={isReconnecting} />}
      </div>

      {/* Bộ lọc */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <select
          value={deThiId}
          onChange={(e) => { setDeThiId(e.target.value); setTrangThaiFilter(''); setKeyword(''); }}
          style={{ width: '100%', maxWidth: 360, padding: '0.5rem 0.75rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', fontSize: '0.9rem' }}
        >
          <option value="">-- Chọn đề thi để theo dõi --</option>
          {deThiList?.map((d) => <option key={d._id} value={d._id}>{d.ten}</option>)}
        </select>

        <select
          value={trangThaiFilter}
          onChange={(e) => setTrangThaiFilter(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', fontSize: '0.9rem' }}
        >
          <option value="">-- Tất cả trạng thái --</option>
          <option value="DANG_THI">Đang thi</option>
          <option value="DA_NOP_BAI">Đã nộp bài</option>
          <option value="CHUA_VAO_THI">Chưa vào thi</option>
          <option value="DA_VAO_CHUA_NOP">Đã vào, chưa nộp</option>
        </select>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm sinh viên..."
          style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', minWidth: '220px', fontSize: '0.9rem' }}
        />
      </div>

      {/* Placeholder khi chưa chọn đề */}
      {!deThiId && (
        <div style={{ background: 'var(--bg-surface-muted)', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Chọn đề thi để xem danh sách sinh viên đang thi
        </div>
      )}

      {isLoading && deThiId && <SkeletonTable rows={6} cols={7} />}

      {/* Stats */}
      {deThiId && !isLoading && students.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <StatCard label="Tổng sinh viên" value={stats.total}   color="#4f46e5" bg="#ede9fe" />
          <StatCard label="Đang thi"       value={stats.dangThi} color="#059669" bg="#d1fae5" />
          <StatCard label="Đã nộp"         value={stats.daNop}   color="#2563eb" bg="#dbeafe" />
          <StatCard label="Có vi phạm"     value={stats.viPham}  color="#dc2626" bg="#fee2e2" />
        </div>
      )}

      {/* Bảng sinh viên */}
      {deThiId && !isLoading && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
              {students.length === 0 ? 'Chưa có sinh viên nào vào thi' : 'Không có sinh viên phù hợp bộ lọc'}
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-muted)' }}>
                  {['Học viên', 'Lớp', 'Trạng thái', 'Tiến độ', 'Bắt đầu', 'Nộp bài', 'Vi phạm'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const cfg = TRANG_THAI_CONFIG[p.trangThai] || TRANG_THAI_CONFIG.CHUA_VAO_THI;
                  return (
                    <tr
                      key={p._id}
                      style={{
                        borderBottom: '1px solid var(--border-default)',
                        background: p.isNew ? '#f0fdf4' : 'transparent',
                        transition: 'background 1.5s ease',
                      }}
                    >
                      {/* Tên */}
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {p.isNew && (
                            <span
                              title="Vừa vào thi"
                              style={{
                                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                                background: '#10b981', display: 'inline-block',
                                animation: 'livePulse 1.5s infinite',
                              }}
                            />
                          )}
                          {getStudentName(p)}
                        </div>
                        {p.nguoiDungId?.maNguoiDung && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                            {p.nguoiDungId.maNguoiDung}
                          </div>
                        )}
                      </td>

                      {/* Lớp */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {p.lopHocId?.ten || '—'}
                      </td>

                      {/* Trạng thái */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '3px 9px', borderRadius: '9999px',
                          fontSize: '0.75rem', fontWeight: 600,
                          background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
                        }}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Tiến độ */}
                      <td style={{ padding: '0.75rem 1rem', minWidth: '140px' }}>
                        <ProgressBar answered={p.soCauDaTraLoi || 0} total={p.tongSoCau || 0} />
                      </td>

                      {/* Bắt đầu */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {p.thoiGianBatDau ? new Date(p.thoiGianBatDau).toLocaleTimeString('vi') : '—'}
                      </td>

                      {/* Nộp bài */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {p.thoiGianNop ? new Date(p.thoiGianNop).toLocaleTimeString('vi') : '—'}
                      </td>

                      {/* Vi phạm */}
                      <td style={{ padding: '0.75rem 1rem', minWidth: '110px' }}>
                        {(p.soViPham || 0) > 0 ? (
                          <div>
                            <span style={{
                              padding: '2px 8px', borderRadius: '9999px',
                              fontSize: '0.75rem', fontWeight: 600,
                              background: '#fee2e2', color: '#dc2626',
                            }}>
                              {p.soViPham} vi phạm
                            </span>
                            {p.viPhamGanNhat?.hanhVi && (
                              <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '2px' }}>
                                {HANH_VI_LABEL[p.viPhamGanNhat.hanhVi] || p.viPhamGanNhat.hanhVi}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.8); }
        }
        @keyframes toastSlideIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TheoDoi;
