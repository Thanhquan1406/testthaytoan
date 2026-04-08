import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ViewSoanThaoCauHoi from './ViewSoanThaoCauHoi';

const TrangSoanThao = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { fileName, rawText, selectedBank, fromMatrix, matrixName, isCompose, generatedQuestions } = location.state || {};

    const isMatrixFlow = fromMatrix === true;

    // Xóa state khỏi browser history ngay sau khi đọc
    // → khi F5, location.state sẽ là null → editor render với nội dung rỗng (không redirect)
    useEffect(() => {
        if (location.state) {
            window.history.replaceState(null, '');
        }
    }, []);

    const nganHangId = selectedBank?._id || selectedBank?.id || null;

    if (!nganHangId) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Không tìm thấy thông tin Ngân hàng. Vui lòng quay lại và thử lại.</div>;
    }

    return (
        <ViewSoanThaoCauHoi 
            initialFileName={isMatrixFlow ? matrixName : (fileName || '')} 
            initialRawText={rawText || (isMatrixFlow ? "[!b:$Phần I. Câu trắc nghiệm nhiều phương án lựa chọn.$] Mỗi câu hỏi thí sinh chỉ chọn một phương án." : '')}
            nganHangId={nganHangId}
            generatedQuestions={generatedQuestions}
            onClose={() => navigate('/ngan-hang/view-ngan-hang', { state: { selectedBank } })} 
        />
    );
};

export default TrangSoanThao;
