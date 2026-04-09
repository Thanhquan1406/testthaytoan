import { useEffect, useState } from 'react';
import {
  getActiveSessions,
  revokeSession,
  logoutAllSessions,
  startTwoFactorSetup,
  verifyTwoFactorSetup,
  disableTwoFactor,
  getTwoFactorStatus,
} from '../../services/authService';

const SecuritySettings = () => {
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState('');
  const [setupData, setSetupData] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [disableMatKhau, setDisableMatKhau] = useState('');
  const [disableOtp, setDisableOtp] = useState('');
  const [success, setSuccess] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [totpEnabledAt, setTotpEnabledAt] = useState(null);

  const loadSessions = async () => {
    setLoadingSessions(true);
    setError('');
    try {
      const data = await getActiveSessions();
      setSessions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      await loadSessions();
      try {
        const status = await getTwoFactorStatus();
        setIs2FAEnabled(!!status?.is2FAEnabled);
        setTotpEnabledAt(status?.totpEnabledAt || null);
      } catch {
        // ignore
      }
    };
    loadInitial();
  }, []);

  const runSafe = async (actionKey, fn, successMessage) => {
    setBusyAction(actionKey);
    setError('');
    setSuccess('');
    try {
      await fn();
      if (successMessage) setSuccess(successMessage);
    } catch (err) {
      const message = String(err.message || '');
      if (message.toLowerCase().includes('otp')) {
        setError(`${message}. Kiểm tra lại giờ trên điện thoại (Google Authenticator yêu cầu đồng bộ thời gian).`);
      } else {
        setError(message);
      }
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="lowtech-security">
      <div className="lowtech-panel">
        <h2 style={{ marginBottom: '0.25rem' }}>Cài đặt bảo mật</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Các mục dưới đây giúp bảo vệ tài khoản và quản lý thiết bị đang đăng nhập.</p>
      </div>

      {success && <div className="lowtech-alert lowtech-alert-success">{success}</div>}
      {error && <div className="lowtech-alert lowtech-alert-error">{error}</div>}

      <section className="lowtech-panel">
        <h3>1) Bật Google Authenticator (2FA)</h3>
        <div style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
          Trạng thái hiện tại:{' '}
          <strong style={{ color: is2FAEnabled ? '#166534' : '#92400e' }}>
            {is2FAEnabled ? 'ĐÃ BẬT' : 'CHƯA BẬT'}
          </strong>
          {totpEnabledAt && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
              (bật lúc {new Date(totpEnabledAt).toLocaleString('vi-VN')})
            </span>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Khi bật 2FA, mỗi lần đăng nhập bạn cần thêm mã 6 số từ điện thoại.
        </p>
        <button
          className="auth-btn auth-btn-primary"
          disabled={busyAction === 'setup2fa'}
          onClick={() =>
            runSafe('setup2fa', async () => {
              const data = await startTwoFactorSetup();
              setSetupData(data);
            })
          }
          style={{ maxWidth: '320px' }}
        >
          {busyAction === 'setup2fa' ? 'Đang tạo mã...' : 'Tạo mã QR để bật 2FA'}
        </button>
        {!is2FAEnabled && setupData?.qrDataUrl && (
          <div style={{ marginTop: '0.9rem' }}>
            <div className="lowtech-step">
              <div className="lowtech-step-title">Bước A</div>
              <div className="lowtech-step-text">Mở Google Authenticator và quét QR code.</div>
            </div>
            <img src={setupData.qrDataUrl} alt="QR 2FA" style={{ width: 200, height: 200, borderRadius: '0.5rem', border: '1px solid var(--border-default)' }} />
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Nếu không quét được, nhập tay mã: <code>{setupData.secret}</code></div>
            <div className="lowtech-step" style={{ marginTop: '0.7rem' }}>
              <div className="lowtech-step-title">Bước B</div>
              <div className="lowtech-step-text">Nhập mã 6 số để xác nhận bật 2FA.</div>
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input className="auth-input" placeholder="Nhập OTP 6 số" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} style={{ maxWidth: 260 }} />
              <button
                className="auth-btn auth-btn-primary"
                style={{ maxWidth: 200 }}
                disabled={busyAction === 'verify2fa' || otpCode.length !== 6}
                onClick={() =>
                  runSafe(
                    'verify2fa',
                    async () => {
                      await verifyTwoFactorSetup(otpCode);
                      setOtpCode('');
                      setIs2FAEnabled(true);
                      setTotpEnabledAt(new Date().toISOString());
                      setSetupData(null);
                    },
                    'Đã bật 2FA thành công'
                  )
                }
              >
                {busyAction === 'verify2fa' ? 'Đang xác nhận...' : 'Xác nhận bật'}
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem', maxWidth: 460 }}>
          <h4 style={{ marginBottom: '0.25rem' }}>Tắt 2FA</h4>
          <input className="auth-input" type="password" placeholder="Nhập mật khẩu hiện tại" value={disableMatKhau} onChange={(e) => setDisableMatKhau(e.target.value)} />
          <input className="auth-input" placeholder="Nhập mã OTP hiện tại" value={disableOtp} onChange={(e) => setDisableOtp(e.target.value.replace(/\D/g, ''))} />
          <button
            className="auth-btn"
            disabled={busyAction === 'disable2fa' || !disableMatKhau || disableOtp.length !== 6}
            onClick={() =>
              runSafe(
                'disable2fa',
                async () => {
                  await disableTwoFactor({ matKhau: disableMatKhau, otpCode: disableOtp });
                  setDisableMatKhau('');
                  setDisableOtp('');
                  setIs2FAEnabled(false);
                  setTotpEnabledAt(null);
                },
                'Đã tắt 2FA'
              )
            }
            style={{ background: '#fee2e2', color: '#b91c1c', maxWidth: 220 }}
          >
            {busyAction === 'disable2fa' ? 'Đang xử lý...' : 'Tắt 2FA'}
          </button>
        </div>
        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Nếu mã OTP báo sai liên tục, hãy bật đồng bộ thời gian tự động trên điện thoại và máy tính rồi thử lại.
        </p>
      </section>

      <section className="lowtech-panel">
        <h3>2) Quản lý thiết bị đăng nhập</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Bạn có thể đăng xuất từng thiết bị hoặc toàn bộ thiết bị.
        </p>
        <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="auth-btn"
            style={{ maxWidth: 260 }}
            disabled={busyAction === 'logoutAll'}
            onClick={() =>
              runSafe(
                'logoutAll',
                async () => {
                  await logoutAllSessions();
                  await loadSessions();
                },
                'Đã đăng xuất tất cả thiết bị'
              )
            }
          >
            {busyAction === 'logoutAll' ? 'Đang xử lý...' : 'Đăng xuất tất cả thiết bị'}
          </button>
          <button className="auth-btn" style={{ maxWidth: 180 }} onClick={loadSessions}>
            Làm mới danh sách
          </button>
        </div>
        {loadingSessions ? (
          <p>Đang tải danh sách thiết bị...</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {sessions.map((session) => (
              <div key={session.sessionId} style={{ border: '1px solid var(--border-default)', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div><strong>{session.deviceName || 'Thiết bị không xác định'}</strong></div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>IP: {session.ip || '-'}</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Hoạt động gần nhất: {new Date(session.lastActiveAt).toLocaleString('vi-VN')}</div>
                </div>
                <button
                  onClick={() =>
                    runSafe(
                      `revoke-${session.sessionId}`,
                      async () => {
                        await revokeSession(session.sessionId);
                        await loadSessions();
                      },
                      'Đã đăng xuất một thiết bị'
                    )
                  }
                  className="auth-btn"
                  style={{ background: '#fee2e2', color: '#b91c1c', maxWidth: 180 }}
                >
                  Đăng xuất thiết bị này
                </button>
              </div>
            ))}
            {!sessions.length && <p>Hiện không có thiết bị hoạt động.</p>}
          </div>
        )}
      </section>
    </div>
  );
};

export default SecuritySettings;
