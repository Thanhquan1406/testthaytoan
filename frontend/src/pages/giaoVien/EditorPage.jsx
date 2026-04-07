import { useLocation, useNavigate } from 'react-router-dom';
import QuestionEditorView from './QuestionEditorView';

const EditorPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { fileName, rawText, selectedBank } = location.state || {};

    if (!fileName || !rawText) {
        // Fallback nếu người dùng vào thẳng link /ngan-hang/editor mà chưa chọn file
        navigate('/ngan-hang/dashboard', { replace: true });
        return null;
    }

    return (
        <QuestionEditorView 
            initialFileName={fileName} 
            initialRawText={rawText} 
            onClose={() => navigate('/ngan-hang/view-ngan-hang', { state: { selectedBank } })} 
        />
    );
};

export default EditorPage;
