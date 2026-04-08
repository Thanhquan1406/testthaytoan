import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { importFile } from '../../services/nganHangService';

const ImportFile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);
    const selectedBank = location.state?.selectedBank;
    const [isUploading, setIsUploading] = useState(false);

    const processFile = async (file) => {
        if (!file) return;
        const name = file.name;
        const nganHangId = selectedBank?._id || selectedBank?.id;

        // Nếu có ngân hàng, upload file lên API để parse
        if (nganHangId) {
            try {
                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', file);
                const result = await importFile(nganHangId, formData);
                
                // Chuyển sang editor kèm kết quả đã parse
                navigate('/ngan-hang/editor', {
                    state: {
                        fileName: name,
                        rawText: result?.data?.cauHois?.map((q, i) => {
                            const da = (q.dapAnDung || '').toUpperCase();
                            return `Câu ${i+1}. ${q.noiDung}\n${da === 'A' ? '*' : ''}A. ${q.luaChonA}\n${da === 'B' ? '*' : ''}B. ${q.luaChonB}\n${da === 'C' ? '*' : ''}C. ${q.luaChonC}\n${da === 'D' ? '*' : ''}D. ${q.luaChonD}`;
                        }).join('\n\n') || '',
                        selectedBank,
                    }
                });
            } catch (err) {
                // Nếu API lỗi, vẫn chuyển sang editor với tên file
                navigate('/ngan-hang/editor', {
                    state: { fileName: name, rawText: '', selectedBank }
                });
            } finally {
                setIsUploading(false);
            }
        } else {
            // Không có ngân hàng, chỉ chuyển sang editor
            navigate('/ngan-hang/editor', {
                state: { fileName: name, rawText: '', selectedBank }
            });
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
                accept=".doc,.docx,.txt,.zip"
            />
            <div 
                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)', gap: '0.5rem', marginBottom: '1.5rem', alignSelf: 'flex-start' }} 
                onClick={() => navigate(-1)}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Quay lại</span>
            </div>
            
            <div style={{ maxWidth: '840px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2rem' }}>Nhập câu hỏi vào ngân hàng</h2>
                
                <div 
                    style={{ background: 'var(--bg-surface)', borderRadius: '0.5rem', padding: '3.5rem 2rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                        <polyline points="16 16 12 12 8 16"></polyline>
                        <line x1="12" y1="12" x2="12" y2="21"></line>
                        </svg>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Chọn File hoặc kéo thả File vào đây</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0' }}>Hỗ trợ các định dạng .pdf, .docx, .tex, .zip, Ảnh</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0' }}>File ảnh chỉ hỗ trợ số hoá</p>
                    <a href="#" style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>Tìm hiểu thêm</a>
                    
                    <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }} onClick={(e) => e.stopPropagation()}>
                        <span style={{cursor: 'pointer'}}>Đề mẫu Docx</span> <span style={{ color: '#d1d5db', margin: '0 0.25rem' }}>|</span> 
                        <span style={{cursor: 'pointer'}}>Đề mẫu Đúng-Sai Docx</span> <span style={{ color: '#d1d5db', margin: '0 0.25rem' }}>|</span> 
                        <span style={{cursor: 'pointer'}}>File Latex mẫu (.tex)</span> <span style={{ color: '#d1d5db', margin: '0 0.25rem' }}>|</span> 
                        <span style={{cursor: 'pointer'}}>File Latex mẫu (.zip)</span> <span style={{ color: '#d1d5db', margin: '0 0.25rem' }}>|</span> 
                        <span style={{cursor: 'pointer'}}>File đề Tiếng Anh mẫu (.docx)</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                    <span style={{ padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>HOẶC</span>
                    <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                </div>
                
                {/* Căn giữa cho đẹp */}
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <button 
                        onClick={() => {
                            navigate('/ngan-hang/editor', { 
                                state: { 
                                    fileName: "", 
                                    rawText: "", 
                                    selectedBank,
                                    isCompose: true
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
                        Tự soạn đề thi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportFile;
