import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MOCK_STRUCTURES = [
    { id: 1, name: "Chương 1", type: "Khung kiến thức", parentId: undefined },
    { id: 2, name: "hhh", type: "Khung kiến thức", parentId: 1 },
    { id: 3, name: "hhh", type: "Khung kiến thức", parentId: undefined },
    { id: 4, name: "Xin chào", type: "Đơn vị kiến thức", parentId: 3 },
    { id: 5, name: "hhh(2)", type: "Khung kiến thức", parentId: undefined },
    { id: 6, name: "hh", type: "Đơn vị kiến thức", parentId: 5 }
];

const TaoMaTranDe = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedBank = location.state?.selectedBank;
  const [matrixName, setMatrixName] = useState('');
  const [expandedNodes, setExpandedNodes] = useState([1, 3, 5]);
  const [matrixRows, setMatrixRows] = useState([]);
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  // Lưu trữ dữ liệu các ô nhập số lượng câu: { [rowId]: { [colIndex]: number } }
  const [matrixData, setMatrixData] = useState({});
  // Lưu trữ dữ liệu ô % tổng điểm: { [rowId]: string }
  const [percentData, setPercentData] = useState({});

  const handleInputChange = (rowId, colIndex, value) => {
    let num = parseInt(value, 10);
    if (value === "") num = "";
    if (isNaN(num) && value !== "") return; // chỉ cho nhập số

    setMatrixData(prev => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [colIndex]: num
      }
    }));
  };

  const handlePercentChange = (rowId, value) => {
    setPercentData(prev => ({
      ...prev,
      [rowId]: value
    }));
  };

  // Các hàm tính tổng
  const getRowTotalCols = (rowId, cols) => {
    if (!matrixData[rowId]) return 0;
    let sum = 0;
    cols.forEach(c => {
      if (matrixData[rowId][c]) sum += matrixData[rowId][c];
    });
    return sum;
  };

  const getColTotal = (colIndex) => {
    let sum = 0;
    matrixRows.forEach(row => {
      if (matrixData[row.id] && matrixData[row.id][colIndex]) {
        sum += matrixData[row.id][colIndex];
      }
    });
    return sum;
  };

  const getPercentTotal = () => {
    let sum = 0;
    matrixRows.forEach(row => {
      let num = parseFloat(percentData[row.id]);
      if (!isNaN(num)) sum += num;
    });
    return sum;
  };

  // Mock function to simulate available questions
  const getMockAvailableCount = (rowId, colIndex) => {
    return (rowId + colIndex) % 3 === 0 ? 0 : ((rowId * 7 + colIndex * 3) % 15) + 1;
  };

  const toggleNode = (e, id) => {
    e.stopPropagation();
    setExpandedNodes(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const handleAddRow = (node) => {
    if (matrixRows.some(row => row.id === node.id)) return;
    
    let parentObj = MOCK_STRUCTURES.find(s => s.id === node.parentId);
    let parentName = parentObj ? parentObj.name : "";

    let noiDung = "";
    let yeuCau = "";
    
    if (node.type === "Đơn vị kiến thức") {
        noiDung = parentName;
        yeuCau = node.name;
    } else {
        noiDung = node.name;
        yeuCau = "";
    }

    setMatrixRows([...matrixRows, {
        id: node.id,
        noiDung,
        yeuCau,
        nodeType: node.type
    }]);
  };

  const handleRemoveRow = (id) => {
    setMatrixRows(matrixRows.filter(row => row.id !== id));
  };

  const renderTree = (parentId = undefined, depth = 0) => {
    const nodes = MOCK_STRUCTURES.filter(s => s.parentId === parentId);
    if (!nodes.length) return null;

    return nodes.map(node => {
      const hasChildren = MOCK_STRUCTURES.some(s => s.parentId === node.id);
      const isExpanded = expandedNodes.includes(node.id);

      const isAdded = matrixRows.some(row => row.id === node.id);

      return (
        <div key={node.id} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1rem', paddingLeft: `${1 + depth * 1.5}rem`,
            cursor: 'pointer', transition: 'background 0.2s',
            color: isAdded ? '#3b82f6' : '#374151', fontSize: '0.9rem', fontWeight: 500
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          onClick={() => handleAddRow(node)}
          >
            {hasChildren ? (
              <span onClick={(e) => toggleNode(e, node.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
                <svg 
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
            ) : (
               <div style={{ width: '16px' }}></div>
            )}
            
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isAdded ? '#bfdbfe' : '#64748b'} stroke={isAdded ? '#3b82f6' : '#64748b'} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{node.name}</span>
          </div>
          {isExpanded && renderTree(node.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc', 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, overflow: 'hidden' 
    }}>
      {/* Top Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0.75rem 1.5rem', background: '#fff', borderBottom: '1px solid #e2e8f0',
        height: '60px'
      }}>
        {/* Left: Back Button */}
        <button 
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', background: 'transparent', border: 'none',
            cursor: 'pointer', color: '#64748b', borderRadius: '0.375rem'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Center: Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <button style={{
            padding: '0.5rem 1.75rem', fontSize: '0.9rem', fontWeight: 600,
            background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.375rem', cursor: 'pointer'
          }}>
            Hủy
          </button>
          <button style={{
            padding: '0.5rem 1.75rem', fontSize: '0.9rem', fontWeight: 600,
            background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer'
          }}>
            Tiếp tục
          </button>
        </div>

        {/* Right: Empty for balance */}
        <div style={{ width: '36px' }}></div>
      </div>

      {/* Sub Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0.75rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0'
      }}>
        <input 
          type="text" 
          placeholder="Nhập tên ma trận..." 
          value={matrixName}
          onChange={(e) => setMatrixName(e.target.value)}
          style={{
            padding: '0.5rem 0', background: 'transparent', border: 'none', outline: 'none',
            fontSize: '1rem', color: '#0f172a', fontWeight: 500, width: '300px'
          }}
        />

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600,
            background: '#2e3a8c', color: '#ffffff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="8" y1="13" x2="16" y2="13"></line>
              <line x1="8" y1="17" x2="16" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Xuất Excel
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500,
            background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer'
          }}>
            Danh sách đã tạo
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Split Views */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar */}
        <div style={{ 
          width: '280px', background: '#fff', borderRight: '1px solid #e2e8f0', 
          overflowY: 'auto', paddingTop: '1rem' 
        }}>
          {renderTree()}
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: '#fff' }}>
          
          <div style={{ overflowX: 'auto', border: '1px solid #9ca3af', borderRadius: '4px' }}>
            <table style={{ 
              width: '100%', borderCollapse: 'collapse', textAlign: 'center', 
              fontSize: '0.85rem', color: '#1f2937' 
            }}>
              <thead style={{ background: '#dcfce7', fontWeight: 600 }}>
                <tr>
                  <th rowSpan="2" style={{ border: '1px solid #9ca3af', padding: '0.5rem' }}>STT</th>
                  <th rowSpan="2" style={{ border: '1px solid #9ca3af', padding: '0.5rem', minWidth: '100px' }}>Nội dung<br/>kiến thức</th>
                  <th rowSpan="2" style={{ border: '1px solid #9ca3af', padding: '0.5rem', minWidth: '100px' }}>Yêu cầu<br/>cần đạt</th>
                  <th colSpan="3" style={{ border: '1px solid #9ca3af', padding: '0.5rem' }}>Trắc nghiệm</th>
                  <th colSpan="3" style={{ border: '1px solid #9ca3af', padding: '0.5rem' }}>Trắc nghiệm đúng sai</th>
                  <th colSpan="2" style={{ border: '1px solid #9ca3af', padding: '0.5rem' }}>Tổng</th>
                  <th rowSpan="2" style={{ border: '1px solid #9ca3af', padding: '0.5rem' }}>%<br/>Tổng<br/>điểm</th>
                </tr>
                <tr>
                  {/* Trắc nghiệm (0,1,2) */}
                  <th style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: '#dcfce7', minWidth: '50px' }}>Nhận<br/>biết</th>
                  <th style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: '#dcfce7', minWidth: '50px' }}>Thông<br/>hiểu</th>
                  <th style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: '#dcfce7', minWidth: '50px' }}>Vận<br/>dụng</th>
                  {/* Đúng sai (3,4,5) */}
                  <th style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: '#dcfce7', minWidth: '50px' }}>Nhận<br/>biết</th>
                  <th style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: '#dcfce7', minWidth: '50px' }}>Thông<br/>hiểu</th>
                  <th style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: '#dcfce7', minWidth: '50px' }}>Vận<br/>dụng</th>
                  {/* Tổng */}
                  <th style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: '#dcfce7' }}>TN</th>
                  <th style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: '#dcfce7' }}>DS</th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.length === 0 ? (
                  /* Empty Message Row */
                  <tr>
                    <td style={{ border: '1px solid #9ca3af' }}></td>
                    <td style={{ border: '1px solid #9ca3af' }}></td>
                    <td style={{ border: '1px solid #9ca3af' }}></td>
                    <td colSpan="9" style={{ border: '1px solid #9ca3af', padding: '1rem', color: '#6b7280' }}>
                      Chọn các nội dung kiến thức ở cây thư mục bên cạnh để thêm vào ma trận
                    </td>
                  </tr>
                ) : (
                  /* Render Added Rows */
                  matrixRows.map((row, index) => {
                    const rowTN = getRowTotalCols(row.id, [0, 1, 2]);
                    const rowDS = getRowTotalCols(row.id, [3, 4, 5]);

                    return (
                      <tr key={row.id}>
                        <td style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: '#f8fafc' }}>{index + 1}</td>
                        <td style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: '#f8fafc' }}>{row.noiDung}</td>
                        <td style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: '#f8fafc', position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: row.yeuCau ? 'space-between' : 'flex-end', height: '100%' }}>
                            <span>{row.yeuCau}</span>
                            <button onClick={() => handleRemoveRow(row.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#374151', padding: '0.2rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                        {/* 6 inputs (Trắc nghiệm, Đúng sai) */}
                        {[...Array(6)].map((_, colIndex) => {
                          const available = getMockAvailableCount(row.id, colIndex);
                          const isZero = available === 0;
                          const isActive = activeTooltip?.rowId === row.id && activeTooltip?.colIndex === colIndex;
                          const val = (matrixData[row.id] && matrixData[row.id][colIndex]) !== undefined ? matrixData[row.id][colIndex] : '';

                          return (
                            <td key={colIndex} style={{ border: '1px solid #9ca3af', position: 'relative', width: '50px', height: '40px', background: isActive ? '#dbeafe' : 'transparent' }}>
                              <input 
                                type="text" 
                                value={val}
                                onChange={(e) => handleInputChange(row.id, colIndex, e.target.value)}
                                onFocus={() => setActiveTooltip({ rowId: row.id, colIndex })}
                                onBlur={() => setActiveTooltip(null)}
                                style={{ width: '100%', height: '100%', border: 'none', outline: 'none', textAlign: 'center', background: 'transparent', fontWeight: 500 }} 
                              />
                              {isZero && (
                                <div style={{ position: 'absolute', top: '2px', right: '3px', color: '#f59e0b', fontSize: '10px', pointerEvents: 'none' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="#fff" strokeWidth="1">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <rect x="11" y="6" width="2" height="8" fill="#fff"></rect>
                                    <rect x="11" y="16" width="2" height="2" fill="#fff"></rect>
                                  </svg>
                                </div>
                              )}

                              {/* Tooltip */}
                              {isActive && (
                                <div style={{
                                  position: 'absolute', bottom: 'calc(100% + 5px)', left: '50%', transform: 'translateX(-50%)',
                                  background: isZero ? '#f97316' : '#fef08a', color: isZero ? '#ffffff' : '#1f2937',
                                  padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: 500,
                                  whiteSpace: 'nowrap', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 10,
                                  userSelect: 'none', pointerEvents: 'none'
                                }}>
                                  {isZero ? 'Không có câu hỏi nào' : `Hiện có ${available} câu hỏi`}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        {/* 2 Totals */}
                        <td style={{ border: '1px solid #9ca3af', background: '#e2e8f0', textAlign: 'center', fontWeight: '500' }}>
                          {rowTN}
                        </td>
                        <td style={{ border: '1px solid #9ca3af', background: '#e2e8f0', textAlign: 'center', fontWeight: '500' }}>
                          {rowDS}
                        </td>
                        {/* Percent - editable */}
                        <td style={{ border: '1px solid #9ca3af', position: 'relative', width: '50px', background: '#ffffff', textAlign: 'center' }}>
                           <input 
                              type="text" 
                              value={percentData[row.id] || ''}
                              onChange={(e) => handlePercentChange(row.id, e.target.value)}
                              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', textAlign: 'center', background: 'transparent', fontWeight: 500 }} 
                           />
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Footer Total Row */}
                <tr style={{ background: '#e2e8f0', fontWeight: 600 }}>
                  <td colSpan="3" style={{ border: '1px solid #9ca3af', padding: '0.75rem' }}>Tổng</td>
                  {/* 6 columns mapping */}
                  {[...Array(6)].map((_, i) => (
                    <td key={i} style={{ border: '1px solid #9ca3af', textAlign: 'center' }}>
                      {getColTotal(i)}
                    </td>
                  ))}
                  {/* 2 total columns mapping */}
                  <td style={{ border: '1px solid #9ca3af', textAlign: 'center' }}>
                    {getColTotal(0) + getColTotal(1) + getColTotal(2)}
                  </td>
                  <td style={{ border: '1px solid #9ca3af', textAlign: 'center' }}>
                    {getColTotal(3) + getColTotal(4) + getColTotal(5)}
                  </td>
                  <td style={{ border: '1px solid #9ca3af', textAlign: 'center' }}>
                    {getPercentTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#4b5563', fontStyle: 'italic', lineHeight: '1.6' }}>
            <div>* Với câu hỏi đúng sai, bạn vui lòng nhập tổng số câu đúng sai có trong ma trận là bội của 4</div>
            <div>* Viết tắt: TN {'->'} Trắc nghiệm, DS {'->'} Đúng sai, TLN {'->'} Trả lời ngắn, TL {'->'} Tự luận</div>
            <div>* Bạn cần đặt độ khó cho các câu hỏi trong ngân hàng để có thể tạo đề theo ma trận. <span style={{ color: '#3b82f6', cursor: 'pointer' }}>Tìm hiểu thêm</span></div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TaoMaTranDe;
