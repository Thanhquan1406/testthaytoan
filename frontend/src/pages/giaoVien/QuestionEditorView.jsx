import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';

const MOCK_STRUCTURES = [
    { id: 1, name: "L1. Chương 1", type: "Khung kiến thức", parentId: undefined },
    { id: 2, name: "L2. hhh", type: "Khung kiến thức", parentId: 1 },
    { id: 3, name: "L1. hhh", type: "Khung kiến thức", parentId: undefined },
    { id: 4, name: "L2. Xin chào", type: "Đơn vị kiến thức", parentId: 3 },
    { id: 5, name: "L1. hhh(2)", type: "Khung kiến thức", parentId: undefined },
    { id: 6, name: "L2. hh", type: "Đơn vị kiến thức", parentId: 5 }
];

const QuestionEditorView = ({ initialFileName, initialRawText, onClose }) => {
    const { user } = useAuthContext();
    const [rawText, setRawText] = useState(initialRawText || '');
    const [fileName, setFileName] = useState(initialFileName || '');
    const [goToQuestion, setGoToQuestion] = useState('1');
    const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
    const [totalScoreInput, setTotalScoreInput] = useState('10');
    const [scores, setScores] = useState({});
    const [editingScoreIdx, setEditingScoreIdx] = useState(null);
    const [questionLevels, setQuestionLevels] = useState({});
    const [activeLevelMenuIdx, setActiveLevelMenuIdx] = useState(null);
    const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isFinalReviewPhase, setIsFinalReviewPhase] = useState(false);
    const [isClassificationStep, setIsClassificationStep] = useState(false);
    const [selectedForClassification, setSelectedForClassification] = useState([]);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [parsedQuestions, setParsedQuestions] = useState([]);
    
    // States for Standards (YCCĐ)
    const [questionStandards, setQuestionStandards] = useState({});
    const [isStandardModalOpen, setIsStandardModalOpen] = useState(false);
    const [editingStandardIdx, setEditingStandardIdx] = useState(null);
    const [activeQuickApplyIdx, setActiveQuickApplyIdx] = useState(null);
    const [collapsedStandardIds, setCollapsedStandardIds] = useState([]);
    const [searchStandardText, setSearchStandardText] = useState("");
    const [toastMessage, setToastMessage] = useState(null);

    const [lineCount, setLineCount] = useState(1);
    const lineNumbersRef = useRef(null);
    const uploadRef = useRef(null);
    const hiddenFileInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (uploadRef.current && !uploadRef.current.contains(event.target)) {
                setIsUploadMenuOpen(false);
            }
            if (!event.target.closest('.level-menu-container')) {
                setActiveLevelMenuIdx(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleScroll = (e) => {
        if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = e.target.scrollTop;
        }
    };

    const handleGoToQuestion = () => {
        const target = document.getElementById(`question-${goToQuestion}`);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            alert(`Không tìm thấy Câu ${goToQuestion}`);
        }
    };

    const toggleCorrectAnswer = (q, selectedAns) => {
        if (selectedAns.isCorrect) return; // already correct
        
        let newLines = rawText.split('\n');
        
        // Remove * from other answers
        q.answers.forEach(ans => {
             let lineContent = newLines[ans.lineIndex];
             // remove leading space + *
             lineContent = lineContent.replace(/^(\s*)\*/, '$1');
             newLines[ans.lineIndex] = lineContent;
        });

        // Add * to selected answer
        let targetContent = newLines[selectedAns.lineIndex];
        // matches 'A.' or '  B.' and injects *
        newLines[selectedAns.lineIndex] = targetContent.replace(/^(\s*)([A-Z]\.)/, '$1*$2');

        setRawText(newLines.join('\n'));
    };

    const handleFileUploadClick = () => {
        setIsUploadMenuOpen(false);
        if (hiddenFileInputRef.current) {
            hiddenFileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            alert(`Bạn đã chọn file: ${file.name}. Việc đọc word file thực tế sẽ được tích hợp sau.`);
            // Reset input so user can choose same file again if needed
            e.target.value = null; 
        }
    };

    useEffect(() => {
        setLineCount(rawText.split('\n').length);
        
        if (!rawText) {
            setParsedQuestions([]);
            return;
        }

        const lines = rawText.split('\n');
        const questions = [];
        let currentQuestion = null;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.trim().match(/^Câu \d+\./)) {
                if (currentQuestion) questions.push(currentQuestion);
                currentQuestion = {
                    title: line.trim(),
                    answers: []
                };
            } else if (currentQuestion && line.trim().match(/^(\*?[A-Z]\.)/)) {
                const isCorrect = line.trim().startsWith('*');
                let rawAnswerStr = line.trim();
                if (isCorrect) rawAnswerStr = rawAnswerStr.substring(1); // remove *
                
                currentQuestion.answers.push({
                    letter: rawAnswerStr.substring(0, 1), // Only take 'A', 'B' without dot
                    text: rawAnswerStr.substring(2).trim(),
                    isCorrect,
                    lineIndex: i
                });
            } else if (currentQuestion && line.trim()) {
                if (currentQuestion.answers.length === 0) {
                    currentQuestion.title += '\n' + line.trim();
                } else {
                    currentQuestion.answers[currentQuestion.answers.length - 1].text += '\n' + line.trim();
                }
            }
        }
        if (currentQuestion) questions.push(currentQuestion);
        setParsedQuestions(questions);
    }, [rawText]);

    if (isClassificationStep) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f4f5f7', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, overflowY: 'auto' }}>
                {/* Topbar */}
                <div style={{ height: '60px', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 1.5rem', justifyContent: 'space-between', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <button onClick={() => setIsClassificationStep(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    {/* Đã gỡ bỏ hiển thị Profile User theo yêu cầu */}
                </div>

                {/* Top Toast Error Message */}
                {toastMessage && (
                    <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#dc2626', color: '#fff', padding: '1rem 3rem', borderRadius: '0.25rem', fontWeight: 500, fontSize: '1.05rem', zIndex: 99999, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        {toastMessage}
                    </div>
                )}

                {/* Content */}
                <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937', fontWeight: 600 }}>Phân loại yêu cầu cần đạt cho từng câu hỏi</h2>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>({parsedQuestions.length} câu hỏi)</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#374151', fontSize: '0.95rem', fontWeight: 500 }}>
                                <input 
                                    type="checkbox" 
                                    style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                                    checked={selectedForClassification.length === parsedQuestions.length && parsedQuestions.length > 0}
                                    onChange={(e) => {
                                        if(e.target.checked) setSelectedForClassification(parsedQuestions.map((_, i) => i));
                                        else setSelectedForClassification([]);
                                    }}
                                />
                                Chọn tất cả (đã chọn {selectedForClassification.length} câu)
                            </label>
                            
                            <button 
                                onClick={() => {
                                    if (selectedForClassification.length === 0) {
                                        setToastMessage("Vui lòng chọn ít nhất một câu hỏi để lưu");
                                        setTimeout(() => setToastMessage(null), 3000);
                                        return;
                                    }
                                    const sortedSelected = [...selectedForClassification].sort((a,b) => a - b);
                                    for (let id of sortedSelected) {
                                        if (!questionStandards[id]) {
                                            setToastMessage(`Vui lòng chọn yêu cầu cần đạt cho câu ${id + 1}`);
                                            setTimeout(() => setToastMessage(null), 3000);
                                            return;
                                        }
                                    }

                                    alert('Đã lưu vào ngân hàng thành công!');
                                    // Normally you would redirect here
                                    onClose();
                                }}
                                style={{ padding: '0.625rem 1.25rem', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                Lưu vào ngân hàng
                            </button>
                        </div>
                    </div>

                    {/* Câu hỏi list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
                        {parsedQuestions.map((q, idx) => {
                            const mapLevelToAbbr = {
                                'Nhận biết': 'NB',
                                'Thông hiểu': 'TH',
                                'Vận dụng': 'VD'
                            };
                            const levelText = questionLevels[idx];
                            const badge = levelText ? mapLevelToAbbr[levelText] : null;
                            const isChecked = selectedForClassification.includes(idx);
                            const correctAns = q.answers.find(a => a.isCorrect);

                            return (
                                <div key={idx} style={{ background: '#fff', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
                                    {/* Header card */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <input 
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    if(e.target.checked) setSelectedForClassification([...selectedForClassification, idx]);
                                                    else setSelectedForClassification(selectedForClassification.filter(id => id !== idx));
                                                }}
                                                style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }} 
                                            />
                                            <span style={{ fontWeight: 600, color: '#1f2937' }}>{q.title.split('.')[0]}</span>
                                            <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                                                Trắc nghiệm <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            </span>
                                            {/* Mức độ (Tag) Menu */}
                                            <div className="level-menu-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '0.25rem' }}>
                                                <span 
                                                    onClick={() => setActiveLevelMenuIdx(activeLevelMenuIdx === idx ? null : idx)}
                                                    style={{ cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.15rem 0.35rem', borderRadius: '0.25rem' }}
                                                >
                                                    {questionLevels[idx] ? (
                                                        <span style={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: 500 }}>{questionLevels[idx]}</span>
                                                    ) : (
                                                        <span style={{ color: '#dc2626', fontSize: '0.9rem', fontWeight: 500 }}>*Chọn độ khó</span>
                                                    )}
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={questionLevels[idx] ? "#4b5563" : "#2563eb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                                                </span>
                                                
                                                {activeLevelMenuIdx === idx && (
                                                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', width: '320px', zIndex: 60, padding: '0.5rem 0', overflow: 'hidden' }}>
                                                        {['Nhận biết', 'Thông hiểu', 'Vận dụng'].map(level => (
                                                            <div 
                                                                key={level}
                                                                onClick={() => {
                                                                    setQuestionLevels({...questionLevels, [idx]: level});
                                                                    setActiveLevelMenuIdx(null);
                                                                }}
                                                                style={{ padding: '0.6rem 1.25rem', cursor: 'pointer', color: '#1f2937', fontSize: '0.9rem' }} onMouseEnter={(e) => { e.target.style.background = '#f9fafb'; e.target.style.color = '#2563eb'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#1f2937'; }}
                                                            >
                                                                {level}
                                                            </div>
                                                        ))}
                                                        <div style={{ height: '1px', background: '#e5e7eb', margin: '0.35rem 0' }}></div>
                                                        {['Nhận biết', 'Thông hiểu', 'Vận dụng'].map(level => (
                                                            <div 
                                                                key={`${level}-all`}
                                                                onClick={() => {
                                                                    const newLevels = { ...questionLevels };
                                                                    for (let i = idx; i < parsedQuestions.length; i++) {
                                                                        newLevels[i] = level;
                                                                    }
                                                                    setQuestionLevels(newLevels);
                                                                    setActiveLevelMenuIdx(null);
                                                                }}
                                                                style={{ padding: '0.6rem 1.25rem', cursor: 'pointer', color: '#1f2937', fontSize: '0.9rem' }} onMouseEnter={(e) => { e.target.style.background = '#f9fafb'; e.target.style.color = '#2563eb'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#1f2937'; }}
                                                            >
                                                                {level} - Cho câu này và các câu bên dưới
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nội dung */}
                                    <div style={{ fontWeight: 600, color: '#374151', marginBottom: '1.25rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
                                        {q.title.includes('.') ? q.title.substring(q.title.indexOf('.') + 1).trim() : q.title}
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                        {q.answers.map((ans, aIdx) => {
                                            const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                                            return (
                                                <div key={aIdx} style={{ display: 'flex', gap: '0.5rem', color: '#1f2937', fontWeight: 500, fontSize: '0.95rem' }}>
                                                    <span style={{ fontWeight: 600 }}>{letters[aIdx]}.</span>
                                                    <span>{ans.text.replace(/^[A-F]\.\s*/, '')}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    
                                    {correctAns && (
                                        <div style={{ color: '#65a30d', fontWeight: 600, fontSize: '0.95rem', marginBottom: '1rem' }}>
                                            Đáp án: {['A', 'B', 'C', 'D', 'E', 'F'][q.answers.indexOf(correctAns)]}
                                        </div>
                                    )}

                                    {/* Footer Require */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0 1rem 0' }}>
                                        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                                        <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Yêu cầu cần đạt</span>
                                        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {!questionStandards[idx] ? (
                                            <>
                                                <span style={{ color: '#ef4444', fontSize: '1rem', fontWeight: 500 }}>*Vui lòng chọn yêu cầu cần đạt</span>
                                                <span 
                                                    onClick={() => { setEditingStandardIdx(idx); setIsStandardModalOpen(true); }}
                                                    style={{ color: '#3b82f6', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    Sửa
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 500 }}>{questionStandards[idx].name}</span>
                                                <span 
                                                    onClick={() => { setEditingStandardIdx(idx); setIsStandardModalOpen(true); }}
                                                    style={{ color: '#3b82f6', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    Sửa
                                                </span>
                                                <div style={{ position: 'relative' }}>
                                                    <span 
                                                        onClick={() => setActiveQuickApplyIdx(activeQuickApplyIdx === idx ? null : idx)}
                                                        style={{ background: '#e5e7eb', color: '#1f2937', padding: '0.35rem 0.75rem', borderRadius: '1rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                                                    >
                                                        Áp dụng nhanh
                                                    </span>
                                                    
                                                    {activeQuickApplyIdx === idx && (
                                                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', width: '220px', zIndex: 60, overflow: 'hidden' }}>
                                                            <div 
                                                                onClick={() => {
                                                                    const newSTDs = { ...questionStandards };
                                                                    for (let i = idx; i < parsedQuestions.length; i++) {
                                                                        newSTDs[i] = questionStandards[idx];
                                                                    }
                                                                    setQuestionStandards(newSTDs);
                                                                    setActiveQuickApplyIdx(null);
                                                                }}
                                                                style={{ padding: '0.75rem 1rem', cursor: 'pointer', color: '#374151', fontSize: '0.95rem' }} onMouseEnter={(e) => { e.target.style.background = '#f9fafb'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                                                            >
                                                                Toàn bộ câu bên dưới
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Modal Yêu cầu cần đạt */}
                {isStandardModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '800px', maxWidth: '90vw', height: '80vh', maxHeight: '700px', background: '#f4f5f7', borderRadius: '0.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {/* Modal Body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', margin: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                                {/* Search bar */}
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Gõ nội dung để tìm kiếm"
                                        value={searchStandardText}
                                        onChange={(e) => setSearchStandardText(e.target.value)}
                                        style={{ width: '100%', padding: '0.625rem 2.5rem 0.625rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.9rem', outline: 'none' }} 
                                    />
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </div>
                                
                                {/* Tree View */}
                                <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid #f3f4f6', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                    {(() => {
                                        const renderTree = (parentId = undefined, depth = 0) => {
                                            const children = MOCK_STRUCTURES.filter(s => s.parentId === parentId);
                                            if (children.length === 0) return null;
                                            
                                            return children.map((structure, index) => {
                                                const hasChildren = MOCK_STRUCTURES.some(s => s.parentId === structure.id);
                                                const isCollapsed = collapsedStandardIds.includes(structure.id);
                                                const isDonViKienThuc = structure.type === "Đơn vị kiến thức";
                                                
                                                if (searchStandardText && !structure.name.toLowerCase().includes(searchStandardText.toLowerCase())) {
                                                    if (!hasChildren) return null;
                                                }

                                                return (
                                                    <div key={structure.id}>
                                                        <div 
                                                            onClick={() => {
                                                                if (isDonViKienThuc) {
                                                                    setQuestionStandards({...questionStandards, [editingStandardIdx]: structure});
                                                                    setIsStandardModalOpen(false);
                                                                } else if (hasChildren) {
                                                                    setCollapsedStandardIds(prev => prev.includes(structure.id) ? prev.filter(x => x !== structure.id) : [...prev, structure.id]);
                                                                }
                                                            }}
                                                            style={{ 
                                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                                padding: `0.5rem 0.5rem 0.5rem ${depth * 1.5 + 0.5}rem`,
                                                                cursor: isDonViKienThuc || hasChildren ? 'pointer' : 'default',
                                                                color: isDonViKienThuc ? '#2563eb' : '#374151',
                                                                background: 'transparent', borderRadius: '0.25rem'
                                                            }}
                                                            onMouseEnter={(e) => { if(isDonViKienThuc) e.currentTarget.style.background = '#eff6ff'; else if(hasChildren) e.currentTarget.style.background = '#f3f4f6'; }}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            {hasChildren ? (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points={isCollapsed ? "9 18 15 12 9 6" : "6 9 12 15 18 9"}></polyline>
                                                                </svg>
                                                            ) : (
                                                                <div style={{ width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <div style={{ width: '3px', height: '3px', background: '#9ca3af', borderRadius: '50%' }}></div>
                                                                </div>
                                                            )}
                                                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{structure.name}</span>
                                                        </div>
                                                        
                                                        {(!isCollapsed && hasChildren) && renderTree(structure.id, depth + 1)}
                                                    </div>
                                                );
                                            });
                                        };
                                        return renderTree();
                                    })()}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{ padding: '1rem 1.5rem', background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                                <button 
                                    onClick={() => setIsStandardModalOpen(false)}
                                    style={{ padding: '0.5rem 2rem', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
            {/* MODAL THÔNG TIN ĐỀ */}
            {isInfoModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '0.5rem', width: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#1f2937', fontWeight: 600, fontSize: '1.2rem' }}>Thông tin đề</h3>
                            <button onClick={() => { setIsInfoModalOpen(false); setIsFinalReviewPhase(false); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        
                        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                            <div style={{ marginBottom: '1.5rem', color: '#374151', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                <div>Tổng số câu trong đề thi: <strong>{parsedQuestions.length} câu</strong></div>
                                <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>*Số trong () để đánh dấu câu hỏi đó thuộc nhóm hoặc phần của đề thi</div>
                            </div>
                            
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', fontSize: '0.9rem', color: '#374151' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, borderRight: '1px solid #e5e7eb', width: '30%' }}>Thông tin</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #e5e7eb', width: '15%' }}>Số lượng</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Danh sách các câu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '1rem', borderRight: '1px solid #e5e7eb', verticalAlign: 'top' }}>Tổng số câu trắc nghiệm</td>
                                        <td style={{ padding: '1rem', borderRight: '1px solid #e5e7eb', textAlign: 'center', verticalAlign: 'top', fontWeight: 600 }}>{parsedQuestions.length}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {parsedQuestions.map((_, idx) => (
                                                    <span key={idx} style={{ padding: '0.35rem 0.75rem', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '0.25rem', fontSize: '0.85rem', color: '#4b5563' }}>Câu {idx + 1}</span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '1rem', borderRight: '1px solid #e5e7eb', verticalAlign: 'top' }}>Tổng số câu chưa chọn đáp án</td>
                                        <td style={{ padding: '1rem', borderRight: '1px solid #e5e7eb', textAlign: 'center', verticalAlign: 'top', fontWeight: 600 }}>
                                            {parsedQuestions.filter(q => !q.answers.some(a => a.isCorrect)).length}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {parsedQuestions.map((q, idx) => !q.answers.some(a => a.isCorrect) ? (
                                                    <span key={idx} style={{ padding: '0.35rem 0.75rem', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '0.25rem', fontSize: '0.85rem', color: '#ef4444' }}>Câu {idx + 1}</span>
                                                ) : null)}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* FINAL REVIEW FOOTER TÙY CHỌN */}
                        {isFinalReviewPhase && (
                            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#fafafa', borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}>
                                <button onClick={() => { setIsInfoModalOpen(false); setIsFinalReviewPhase(false); }} style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Quay lại sửa</button>
                                <button 
                                    onClick={() => { 
                                        setIsInfoModalOpen(false); 
                                        setIsFinalReviewPhase(false); 
                                        setIsClassificationStep(true);
                                    }} 
                                    style={{ padding: '0.5rem 1.75rem', background: '#2563eb', border: 'none', borderRadius: '0.375rem', fontWeight: 600, color: '#fff', cursor: 'pointer' }}
                                >
                                    Tiếp tục
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL CHIA ĐIỂM */}
            {isScoreModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '0.5rem', width: '500px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontWeight: 600, fontSize: '1.1rem' }}>Chia điểm nhanh</h3>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                            <span style={{ color: '#374151', fontWeight: 600 }}>Tổng điểm trắc nghiệm ({parsedQuestions.length} Câu)</span>
                            <input 
                                type="number" 
                                value={totalScoreInput} 
                                onChange={(e) => setTotalScoreInput(e.target.value)}
                                style={{ width: '80px', padding: '0.625rem', border: '1px solid #1f2937', borderRadius: '0.375rem', outline: 'none', textAlign: 'center', fontWeight: 600 }} 
                            />
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                            <button onClick={() => setIsScoreModalOpen(false)} style={{ padding: '0.5rem 1.5rem', background: '#fff', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontWeight: 600, color: '#4b5563', cursor: 'pointer' }}>Đóng</button>
                            <button onClick={() => {
                                if (parsedQuestions.length === 0) return;
                                const score = parseFloat(totalScoreInput) / parsedQuestions.length;
                                const roundedScore = Math.round(score * 100) / 100;
                                const newScores = {};
                                parsedQuestions.forEach((_, idx) => newScores[idx] = roundedScore);
                                setScores(newScores);
                                setIsScoreModalOpen(false);
                            }} style={{ padding: '0.5rem 1.5rem', background: '#1e3a8a', border: 'none', borderRadius: '0.375rem', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Chia</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOPBAR */}
            <div style={{ height: '56px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 1rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', color: '#1f2937', fontSize: '0.875rem', minWidth: '350px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
                    {showValidationErrors && (
                        <div style={{ position: 'absolute', right: '100%', marginRight: '0.5rem', background: '#dc2626', color: '#fff', padding: '0.625rem 1.25rem', borderRadius: '0.25rem', whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: 500, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            Vui lòng nhập đáp án cho câu hỏi
                        </div>
                    )}
                    <button style={{ padding: '0.5rem 1rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }} onClick={onClose}>Hủy</button>
                    <button 
                        onClick={() => {
                            const hasErrors = parsedQuestions.some(q => !q.answers.some(a => a.isCorrect));
                            if (hasErrors) {
                                setShowValidationErrors(true);
                                setTimeout(() => setShowValidationErrors(false), 3000);
                            } else {
                                setIsInfoModalOpen(true);
                                setIsFinalReviewPhase(true);
                            }
                        }}
                        style={{ padding: '0.5rem 1rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                        Tiếp tục
                    </button>
                </div>
            </div>

            {/* TOOLBAR */}
            <div style={{ height: '48px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: '2rem', fontSize: '0.85rem', color: '#374151' }}>
                <div onClick={() => setIsScoreModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#2563eb', fontWeight: 600, background: '#eff6ff', padding: '0.25rem 0.75rem', borderRadius: '0.25rem' }}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6H4v-6z"></path><path d="M14 4h6v6h-6V4z"></path><path d="M14 14h6v6h-6v-6z"></path></svg>
                   Chia điểm
                </div>
                <div onClick={() => { setIsInfoModalOpen(true); setIsFinalReviewPhase(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                   Thông tin đề
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                    Đi đến câu <input type="text" value={goToQuestion} onChange={(e) => setGoToQuestion(e.target.value)} style={{ width: '40px', padding: '0.25rem', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: '0.25rem', outline: 'none' }} /> 
                    <button onClick={handleGoToQuestion} style={{ background: '#1e3a8a', color: '#fff', border: 'none', padding: '0.375rem 0.75rem', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 500 }}>Đến</button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto', fontWeight: 500 }}>
                    <div ref={uploadRef} style={{ position: 'relative' }}>
                        <span 
                            onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.5rem', background: isUploadMenuOpen ? '#f3f4f6' : 'transparent', borderRadius: '0.25rem', transition: 'background 0.2s', marginLeft: '-0.5rem' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> 
                            Upload
                        </span>
                        
                        {isUploadMenuOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: '-0.5rem', marginTop: '0.25rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', width: '220px', zIndex: 50, padding: '0.5rem 0', overflow: 'hidden' }}>
                                <div onClick={handleFileUploadClick} style={{ padding: '0.75rem 1.25rem', cursor: 'pointer', color: '#1f2937', fontSize: '0.9rem', fontWeight: 400 }} onMouseEnter={(e) => { e.target.style.background = '#f9fafb'; e.target.style.fontWeight = '500'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.fontWeight = '400'; }}>
                                    Upload file chèn vào đề thi
                                </div>
                                <div onClick={handleFileUploadClick} style={{ padding: '0.75rem 1.25rem', cursor: 'pointer', color: '#1f2937', fontSize: '0.9rem', fontWeight: 400 }} onMouseEnter={(e) => { e.target.style.background = '#f9fafb'; e.target.style.fontWeight = '500'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.fontWeight = '400'; }}>
                                    Upload file để tạo đề mới
                                </div>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={hiddenFileInputRef} 
                            style={{ display: 'none' }} 
                            onChange={handleFileChange}
                            accept=".doc,.docx,.txt" 
                        />
                    </div>
                    <span style={{ cursor: 'pointer' }}>+ Chọn từ ngân hàng cá nhân</span>
                    <span style={{ cursor: 'pointer' }}>⋮</span>
                </div>
            </div>

            {/* DUAL PANE */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* LEFT PANE - RENDERED CARDS */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
                        {parsedQuestions.map((q, idx) => (
                            <div id={`question-${idx + 1}`} key={idx} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                                {/* Card Header Toolbar */}
                                <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
                                    <span style={{ fontWeight: 600, color: '#2563eb' }}>{q.title.split('.')[0]}.</span>
                                    <span 
                                        onClick={() => setEditingScoreIdx(idx)}
                                        style={{ color: '#0ea5e9', cursor: 'pointer', fontWeight: 600, background: scores[idx] !== undefined || editingScoreIdx === idx ? '#e0f2fe' : 'transparent', padding: scores[idx] !== undefined || editingScoreIdx === idx ? '0.15rem 0.5rem' : '0', borderRadius: '0.25rem', minWidth: '60px', textAlign: 'center' }}
                                    >
                                        {editingScoreIdx === idx ? (
                                            <input 
                                                autoFocus
                                                type="number"
                                                value={scores[idx] !== undefined ? scores[idx] : ''}
                                                onChange={(e) => setScores({...scores, [idx]: e.target.value})}
                                                onBlur={() => setEditingScoreIdx(null)}
                                                onKeyDown={(e) => e.key === 'Enter' && setEditingScoreIdx(null)}
                                                style={{ width: '40px', background: 'transparent', border: 'none', outline: 'none', color: '#0ea5e9', fontWeight: 600, textAlign: 'center' }}
                                            />
                                        ) : (
                                            scores[idx] !== undefined && scores[idx] !== "" ? `${scores[idx]} điểm` : 'Nhập điểm'
                                        )}
                                    </span>
                                    <span style={{ color: '#9ca3af', cursor: 'pointer', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>Trắc nghiệm <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
                                    
                                    {/* Mức độ (Tag) Menu */}
                                    <div className="level-menu-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <span 
                                            onClick={() => setActiveLevelMenuIdx(activeLevelMenuIdx === idx ? null : idx)}
                                            style={{ color: questionLevels[idx] ? '#2563eb' : '#9ca3af', cursor: 'pointer', display: 'flex', gap: '0.35rem', alignItems: 'center', padding: '0.15rem 0.35rem', borderRadius: '0.25rem', transition: 'background 0.2s', background: questionLevels[idx] ? '#eff6ff' : 'transparent', fontWeight: questionLevels[idx] ? 600 : 400 }}
                                            onMouseEnter={(e) => { if(!questionLevels[idx]) e.target.style.color = '#4b5563'; }}
                                            onMouseLeave={(e) => { if(!questionLevels[idx]) e.target.style.color = '#9ca3af'; }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                                            {questionLevels[idx] && <span style={{ fontSize: '0.8rem' }}>{questionLevels[idx]}</span>}
                                        </span>
                                        
                                        {activeLevelMenuIdx === idx && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.35rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', width: '320px', zIndex: 60, padding: '0.5rem 0', overflow: 'hidden' }}>
                                                {['Nhận biết', 'Thông hiểu', 'Vận dụng'].map(level => (
                                                    <div 
                                                        key={level}
                                                        onClick={() => {
                                                            setQuestionLevels({...questionLevels, [idx]: level});
                                                            setActiveLevelMenuIdx(null);
                                                        }}
                                                        style={{ padding: '0.6rem 1.25rem', cursor: 'pointer', color: '#1f2937', fontSize: '0.9rem' }} onMouseEnter={(e) => { e.target.style.background = '#f9fafb'; e.target.style.color = '#2563eb'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#1f2937'; }}
                                                    >
                                                        {level}
                                                    </div>
                                                ))}
                                                <div style={{ height: '1px', background: '#e5e7eb', margin: '0.35rem 0' }}></div>
                                                {['Nhận biết', 'Thông hiểu', 'Vận dụng'].map(level => (
                                                    <div 
                                                        key={`${level}-all`}
                                                        onClick={() => {
                                                            const newLevels = { ...questionLevels };
                                                            for (let i = idx; i < parsedQuestions.length; i++) {
                                                                newLevels[i] = level;
                                                            }
                                                            setQuestionLevels(newLevels);
                                                            setActiveLevelMenuIdx(null);
                                                        }}
                                                        style={{ padding: '0.6rem 1.25rem', cursor: 'pointer', color: '#1f2937', fontSize: '0.9rem' }} onMouseEnter={(e) => { e.target.style.background = '#f9fafb'; e.target.style.color = '#2563eb'; }} onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#1f2937'; }}
                                                    >
                                                        {level} - Cho câu này và các câu bên dưới
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ width: '1px', height: '16px', background: '#e5e7eb' }}></div>
                                    <span style={{ marginLeft: 'auto', color: '#9ca3af', cursor: 'pointer' }}>⋮</span>
                                </div>
                                {/* Card Body */}
                                <div style={{ padding: '1.25rem' }}>
                                    <div style={{ fontWeight: 600, color: '#374151', marginBottom: '1.25rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
                                        {q.title.includes('.') ? q.title.substring(q.title.indexOf('.') + 1).trim() : q.title}
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {q.answers.map((ans, aIdx) => (
                                            <div 
                                                key={aIdx} 
                                                onClick={() => toggleCorrectAnswer(q, ans)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                            >
                                                {/* Checkmark placeholder to keep alignment */}
                                                <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                                                    {ans.isCorrect && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                                    <div style={{ 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        width: '40px', height: '36px',
                                                        border: ans.isCorrect ? '1px solid #3b82f6' : '1px solid #d1d5db', 
                                                        borderRadius: '0.25rem', background: '#fff', fontSize: '0.9rem', color: '#4b5563', fontWeight: 600,
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        {ans.letter}
                                                    </div>
                                                    <span style={{ fontSize: '0.95rem', color: '#1f2937' }}>{ans.text}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {showValidationErrors && !q.answers.some(a => a.isCorrect) && (
                                        <div style={{ color: '#ef4444', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', fontWeight: 500 }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                            Vui lòng nhập đáp án cho câu hỏi này
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANE - RAW EDITOR */}
                <div style={{ width: '50%', borderLeft: '1px solid #d1d5db', display: 'flex', flexDirection: 'column', background: '#fff' }}>
                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        {/* Line Numbers */}
                        <div 
                            ref={lineNumbersRef}
                            style={{ 
                            width: '40px', background: '#f9fafb', borderRight: '1px solid #e5e7eb', 
                            paddingTop: '1rem', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', 
                            alignItems: 'center', color: '#9ca3af', fontFamily: 'monospace', fontSize: '0.85rem',
                            userSelect: 'none', overflowY: 'hidden'
                        }}>
                            {Array.from({ length: Math.max(lineCount, 50) }).map((_, i) => (
                                <div key={i} style={{ lineHeight: 1.6, minHeight: '1.35rem' }}>{i + 1}</div>
                            ))}
                        </div>
                        {/* Text Area */}
                        <textarea 
                            value={rawText} 
                            onChange={(e) => setRawText(e.target.value)}
                            onScroll={handleScroll}
                            style={{ 
                                flex: 1, border: 'none', outline: 'none', padding: '1rem', 
                                fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6, 
                                color: '#b91c1c', resize: 'none', whiteSpace: 'pre', overflowX: 'auto', overflowY: 'auto'
                            }} 
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionEditorView;
