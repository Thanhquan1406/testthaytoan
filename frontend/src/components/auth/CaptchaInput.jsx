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
      setQuestion('Không thể tải captcha. Nhấn để thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCaptcha(); }, []);

  // Cho phép form gọi ref.current.refresh()
  useImperativeHandle(ref, () => ({ refresh: fetchCaptcha }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
        Xác nhận bảo mật
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            padding: '0.5rem 1rem', background: '#f3f4f6', border: '1px solid #d1d5db',
            borderRadius: '0.5rem', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '2px',
            minWidth: '120px', textAlign: 'center', color: '#1e1b4b',
          }}
        >
          {loading ? '...' : question}
        </div>
        <button
          type="button"
          onClick={fetchCaptcha}
          title="Làm mới captcha"
          style={{
            background: 'none', border: '1px solid #d1d5db', borderRadius: '0.5rem',
            padding: '0.5rem', cursor: 'pointer', fontSize: '1rem',
          }}
        >
          🔄
        </button>
      </div>
      <input type="hidden" {...register('captchaId')} />
      <input
        type="number"
        placeholder="Nhập kết quả"
        style={{
          padding: '0.5rem 0.75rem', border: `1px solid ${errors?.captchaAnswer ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none',
        }}
        {...register('captchaAnswer', { required: 'Vui lòng nhập kết quả captcha' })}
      />
      {errors?.captchaAnswer && (
        <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.captchaAnswer.message}</span>
      )}
    </div>
  );
});

CaptchaInput.displayName = 'CaptchaInput';

export default CaptchaInput;
