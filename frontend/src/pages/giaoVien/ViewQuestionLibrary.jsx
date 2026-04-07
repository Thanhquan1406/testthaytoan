import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ViewQuestionLibrary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Safe extraction of bank from history state
  const selectedBank = location.state?.selectedBank;

  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [structureName, setStructureName] = useState('');
  const [structureType, setStructureType] = useState('Khung kiến thức');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchType, setSearchType] = useState('');
  const [structures, setStructures] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeParentIdForModal, setActiveParentIdForModal] = useState(undefined);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);

  // If directly navigated without bank data, redirect back to list
  if (!selectedBank) {
      navigate('/ngan-hang/dashboard', { replace: true });
      return null;
  }

  const handleContextMenu = (e, structure) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      structureId: structure.id,
      parentId: structure.parentId
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const toggleNodeCollapse = (id) => {
    setCollapsedNodeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleOpenSubStructureModal = (parentId) => {
    setActiveParentIdForModal(parentId);
    setIsStructureModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveStructure = () => {
    if (!structureName.trim()) return;

    const newId = Date.now();
    let updatedStructures = [...structures];

    if (activeParentIdForModal) {
      const parentIndex = updatedStructures.findIndex(s => s.id === activeParentIdForModal);
      if (parentIndex !== -1 && updatedStructures[parentIndex].type === 'Đơn vị kiến thức') {
        updatedStructures[parentIndex] = {
          ...updatedStructures[parentIndex],
          type: 'Khung kiến thức'
        };
      }
    }

    updatedStructures.push({
      id: newId,
      name: structureName,
      type: structureType,
      questionCount: 0,
      parentId: activeParentIdForModal
    });

    setStructures(updatedStructures);
    setStructureName('');
    setStructureType('Khung kiến thức');
    setActiveParentIdForModal(undefined);
    setIsStructureModalOpen(false);
  };

  const renderStructureTree = (parentId = undefined, depth = 0) => {
    const children = structures.filter(s => s.parentId === parentId);
    if (!children.length) return null;

    return children.map((structure, index) => {
      const hasChildren = structures.some(s => s.parentId === structure.id);
      const isIsolated = !structure.parentId && !hasChildren;
      const isCollapsed = collapsedNodeIds.includes(structure.id);

      return (
      <div key={structure.id}>
        <div 
          onContextMenu={(e) => handleContextMenu(e, structure)}
          style={{ 
            display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.5rem',
            background: '#fff', borderBottom: index === children.length - 1 && depth === 0 ? 'none' : '1px solid #f3f4f6', 
            padding: `0.75rem 1.25rem`, paddingLeft: `${1.25 + depth * 1.5}rem`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {structure.type === 'Khung kiến thức' ? (
              hasChildren && (
                <svg 
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleNodeCollapse(structure.id)}
                >
                  <polyline points={isCollapsed ? "9 18 15 12 9 6" : "6 9 12 15 18 9"}></polyline>
                </svg>
              )
            ) : (
              !isIsolated && (
                <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '3px', height: '3px', background: '#374151', borderRadius: '50%' }}></div>
                </div>
              )
            )}
            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#374151' }}>{structure.name}</span>
            <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>({structure.questionCount} Câu hỏi)</span>
          </div>
          
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setActiveMenuId(activeMenuId === structure.id ? null : structure.id)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5" cy="12" r="1.5"></circle>
                <circle cx="12" cy="12" r="1.5"></circle>
                <circle cx="19" cy="12" r="1.5"></circle>
              </svg>
            </button>

            {/* Dropdown Menu for structure item */}
            {activeMenuId === structure.id && (
              <>
                <div 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                  onClick={() => setActiveMenuId(null)}
                />
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '0.25rem',
                  background: '#fff', borderRadius: '0.375rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                  border: '1px solid #e5e7eb', minWidth: 'max-content', zIndex: 50,
                  padding: '0.5rem 0'
                }}>
                  <button 
                    onClick={() => handleOpenSubStructureModal(structure.id)}
                    style={{ whiteSpace: 'nowrap', width: '100%', padding: '0.625rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem', color: '#374151', textAlign: 'left', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Thêm cấu trúc con
                  </button>
                  <button style={{ whiteSpace: 'nowrap', width: '100%', padding: '0.625rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem', color: '#374151', textAlign: 'left', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Sửa
                  </button>
                  <button style={{ whiteSpace: 'nowrap', width: '100%', padding: '0.625rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem', color: '#ef4444', textAlign: 'left', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Xóa
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Đệ quy hiển thị con */}
        {!isCollapsed && renderStructureTree(structure.id, depth + 1)}
      </div>
    );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', paddingBottom: '2rem' }}>
      {/* Nút Quay lại */}
      <div>
        <button 
          onClick={() => navigate('/ngan-hang/dashboard')}
          style={{ 
            background: 'transparent', border: 'none', color: '#4b5563', cursor: 'pointer', 
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, fontSize: '0.9rem',
            padding: 0
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Quay lại
        </button>
      </div>

      {/* Tiêu đề & Ô tìm kiếm (nằm ngoài card trắng) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          {selectedBank.ten} <span style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500 }}>({selectedBank.soCauHoi} Câu hỏi)</span>
        </h2>
        
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Nhập mã câu hỏi" 
            style={{ 
              padding: '0.5rem 1rem', paddingRight: '2.5rem', borderRadius: '0.375rem', 
              border: '1px solid #d1d5db', outline: 'none', width: '250px', fontSize: '0.875rem',
              color: '#374151'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          <svg style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      {/* Khối nội dung chính (White Card) */}
      <div style={{ 
        background: '#fff', borderRadius: '0.5rem', border: '1px solid #e5e7eb', 
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        minHeight: '60vh'
      }}>
        {/* Menu Tab và Nút chức năng */}
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #e5e7eb', background: '#f9fafb' 
        }}>
          <div style={{ display: 'flex' }}>
            <button style={{ 
              padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', 
              border: 'none', background: '#fff', borderRight: '1px solid #e5e7eb', 
              color: '#111827', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' 
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              Cấu trúc
            </button>
          </div>
          
          {/* Các nút phía bên phải tab */}
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: '0.75rem', gap: '0.5rem' }}>
            <button 
              onClick={() => navigate('/ngan-hang/tao-ma-tran', { state: { selectedBank } })}
              style={{ 
              padding: '0.5rem 1rem', background: '#1e3a8a', color: '#fff', border: 'none', 
              borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' 
            }}>
              Tạo ma trận đề thi
            </button>
            <button 
              onClick={() => navigate('/ngan-hang/choose-import-question-mode', { state: { selectedBank } })}
              style={{ 
              padding: '0.5rem 1rem', background: '#1e3a8a', color: '#fff', border: 'none', 
              borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' 
            }}>
              + Nhập câu hỏi
            </button>
          </div>
        </div>

        {/* Phần nội dung của Tab (Cấu trúc) */}
        {structures.length === 0 ? (
          <div style={{ 
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', padding: '3rem 1rem' 
          }}>
            <div style={{ marginBottom: '1.25rem' }}>
              {/* Icon Folder */}
              <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#1f2937', fontWeight: 600, margin: 0, marginBottom: '0.5rem' }}>
              Chưa có cấu trúc nào được tạo
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0, marginBottom: '1.5rem' }}>
              Tạo cấu trúc để tổ chức câu hỏi theo chương, bài học
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => {
                  setActiveParentIdForModal(undefined);
                  setIsStructureModalOpen(true);
                }}
                style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 1.25rem', background: '#2563eb', color: '#fff', 
                border: 'none', borderRadius: '0.375rem', fontWeight: 500, 
                cursor: 'pointer', fontSize: '0.875rem', transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
              >
                + Thêm cấu trúc
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, padding: '1.25rem', background: '#f9fafb' }}>
            <div style={{ background: '#fff', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
              {renderStructureTree()}
            </div>
          </div>
        )}
      </div>

      {/* GLOBAL CONTEXT MENU KHI CHUỘT PHẢI */}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} onClick={closeContextMenu} onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }} />
          <div style={{
            position: 'fixed', top: contextMenu.mouseY, left: contextMenu.mouseX, zIndex: 105,
            background: '#fff', borderRadius: '0.375rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb', minWidth: '150px', padding: '0.25rem 0'
          }}>
            <button 
              onClick={() => {
                setActiveParentIdForModal(contextMenu.parentId);
                setIsStructureModalOpen(true);
                closeContextMenu();
              }}
              style={{ padding: '0.75rem 1rem', width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', color: '#1f2937' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Thêm cấu trúc
            </button>
          </div>
        </>
      )}

      {/* MODAL THÊM CẤU TRÚC */}
      {isStructureModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center'
        }}
        onClick={() => { setIsStructureModalOpen(false); setIsDropdownOpen(false); }}
        >
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: '440px', 
            borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            display: 'flex', flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1f2937' }}>
                Thêm cấu trúc
              </h3>
            </div>
            
            {/* Body */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '260px' }}>
              
              {/* Input Tên Cấu Trúc */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>Tên cấu trúc</label>
                <input 
                  type="text" 
                  value={structureName}
                  onChange={(e) => setStructureName(e.target.value)}
                  placeholder="Nhập cấu trúc" 
                  autoFocus
                  style={{
                    width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.95rem',
                    border: !structureName ? '1px solid #f87171' : '1px solid #e2e8f0',
                    borderRadius: '0.375rem', 
                    outline: 'none', color: '#1f2937'
                  }}
                  onFocus={(e) => e.target.style.borderColor = !structureName ? '#ef4444' : '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = !structureName ? '#f87171' : '#e2e8f0'}
                />
                {!structureName && (
                  <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 500, marginTop: '0.125rem' }}>
                    Vui lòng nhập cấu trúc!
                  </span>
                )}
              </div>

              {/* Custom Select Dropdown Kiểu cấu trúc */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>Kiểu cấu trúc</label>
                
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.95rem',
                    border: '1px solid #e2e8f0', borderRadius: '0.375rem', 
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#fff', color: '#1f2937'
                  }}
                >
                  <span>{structureType}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#3b82f6' }}>
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </div>

                {/* Vùng Dropdown */}
                {isDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.25rem',
                    background: '#fff', borderRadius: '0.375rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb', zIndex: 10
                  }}>
                    <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid #f3f4f6' }}>
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm ..." 
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        style={{
                          width: '100%', padding: '0', border: 'none', outline: 'none', fontSize: '0.95rem', color: '#4b5563', background: 'transparent'
                        }}
                      />
                    </div>
                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {['Khung kiến thức', 'Đơn vị kiến thức']
                        .filter(opt => opt.toLowerCase().includes(searchType.toLowerCase()))
                        .map((opt) => (
                        <div 
                          key={opt}
                          onClick={() => {
                            setStructureType(opt);
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            padding: '0.875rem 1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: structureType === opt ? '#f8fafc' : '#fff',
                            color: structureType === opt ? '#4f46e5' : '#374151',
                            fontSize: '0.95rem'
                          }}
                          onMouseOver={(e) => {
                            if (structureType !== opt) e.currentTarget.style.background = '#f9fafb';
                          }}
                          onMouseOut={(e) => {
                            if (structureType !== opt) e.currentTarget.style.background = '#fff';
                          }}
                        >
                          <span>{opt}</span>
                          {structureType === opt && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal Thêm Cấu Trúc */}
            <div style={{ 
              padding: '1.25rem', borderTop: '1px solid #f3f4f6', 
              display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' 
            }}>
              <button 
                onClick={() => { setIsStructureModalOpen(false); setIsDropdownOpen(false); }}
                style={{
                  padding: '0.5rem 1.25rem', fontSize: '0.9rem', fontWeight: 600,
                  background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.375rem',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveStructure}
                style={{
                  padding: '0.5rem 1.25rem', fontSize: '0.9rem', fontWeight: 600,
                  background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '0.375rem',
                  cursor: 'pointer', transition: 'background 0.2s',
                  opacity: (!structureName.trim()) ? 0.6 : 1
                }}
                disabled={!structureName.trim()}
                onMouseOver={(e) => { if (structureName.trim()) e.currentTarget.style.background = '#1d4ed8'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#2563eb'; }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewQuestionLibrary;
