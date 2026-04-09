/**
 * @fileoverview Component nhập CAPTCHA toán học.
 * Tự động fetch CAPTCHA mới khi mount hoặc khi gọi refresh.
 */

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { getCaptcha } from '../../services/authService';

/**
 * Expose ref với method refresh() để form có thể làm mới captcha sau lỗi
 */
const CaptchaInput = forwardRef(({ register, errors, setValue, clearErrors }, ref) => {
  const [question, setQuestion] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCaptcha = async () => {
    setLoading(true);
    try {
      const data = await getCaptcha();
      setQuestion(data.question);
      setCaptchaId(data.captchaId);
      setValue('captchaId', data.captchaId);
      setValue('captchaAnswer', '');
      clearErrors?.('captchaAnswer');
    } catch {
      setQuestion('Lỗi...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCaptcha(); }, []);

  // Cho phép form gọi ref.current.refresh()
  useImperativeHandle(ref, () => ({ refresh: fetchCaptcha }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label className="auth-label">Mã xác nhận bảo mật</label>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.5rem' }}>
        <div
          style={{
            padding: '0.6rem 1rem', background: 'var(--gray-100)', border: '1px solid var(--border-default)',
            borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '1px',
            minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gray-900)', userSelect: 'none',
          }}
        >
          {loading ? '...' : question}
        </div>
        <button
          type="button"
          onClick={fetchCaptcha}
          title="Làm mới captcha"
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: '0.75rem', padding: '0 0.8rem', cursor: 'pointer', fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', color: 'var(--text-secondary)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
        >
          🔄
        </button>
        <div style={{ flex: 1 }}>
          <input type="hidden" {...register('captchaId')} />
          <input
            type="number"
            placeholder="Kết quả..."
            className={`auth-input ${errors?.captchaAnswer ? 'error' : ''}`}
            {...register('captchaAnswer', { required: 'Vui lòng nhập kết quả' })}
          />
        </div>
      </div>
      {errors?.captchaAnswer && (
        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
          {errors.captchaAnswer.message}
        </span>
      )}
    </div>
  );
});

CaptchaInput.displayName = 'CaptchaInput';

export default CaptchaInput;
