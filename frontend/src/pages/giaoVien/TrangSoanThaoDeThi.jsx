import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ViewSoanThaoCauHoi from './ViewSoanThaoCauHoi';

const TrangSoanThaoDeThi = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { fileName, rawText } = location.state || {};

    // Xóa state khỏi browser history ngay sau khi đọc
    useEffect(() => {
        if (location.state) {
            window.history.replaceState(null, '');
        }
    }, [location.state]);

    return (
        <ViewSoanThaoCauHoi 
            initialFileName={fileName || 'Đề thi mới'} 
            initialRawText={typeof rawText === 'string' ? rawText : ""}
            isDeThiDirect={true}
            onClose={() => navigate('/giao-vien/de-thi/tao-moi')} 
        />
    );
};

export default TrangSoanThaoDeThi;
