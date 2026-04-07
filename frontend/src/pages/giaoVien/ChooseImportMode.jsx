import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ... (MOCK_RAW_TEXT is omitted in this diff to save space, but keeping it inside)
const MOCK_RAW_TEXT = `Câu 1. [!b:$ Số &quot;Bảy mươi mốt nghìn không trăm linh năm&quot; được viết là:$]
A. 7105
*B. 71005
C. 71050
D. 70105
Câu 2. [!b:$ Giá trị của chữ số 8 trong số 48 253 là:$]
A. 80
B. 800
*C. 8000
D. 80 000
Câu 3. [!b:$ Số lớn nhất trong các số: 85 743; 85 473; 85 734; 85 374 là:$]
*A. 85 743
B. 85 473
C. 85 734
D. 85 374
Câu 4. [!b:$ Kết quả của phép tính 3527 + 4218 là:$]
A. 7735
*B. 7745
C. 7645
D. 7845
Câu 5. [!b:$ Tìm X, biết: X$] [!b:$x 6 = 4266$]
*A. x = 711
B. x = 701
C. x = 611
D. x = 710
Câu 6. [!b:$ Một hình vuông có cạnh dài 9 cm. Chu vi của hình vuông đó là:$]
A. 18 cm
B. 81 cm
C. 36 cm
D. 27 cm`;

const ChooseImportMode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const selectedBank = location.state?.selectedBank;
    const handleDropMock = (e) => {
        e.preventDefault();
        // fake reading file
        const droppedFile = e.dataTransfer?.files[0];
        const name = droppedFile ? droppedFile.name : "bai1text.docx";
        
        // Điều hướng sang trang Editor độc lập thay vì Render lồng nhau
        navigate('/ngan-hang/editor', { 
            state: { 
                fileName: name, 
                rawText: MOCK_RAW_TEXT, 
                selectedBank 
            } 
        });
    };

    const handleDragOver = (e) => e.preventDefault();

    return (
        <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div 
                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: '#1f2937', gap: '0.5rem', marginBottom: '1.5rem', alignSelf: 'flex-start' }} 
                onClick={() => navigate(-1)}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Quay lại</span>
            </div>
            
            <div style={{ maxWidth: '840px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '2rem' }}>Nhập câu hỏi vào ngân hàng</h2>
                
                <div 
                    style={{ background: '#fff', borderRadius: '0.5rem', padding: '3.5rem 2rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid #e5e7eb' }}
                    onDrop={handleDropMock}
                    onDragOver={handleDragOver}
                >
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                        <polyline points="16 16 12 12 8 16"></polyline>
                        <line x1="12" y1="12" x2="12" y2="21"></line>
                        </svg>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>Chọn File hoặc kéo thả File vào đây</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0' }}>Hỗ trợ các định dạng .pdf, .docx, .tex, .zip, Ảnh</p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0' }}>File ảnh chỉ hỗ trợ số hoá</p>
                    <a href="#" style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none' }}>Tìm hiểu thêm</a>
                    
                    <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>
                        <span style={{cursor: 'pointer'}}>Đề mẫu Azota Docx</span> <span style={{ color: '#d1d5db', margin: '0 0.25rem' }}>|</span> 
                        <span style={{cursor: 'pointer'}}>Đề mẫu Azota Đúng-Sai Docx</span> <span style={{ color: '#d1d5db', margin: '0 0.25rem' }}>|</span> 
                        <span style={{cursor: 'pointer'}}>File Latex mẫu (.tex)</span> <span style={{ color: '#d1d5db', margin: '0 0.25rem' }}>|</span> 
                        <span style={{cursor: 'pointer'}}>File Latex mẫu (.zip)</span> <span style={{ color: '#d1d5db', margin: '0 0.25rem' }}>|</span> 
                        <span style={{cursor: 'pointer'}}>File đề Tiếng Anh mẫu (.docx)</span>
                    </div>
                    
                    <div style={{ marginTop: '2.5rem', background: '#f8fafc', borderRadius: '0.5rem', padding: '0.875rem 1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem', border: '1px solid #f1f5f9' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h1m8-9v1m8 8h1M5.6 5.6l.7.7m12.1-.7-.7.7M9 16v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3"></path><path d="M9 16a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3z"></path></svg>
                        <span style={{ fontWeight: 500 }}>Azota đã hỗ trợ nhận dạng đề từ file ảnh (ảnh chụp đề hoặc viết tay)</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                    <span style={{ padding: '0 1rem', color: '#6b7280', fontSize: '0.8rem', fontWeight: 600 }}>HOẶC</span>
                    <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                </div>
                
                {/* Căn giữa cho đẹp */}
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <button style={{ 
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                        padding: '0.75rem 2rem', background: '#fff', border: '1px solid #e5e7eb', 
                        borderRadius: '0.375rem', color: '#1f2937', fontWeight: 600, fontSize: '0.95rem',
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

export default ChooseImportMode;
