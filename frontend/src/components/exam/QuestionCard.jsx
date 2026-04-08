/**
 * @fileoverview Component hiển thị một câu hỏi trong bài thi.
 * Hỗ trợ 3 loại: trắc nghiệm, đúng/sai, tự luận.
 */

import MathText from '../common/MathText';

/**
 * @param {{
 *   cauHoi: object,
 *   soThuTu: number,
 *   selectedAnswer: string|null,
 *   onAnswer: (cauHoiId: string, answer: string) => void,
 *   readonly?: boolean
 * }} props
 */
const QuestionCard = ({ cauHoi, soThuTu, selectedAnswer, onAnswer, readonly = false }) => {
  const { _id, noiDung, loaiCauHoi, luaChonA, luaChonB, luaChonC, luaChonD, dapAnDung } = cauHoi;
  const questionId = typeof _id === 'string' ? _id : String(_id);
  const normalize = (value) => String(value || '').trim();

  const handleSelect = (value) => {
    if (!readonly) onAnswer(questionId, value);
  };

  const optionStyle = (value, displayValue = null) => {
    const normalizedSelected = normalize(selectedAnswer);
    const normalizedValue = normalize(value);
    const normalizedDisplayValue = normalize(displayValue);
    // Tương thích dữ liệu cũ: có nơi lưu "A/B/C/D", có nơi lưu nguyên nội dung lựa chọn.
    const isSelected =
      normalizedSelected === normalizedValue ||
      (!!normalizedDisplayValue && normalizedSelected === normalizedDisplayValue);
    const isCorrect = readonly && dapAnDung && value === dapAnDung;
    const isWrong = readonly && isSelected && value !== dapAnDung;

    let bg = 'var(--bg-surface)', border = 'var(--border-default)', color = 'var(--text-primary)';
    if (isCorrect) { bg = '#d1fae5'; border = '#10b981'; color = '#065f46'; }
    else if (isWrong) { bg = '#fee2e2'; border = '#ef4444'; color = '#991b1b'; }
    else if (isSelected) { bg = '#eef2ff'; border = '#4f46e5'; color = '#3730a3'; }

    return {
      padding: '0.75rem 1rem', border: `2px solid ${border}`, borderRadius: '0.5rem',
      cursor: readonly ? 'default' : 'pointer', background: bg, color,
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      transition: 'all 0.15s ease', userSelect: 'none',
    };
  };

  const LabelBadge = ({ label }) => (
    <span style={{
      minWidth: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-surface-muted)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
    }}>{label}</span>
  );

  return (
    <div style={{
      background: 'var(--bg-surface)', borderRadius: '0.75rem', padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--border-default)',
      color: 'var(--text-primary)',
    }}>
      {/* Tiêu đề câu hỏi */}
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ color: '#4f46e5', fontWeight: 600, marginRight: '0.5rem' }}>
          Câu {soThuTu}:
        </span>
        <span style={{ color: 'var(--text-primary)' }}><MathText>{noiDung}</MathText></span>
      </div>

      {/* Lựa chọn theo loại câu hỏi */}
      {loaiCauHoi === 'TRAC_NGHIEM' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[['A', luaChonA], ['B', luaChonB], ['C', luaChonC], ['D', luaChonD]]
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label} style={optionStyle(label, value)} onClick={() => handleSelect(label)}>
                <LabelBadge label={label} />
                <MathText>{value}</MathText>
              </div>
            ))}
        </div>
      )}

      {loaiCauHoi === 'DUNG_SAI' && (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['Đúng', 'Sai'].map((opt) => (
            <div key={opt} style={{ ...optionStyle(opt), flex: 1, justifyContent: 'center' }} onClick={() => handleSelect(opt)}>
              <span style={{ fontWeight: 600 }}>{opt}</span>
            </div>
          ))}
        </div>
      )}

      {loaiCauHoi === 'TU_LUAN' && (
        <textarea
          value={selectedAnswer || ''}
          onChange={(e) => !readonly && onAnswer(questionId, e.target.value)}
          readOnly={readonly}
          rows={4}
          placeholder="Nhập câu trả lời của bạn..."
          style={{
            width: '100%', padding: '0.75rem', border: '1px solid var(--border-default)',
            borderRadius: '0.5rem', fontSize: '0.9rem', resize: 'vertical',
            fontFamily: 'inherit', outline: 'none',
          }}
        />
      )}

      {/* Hiển thị đáp án đúng khi xem lại */}
      {readonly && dapAnDung && loaiCauHoi !== 'TU_LUAN' && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#059669', fontWeight: 500 }}>
          ✓ Đáp án đúng: <strong>{dapAnDung}</strong>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
