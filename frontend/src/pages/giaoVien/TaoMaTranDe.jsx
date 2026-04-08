import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { layCauTruc, taoDeTuMaTran } from '../../services/nganHangService';

const TaoMaTranDe = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedBank = location.state?.selectedBank;
  const [matrixName, setMatrixName] = useState('');
  const [structures, setStructures] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState([]);
  const [matrixRows, setMatrixRows] = useState([]);
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  // Lưu trữ dữ liệu các ô nhập số lượng câu: { [rowId]: { [colIndex]: number } }
  const [matrixData, setMatrixData] = useState({});
  // Lưu trữ dữ liệu ô % tổng điểm: { [rowId]: string }
  const [percentData, setPercentData] = useState({});
  const [showNameError, setShowNameError] = useState(false);

  useEffect(() => {
     if (selectedBank?._id) {
         layCauTruc(selectedBank._id).then(res => {
             const list = Array.isArray(res) ? res : (res?.data || []);
             setStructures(list);
             // Tự động mở tất cả các node bằng cách lấy mảng id
             setExpandedNodes(list.map(s => s._id || s.id));
         });
     }
  }, [selectedBank?._id]);

  const handleInputChange = (rowId, colIndex, value) => {
    let num = parseInt(value, 10);
    if (value === "") num = "";
    if (isNaN(num) && value !== "") return; // chỉ cho nhập số
    
    // Validate with available constraint
    const available = getAvailableCount(rowId, colIndex);
    if (num > available) num = available;

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

  const getAvailableCount = (rowId, colIndex) => {
    const row = matrixRows.find(r => r.id === rowId);
    if (!row) return 0;
    
    if (colIndex === 0) return row.nb || 0;
    if (colIndex === 1) return row.th || 0;
    if (colIndex === 2) return row.vh || 0;
    
    // Chưa hỗ trợ đếm Đúng Sai (3,4,5) vì backend hiện chỉ lưu form TRAC_NGHIEM
    return 0;
  };

  const toggleNode = (e, id) => {
    e.stopPropagation();
    setExpandedNodes(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const handleAddRow = (node) => {
    const nodeId = node._id || node.id;
    if (matrixRows.some(row => row.id === nodeId)) return;
    
    const nodeParentId = node.parentId?._id || node.parentId || undefined;
    let parentObj = structures.find(s => (s._id || s.id) === nodeParentId);
    let parentName = parentObj ? parentObj.ten : "";

    const hasChildren = structures.some(s => {
        const pId = s.parentId?._id || s.parentId || undefined;
        return pId === nodeId;
    });
    const type = hasChildren ? "Khung kiến thức" : "Đơn vị kiến thức";

    let noiDung = "";
    let yeuCau = "";
    
    if (type === "Đơn vị kiến thức") {
        noiDung = parentName;
        yeuCau = node.ten;
    } else {
        noiDung = node.ten;
        yeuCau = "";
    }

    setMatrixRows([...matrixRows, {
        id: nodeId,
        noiDung,
        yeuCau,
        nodeType: type,
        nb: node.soCauHoiNB || 0,
        th: node.soCauHoiTH || 0,
        vh: node.soCauHoiVH || 0
    }]);
  };

  const handleRemoveRow = (id) => {
    setMatrixRows(matrixRows.filter(row => row.id !== id));
  };

  const renderTree = (parentId = undefined, depth = 0) => {
    const nodes = structures.filter(s => {
        const pId = s.parentId?._id || s.parentId || undefined;
        return pId === parentId;
    });
    
    if (!nodes.length) return null;

    return nodes.map(node => {
      const nodeId = node._id || node.id;
      const hasChildren = structures.some(s => {
          const pId = s.parentId?._id || s.parentId || undefined;
          return pId === nodeId;
      });
      const isExpanded = expandedNodes.includes(nodeId);

      const isAdded = matrixRows.some(row => row.id === nodeId);

      return (
        <div key={nodeId} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1rem', paddingLeft: `${1 + depth * 1.5}rem`,
            cursor: 'pointer', transition: 'background 0.2s',
            color: isAdded ? '#3b82f6' : 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          onClick={() => handleAddRow(node)}
          >
            {hasChildren ? (
              <span onClick={(e) => toggleNode(e, nodeId)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
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
            
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isAdded ? '#bfdbfe' : 'var(--text-secondary)'} stroke={isAdded ? '#3b82f6' : 'var(--text-secondary)'} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{node.ten}</span>
          </div>
          {isExpanded && renderTree(nodeId, depth + 1)}
        </div>
      );
    });
  };

  const handleExportExcel = () => {
    const ws_data = [
      ["STT", "Nội dung kiến thức", "Yêu cầu cần đạt", "Trắc nghiệm", "", "", "Trắc nghiệm đúng sai", "", "", "Tổng", "", "% Tổng điểm"],
      ["", "", "", "Nhận biết", "Thông hiểu", "Vận dụng", "Nhận biết", "Thông hiểu", "Vận dụng", "TN", "DS", ""]
    ];

    matrixRows.forEach((row, index) => {
      const rowNum0 = parseInt(matrixData[row.id]?.[0]) || 0;
      const rowNum1 = parseInt(matrixData[row.id]?.[1]) || 0;
      const rowNum2 = parseInt(matrixData[row.id]?.[2]) || 0;
      const rowNum3 = parseInt(matrixData[row.id]?.[3]) || 0;
      const rowNum4 = parseInt(matrixData[row.id]?.[4]) || 0;
      const rowNum5 = parseInt(matrixData[row.id]?.[5]) || 0;
      
      ws_data.push([
        index + 1, row.noiDung, row.yeuCau,
        rowNum0, rowNum1, rowNum2, rowNum3, rowNum4, rowNum5,
        rowNum0 + rowNum1 + rowNum2, rowNum3 + rowNum4 + rowNum5,
        percentData[row.id] || ""
      ]);
    });

    ws_data.push([
      "Tổng", "", "",
      getColTotal(0), getColTotal(1), getColTotal(2),
      getColTotal(3), getColTotal(4), getColTotal(5),
      getColTotal(0) + getColTotal(1) + getColTotal(2),
      getColTotal(3) + getColTotal(4) + getColTotal(5),
      getPercentTotal()
    ]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
      { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, { s: { r: 0, c: 3 }, e: { r: 0, c: 5 } },
      { s: { r: 0, c: 6 }, e: { r: 0, c: 8 } }, { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } },
      { s: { r: 0, c: 11 }, e: { r: 1, c: 11 } }, { s: { r: ws_data.length - 1, c: 0 }, e: { r: ws_data.length - 1, c: 2 } }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ma Tran");
    XLSX.writeFile(wb, (matrixName || "Ma_Tran_De_Thi") + ".xlsx");
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-surface-muted)', 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, overflow: 'hidden' 
    }}>
      {/* Top Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0.75rem 1.5rem', background: 'var(--bg-surface)', borderBottom: '1px solid #e2e8f0',
        height: '60px'
      }}>
        {/* Left: Back Button */}
        <button 
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', background: 'transparent', border: 'none',
            cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: '0.375rem'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Center: Input */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '300px' }}>
          <input 
            type="text" 
            placeholder="Nhập tên ma trận..." 
            value={matrixName}
            onChange={(e) => setMatrixName(e.target.value)}
            style={{
              padding: '0.5rem 1rem', background: 'var(--bg-surface-muted)', border: '1px solid #cbd5e1', outline: 'none', borderRadius: '0.375rem',
              fontSize: '0.95rem', color: '#0f172a', fontWeight: 500, width: '100%', textAlign: 'center'
            }}
          />
          {showNameError && (
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '0.5rem', background: '#dc2626', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontSize: '0.85rem', fontWeight: 500, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 10, whiteSpace: 'nowrap' }}>
              Vui lòng nhập tên ma trận đề thi
              {/* MUI-like arrow */}
              <div style={{ position: 'absolute', top: '-4px', left: '50%', width: '8px', height: '8px', background: '#dc2626', transform: 'translateX(-50%) rotate(45deg)' }}></div>
            </div>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={{
            padding: '0.5rem 1.5rem', fontSize: '0.9rem', fontWeight: 600,
            background: 'var(--bg-page)', color: '#475569', border: 'none', borderRadius: '0.375rem', cursor: 'pointer'
          }}>
            Hủy
          </button>
          <button 
            onClick={async () => {
              if(!matrixName.trim()) {
                setShowNameError(true);
                setTimeout(() => setShowNameError(false), 3000);
                return;
              }

              // Thu thập requirements từ matrixData
              const requirements = [];
              matrixRows.forEach(row => {
                  const nb = matrixData[row.id]?.[0] || 0;
                  const th = matrixData[row.id]?.[1] || 0;
                  const vh = matrixData[row.id]?.[2] || 0;
                  if (nb > 0) requirements.push({ cauTrucId: row.id, doKho: 'NB', count: nb });
                  if (th > 0) requirements.push({ cauTrucId: row.id, doKho: 'TH', count: th });
                  if (vh > 0) requirements.push({ cauTrucId: row.id, doKho: 'VH', count: vh });
              });

              if (requirements.length === 0) {
                 alert('Ma trận hiện tại đang trống! Vui lòng nhập số câu hỏi vào ít nhất 1 ô.');
                 return;
              }

              try {
                  // Hiển thị một style loading nhỏ trên nút (có thể tối giản bằng cách thay đổi text thành "Đang tạo...")
                  // Gọi API Backend lấy danh sách random câu hỏi khớp ma trận
                  const response = await taoDeTuMaTran(selectedBank._id, requirements);
                  const questions = response.data || [];
                  
                  // Format Text
                  let generatedText = "[!b:$Phần I. Câu trắc nghiệm nhiều phương án lựa chọn.$] Mỗi câu hỏi thí sinh chỉ chọn một phương án.\n\n";
                  questions.forEach((q, idx) => {
                       generatedText += `Câu ${idx + 1}. ${q.noiDung}\n`;
                       const dArr = ['A', 'B', 'C', 'D'];
                       const luaChon = [q.luaChonA, q.luaChonB, q.luaChonC, q.luaChonD];
                       
                       for (let i = 0; i < luaChon.length; i++) {
                           if (luaChon[i]) {
                               const isCorrect = q.dapAnDung === dArr[i];
                               generatedText += `${isCorrect ? '*' : ''}${dArr[i]}. ${luaChon[i]}\n`;
                           }
                       }
                       generatedText += `\n`;
                  });

                  // Navigate với dữ liệu đã format ready
                  navigate('/ngan-hang/editor', { 
                    state: { 
                      fromMatrix: true, 
                      matrixName, 
                      rawText: generatedText,
                      selectedBank,
                      generatedQuestions: questions
                    } 
                  });
              } catch (err) {
                  alert('Lỗi tạo đề từ ma trận: ' + err.message);
              }
            }}
            style={{
            padding: '0.5rem 1.5rem', fontSize: '0.9rem', fontWeight: 600,
            background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer'
          }}>
            Tiếp tục
          </button>
        </div>
      </div>

      {/* Sub Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0.75rem 1.5rem', background: 'var(--bg-surface-muted)', borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ width: '10px' }}></div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleExportExcel}
            style={{
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
            background: 'var(--bg-surface-muted)', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer'
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
          width: '280px', background: 'var(--bg-surface)', borderRight: '1px solid #e2e8f0', 
          overflowY: 'auto', paddingTop: '1rem' 
        }}>
          {renderTree()}
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-surface)' }}>
          
          <div style={{ overflowX: 'auto', border: '1px solid #9ca3af', borderRadius: '4px' }}>
            <table style={{ 
              width: '100%', borderCollapse: 'collapse', textAlign: 'center', 
              fontSize: '0.85rem', color: 'var(--text-primary)' 
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
                    <td colSpan="9" style={{ border: '1px solid #9ca3af', padding: '1rem', color: 'var(--text-secondary)' }}>
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
                        <td style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: 'var(--bg-surface-muted)' }}>{index + 1}</td>
                        <td style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: 'var(--bg-surface-muted)' }}>{row.noiDung}</td>
                        <td style={{ border: '1px solid #9ca3af', padding: '0.5rem', background: 'var(--bg-surface-muted)', position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: row.yeuCau ? 'space-between' : 'flex-end', height: '100%' }}>
                            <span>{row.yeuCau}</span>
                            <button onClick={() => handleRemoveRow(row.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '0.2rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                        {/* 6 inputs (Trắc nghiệm, Đúng sai) */}
                        {[...Array(6)].map((_, colIndex) => {
                          const available = getAvailableCount(row.id, colIndex);
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
                                  background: isZero ? '#f97316' : '#fef08a', color: isZero ? '#ffffff' : 'var(--text-primary)',
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
                        <td style={{ border: '1px solid #9ca3af', position: 'relative', width: '50px', background: 'var(--bg-surface)', textAlign: 'center' }}>
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

          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.6' }}>
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
