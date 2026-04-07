/**
 * @fileoverview Ngân hàng câu hỏi (Giáo viên) - Hiển thị danh sách các ngân hàng câu hỏi.
 */
import { useQuery } from '@tanstack/react-query';
import { getDanhSach } from '../../services/cauHoiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NganHangCauHoiList = () => {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // Local states để demo mượt mà giao diện tạo Ngân hàng
  const [localBanks, setLocalBanks] = useState([]);
  const [newBankName, setNewBankName] = useState('');
  const [newBankSubject, setNewBankSubject] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['gv-cau-hoi', page], queryFn: () => getDanhSach({ page, limit: 10 }) });

  if (isLoading) return <LoadingSpinner />;

  // Kết hợp data nếu sau này có data từ server (thêm vào sau) và localBanks
  // Vì hiện tại data trả về cấu trúc câu hỏi nên tạm thời parse tạm hoặc chỉ dùng local
  const serverBanks = data?.data ? data.data.map((c) => ({
    id: c._id, ten: c.chuDeId?.ten || 'Chủ đề', soCauHoi: 0
  })) : [];
  
  // Xóa filter tạm thời serverBanks để demo chuẩn giao diện rỗng trước
  const displayBanks = [...localBanks];

  const hasData = displayBanks.length > 0;

  const handleSave = () => {
    if (!newBankName.trim()) return;
    setLocalBanks([...localBanks, { 
      id: Date.now(), 
      ten: newBankName, 
      monHoc: newBankSubject, 
      soCauHoi: 0 
    }]);
    setNewBankName('');
    setNewBankSubject('');
    setIsModalOpen(false);
  };

  return (
    <>
      {!hasData ? (
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          height: '100%', minHeight: '60vh', background: 'transparent' 
        }}>
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <svg width="100" height="100" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M36 8V16" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
              <path d="M22 14L28 20" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
              <path d="M50 14L44 20" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 30L26 22H46L52 30" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 30 L14 52 C14 55.3137 16.6863 58 20 58 H52 C55.3137 58 58 55.3137 58 52 L58 30" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 30 H60" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M30 30 C30 33.3137 32.6863 36 36 36 C39.3137 36 42 33.3137 42 30" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M22 30V34H50V30" fill="rgba(59, 130, 246, 0.1)" />
            </svg>
          </div>
          
          <h2 style={{ fontSize: '1.125rem', color: '#1e3a8a', fontWeight: 600, marginBottom: '1.25rem' }}>
            Bạn chưa có ngân hàng câu hỏi nào
          </h2>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.625rem 1.25rem', background: '#2563eb', color: '#ffffff',
              border: 'none', borderRadius: '0.375rem', fontWeight: 500,
              cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tạo ngân hàng mới
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>Ngân hàng câu hỏi</h1>
            <button 
              onClick={() => setIsModalOpen(true)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', 
                border: 'none', borderRadius: '0.375rem', cursor: 'pointer', 
                fontWeight: 500, fontSize: '0.875rem' 
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Tạo ngân hàng mới
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {displayBanks.map((bank) => (
              <div 
                key={bank.id} 
                onClick={() => navigate('/ngan-hang/view-ngan-hang', { state: { selectedBank: bank } })}
                style={{
                  background: '#ffffff',
                  border: '1px solid #f3f4f6',
                  borderRadius: '0.5rem',
                  padding: '1.25rem',
                  display: 'flex', flexDirection: 'column',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}
              >
                <div style={{ marginBottom: '2.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                    {bank.ten}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {bank.soCauHoi} câu hỏi
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: 'auto' }}>
                  {/* Nút sửa */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* Logic sửa ở đây */ }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '30px', height: '30px', borderRadius: '0.25rem', cursor: 'pointer',
                      background: '#ffffff', border: '1px solid #bfdbfe', color: '#3b82f6',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {e.currentTarget.style.background = '#eff6ff'}}
                    onMouseOut={(e) => {e.currentTarget.style.background = '#ffffff'}}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  
                  {/* Nút xóa */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* Logic xóa ở đây */ }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '30px', height: '30px', borderRadius: '0.25rem', cursor: 'pointer',
                      background: '#ffffff', border: '1px solid #fecaca', color: '#ef4444',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {e.currentTarget.style.background = '#fef2f2'}}
                    onMouseOut={(e) => {e.currentTarget.style.background = '#ffffff'}}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'right', marginTop: '1.5rem', color: '#6b7280', fontSize: '0.85rem' }}>
            {displayBanks.length} File
          </div>
        </div>
      )}

      {/* MODAL TẠO NGÂN HÀNG MỚI */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: '500px', 
            borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Header Modal */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
                Tạo ngân hàng câu hỏi mới
              </h3>
            </div>
            
            {/* Body Modal */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Tên</label>
                <input 
                  type="text" 
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  placeholder="Nhập tên" 
                  autoFocus
                  style={{
                    width: '100%', padding: '0.625rem', fontSize: '0.875rem',
                    border: '1px solid #d1d5db', borderRadius: '0.375rem', 
                    outline: 'none', color: '#111827'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Môn học</label>
                <select 
                  value={newBankSubject}
                  onChange={(e) => setNewBankSubject(e.target.value)}
                  style={{
                    width: '100%', padding: '0.625rem', fontSize: '0.875rem',
                    border: '1px solid #d1d5db', borderRadius: '0.375rem', 
                    outline: 'none', color: '#111827', backgroundColor: '#fff',
                    appearance: 'none', 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="">Chọn môn học</option>
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Sinh học">Sinh học</option>
                  <option value="Lịch sử">Lịch sử</option>
                </select>
              </div>
            </div>

            {/* Footer Modal */}
            <div style={{ 
              padding: '1.25rem', 
              display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
            }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 500,
                  background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '0.375rem',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
              >
                Hủy
              </button>
              <button 
                onClick={handleSave}
                style={{
                  padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 500,
                  background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '0.375rem',
                  cursor: 'pointer', transition: 'background 0.2s',
                  opacity: (!newBankName.trim()) ? 0.6 : 1
                }}
                disabled={!newBankName.trim()}
                onMouseOver={(e) => { if (newBankName.trim()) e.currentTarget.style.background = '#1d4ed8'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#2563eb'; }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NganHangCauHoiList;