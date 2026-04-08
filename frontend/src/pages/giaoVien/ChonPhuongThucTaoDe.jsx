import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseFile } from '../../services/deThiService';

const ChonPhuongThucTaoDe = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const processFile = async (file) => {
        if (!file) return;
        const name = file.name;

        try {
            setIsUploading(true);
            const result = await parseFile(file);
            
            navigate('/giao-vien/de-thi/editor', {
                state: {
                    fileName: name,
                    rawText: result?.cauHois?.map((q, i) => {
                        const da = (q.dapAnDung || '').toUpperCase();
                        return `Câu ${i+1}. ${q.noiDung}\n${da === 'A' ? '*' : ''}A. ${q.luaChonA}\n${da === 'B' ? '*' : ''}B. ${q.luaChonB}\n${da === 'C' ? '*' : ''}C. ${q.luaChonC}\n${da === 'D' ? '*' : ''}D. ${q.luaChonD}`;
                    }).join('\n\n') || '',
                }
            });
        } catch (err) {
            alert('Lỗi phân tích file: ' + (err?.response?.data?.message || err.message));
            // Nếu API lỗi, vẫn chuyển sang editor với tên file trống
            navigate('/giao-vien/de-thi/editor', {
                state: { fileName: name, rawText: '' }
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer?.files[0];
        processFile(droppedFile);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        processFile(selectedFile);
    };

    const handleDragOver = (e) => e.preventDefault();

    return (
        <div style={{ padding: '1.5rem', background: 'var(--bg-surface-muted)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
                accept=".doc,.docx,.txt"
            />
            <div 
                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)', gap: '0.5rem', marginBottom: '1.5rem', alignSelf: 'flex-start' }} 
                onClick={() => navigate('/giao-vien/de-thi')}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Quay lại</span>
            </div>
            
            <div style={{ maxWidth: '840px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2rem' }}>Tạo đề thi mới</h2>
                
                <div 
                    style={{ background: 'var(--bg-surface)', borderRadius: '0.5rem', padding: '3.5rem 2rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid var(--border-default)', cursor: 'pointer', position: 'relative' }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                    {isUploading && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', fontSize: '1.1rem', fontWeight: 500, color: '#2563eb' }}>
                            Đang xử lý file...
                        </div>
                    )}
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                        <polyline points="16 16 12 12 8 16"></polyline>
                        <line x1="12" y1="12" x2="12" y2="21"></line>
                        </svg>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Chọn File DOCX/PDF hoặc kéo thả File vào đây</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0' }}>Hỗ trợ các định dạng .pdf, .docx</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                    <span style={{ padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>HOẶC</span>
                    <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <button 
                        onClick={() => {
                            if (isUploading) return;
                            navigate('/giao-vien/de-thi/editor', { 
                                state: { 
                                    fileName: "", 
                                    rawText: ""
                                } 
                            });
                        }}
                        style={{ 
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                        padding: '0.75rem 2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', 
                        borderRadius: '0.375rem', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem',
                        cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        minWidth: '250px'
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Tự soạn đề thi (không từ file)
                    </button>
                    
                    <button 
                        onClick={() => {
                            if (isUploading) return;
                            navigate('/ngan-hang/tao-ma-tran');
                        }}
                        style={{ 
                        marginLeft: '1rem',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                        padding: '0.75rem 2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', 
                        borderRadius: '0.375rem', color: '#1e40af', fontWeight: 600, fontSize: '0.95rem',
                        cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        minWidth: '250px'
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                        Tạo từ ma trận (ngân hàng)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChonPhuongThucTaoDe;
