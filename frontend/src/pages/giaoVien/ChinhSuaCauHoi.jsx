/**
 * @fileoverview Chỉnh sửa nội dung đề thi dạng văn bản thô (Giáo viên).
 * TODO: Implement parser giống Spring Boot ImportDeThiService
 */

import { useParams, useNavigate } from 'react-router-dom';

const ChinhSuaCauHoi = () => {
  const { deThiId } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 500, marginBottom: '1rem' }}>← Quay lại đề thi</button>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Chỉnh sửa câu hỏi - Đề thi</h1>
      <div style={{ background: '#fff', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Nhập câu hỏi theo định dạng văn bản thô:</p>
        <textarea
          rows={20}
          placeholder={'Câu 1: Nội dung câu hỏi\nA. Lựa chọn A\nB. Lựa chọn B\nC. Lựa chọn C\nD. Lựa chọn D\nĐáp án: A\n\nCâu 2: ...'}
          style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={() => navigate(-1)} style={{ padding: '0.5rem 1.25rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: '#fff', cursor: 'pointer' }}>Hủy</button>
          <button style={{ padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>Đồng bộ câu hỏi</button>
        </div>
      </div>
    </div>
  );
};

export default ChinhSuaCauHoi;
