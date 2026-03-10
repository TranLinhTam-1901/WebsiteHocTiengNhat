import React, { useState, useEffect } from 'react';
import QuestionService from '../../../services/Admin/QuestionService';
import { LessonLookupDTO, QuestionListItem, QuestionStatus, QuestionType, Topics } from '../../../interfaces/Admin/QuestionBank';
import { Dropdown, Table, Tag, Switch, Modal, Button, Select, Input } from 'antd'; 
import { PlusOutlined, LinkOutlined, EditOutlined, DeleteOutlined, SoundOutlined } from '@ant-design/icons';
import { QUESTION_TYPE_OPTIONS, DIFFICULTY_OPTIONS, QUESTION_TYPE_LABELS } from '../../../constants/admin/questionOptions';
import { useNavigate } from 'react-router-dom';
import { ConfigProvider } from "antd";

const QuestionListView = () => {
    const [questions, setQuestions] = useState<QuestionListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkedQuestions, setLinkedQuestions] = useState<any[]>([]);
    const navigate = useNavigate();
    const [topics, setTopicsLookup] = useState<Topics[]>([]);
    const [lessons, setLessons] = useState<LessonLookupDTO[]>([]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Chạy song song các API để tiết kiệm thời gian
                const [topicsData, lessonsData] = await Promise.all([
                    QuestionService.getTopicsLookup(),
                    QuestionService.getLessonsLookup()
                ]);
                
                setTopicsLookup(topicsData);
                setLessons(lessonsData);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu danh mục:", error);
            }
        };

        loadInitialData();
    }, []);

    const [filters, setFilters] = useState({
    lessonId: undefined,
    topicId: undefined,
    difficulty: undefined,
    type: undefined,
    searchTerm: ''
    });

    // Hàm xử lý thay đổi lọc chung
    const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Gọi API với bộ tham số mới nhất
    fetchQuestions(newFilters);
};
    // Khai báo menu cho nút "Create New Question"
    // const createMenuItems = [
    //   {
    //     key: 'single',
    //     label: 'Single Editor (View 2)',
    //     onClick: () => navigate('/admin/question-bank/create')
    //   },
    //   {
    //     key: 'parent-child',
    //     label: 'Parent-Child View (View 3)',
    //     onClick: () => navigate('/admin/question-bank/parent-child')
    //   }
    // ];

    // Khởi tạo lấy danh sách
    const fetchQuestions = async (params: any = {}) => {
       setLoading(true);
        try {
            const data = await QuestionService.getQuestions(params);
            setQuestions(data);
        } catch (error) {
            console.error("Lỗi khi load danh sách:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQuestions(); }, []);

    // Xử lý Toggle Status nhanh
    const handleStatusChange = async (id: string, checked: boolean) => {
        const newStatus = checked ? QuestionStatus.Active : QuestionStatus.Draft;
        await QuestionService.updateStatus(id, newStatus);
        fetchQuestions(); // Refresh lại danh sách
    };

    // Xử lý hiển thị Modal liên kết (Icon xích)
    const showLinks = async (id: string) => {
        setLinkedQuestions([]); 

       try {
        setLoading(true); // Nếu có state loading chung hoặc riêng cho modal
        const links = await QuestionService.getQuestionLinks(id);
        
        // Cập nhật dữ liệu mới từ API
        setLinkedQuestions(links || []);
        
        //  Chỉ mở Modal sau khi đã chắc chắn có dữ liệu hoặc API đã phản hồi
        setIsLinkModalOpen(true);
    } catch (error) {
        console.error("Lỗi khi tải liên kết:", error);
        setLinkedQuestions([]);
        setIsLinkModalOpen(true); // Vẫn mở để hiện thông báo "Chưa có liên kết"
    } finally {
        setLoading(false);
    }
    };

    // Định nghĩa cột cho bảng 
    const columns = [
        {
            title: 'ID',
            dataIndex: 'questionID',
            key: 'id',
            render: (id: string) => <span className="text-gray-400 text-xs">Q-{id.slice(-4).toUpperCase()}</span>
        },
        {
            title: 'NỘI DUNG',
            dataIndex: 'content',
            key: 'content',
            render: (text: string, record: QuestionListItem) => (
                <div className="flex items-center gap-2">
                    {record.hasAudio && <SoundOutlined className="text-blue-500" />}
                    <span className="truncate max-w-xs font-medium">{text}</span>
                </div>
            )
        },
        {
            title: 'LOẠI',
            dataIndex: 'questionType',
            key: 'type',
           render: (type: QuestionType) => {
        // Truy xuất nhãn từ constant bạn đã có
        const label = QUESTION_TYPE_LABELS[type] || "Khác";
        
        // Bạn có thể kết hợp thêm màu sắc dựa trên type
        return <Tag className="  font-bold !text-[#FF6B81] ">{label}</Tag>;
        
            }
        },
        {
            title: 'ĐỘ KHÓ',
            dataIndex: 'difficulty',
            key: 'difficulty',
            render: (level: number) => {
            // Tìm option có value khớp với level từ API
            const option = DIFFICULTY_OPTIONS.find(opt => opt.value === level);
            
            return (
                <Tag  className="font-bold !text-[#FF6B81]">
                    {option ? option.label : `N${level}`}
                </Tag>
            );
    }
        },
        {
            title: 'LIÊN KẾT',
            render: (record: QuestionListItem) => (
                <Button 
                    type="text" 
                    icon={<LinkOutlined className={record.linkedCount > 0 ? "text-pink-500" : "text-gray-300"} />}
                    onClick={() => showLinks(record.questionID)}
                >
                    {record.linkedCount > 0 && <span className="text-xs ml-1">{record.linkedCount}</span>}
                </Button>
            )
        },
        {
            title: 'TRẠNG THÁI',
            render: (record: QuestionListItem) => (
                <div className="flex items-center gap-2">
                    <Switch 
                        size="small" 
                        checked={record.status === QuestionStatus.Active} 
                        onChange={(val : any) => handleStatusChange(record.questionID, val)}
                    />
                    <span className={record.status === QuestionStatus.Active ? "text-pink-500" : "text-gray-400"}>
                        {record.status === QuestionStatus.Active ? "Active" : "Draft"}
                    </span>
                </div>
            )
        },
        {
            title: 'THAO TÁC',
            render: (record: QuestionListItem) => (
                <div className="flex gap-2">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record.questionID)} />
                    {/* <Button type="text" danger icon={<DeleteOutlined />} /> */}
                </div>
            )
        }
    ];

    // Hàm xử lý khi nhấn nút Sửa
    const handleEdit = (questionID: string) => {
        navigate(`/admin/question-bank/edit/${questionID}`);
    };
    
    return (
        <div className="p-6 min-h-screen bg-[#FFF8F9]">
            {/* Header: Title & Create Dropdown */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#2D3748]">Ngân hàng câu hỏi</h1>
                    <p className="text-gray-500 text-sm">Quản lý và tổ chức kho câu hỏi tiếng Nhật của bạn</p>
                </div>
                    <Button type="primary" 
                        size="large" 
                        className="!bg-[#FF6B81] !border-none hover:!opacity-90 !rounded-lg shadow-[0_4px_12px_rgba(255,107,129,0.3)]"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/admin/question-bank/create')}
                    >    Tạo câu hỏi mới
                    </Button>
                </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl border border-[#FFD1D8]
                            flex flex-wrap gap-4 mb-6">
               {/* 1. Lọc theo Bài học (Lesson) */}
                <Select 
                    placeholder="Tất cả bài học" 
                    className="w-48"
                    allowClear
                    value={filters.lessonId}
                    onChange={(val) => handleFilterChange('lessonId', val)}
                   options={lessons.map(item => ({
                        value: item.lessonID, 
                        label: item.title     
                    }))}
                />

                {/* 2. Lọc theo Chủ đề (Topic) */}
                <Select 
                    placeholder="Tất cả chủ đề" 
                    className="w-48"
                    allowClear
                    value={filters.topicId}
                    onChange={(val) => handleFilterChange('topicId', val)}
                    options={topics.map(item => ({
                        value: item.topicID,
                        label: item.topicName
                    }))}
                />

                {/* 3. Lọc theo Độ khó (Difficulty) - Khớp với int? difficulty của API */}
                <Select 
                    placeholder="Độ khó (N5 - N1)" 
                    className="w-48"
                    allowClear
                    value={filters.difficulty}
                    onChange={(val) => handleFilterChange('difficulty', val)}
                    options={DIFFICULTY_OPTIONS}
                />

                {/* 4. Lọc theo Loại (Type) - Sử dụng QUESTION_TYPE_OPTIONS bạn đã có */}
                <Select 
                    placeholder="Loại câu hỏi" 
                    className="w-48"
                    allowClear
                    value={filters.type}
                    options={QUESTION_TYPE_OPTIONS}
                    onChange={(val) => handleFilterChange('type', val)}
                />

                {/* 5. Tìm kiếm nội dung (SearchTerm) */}
                {/* <Input 
                    placeholder="Tìm kiếm nội dung..." 
                    className="flex-1"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                    allowClear
                /> */}
            </div>


            <ConfigProvider
            theme={{
                token: {
                colorPrimary: "#FF6B81"
                },
            }}
            >
            <Table
                columns={columns}
                dataSource={questions}
                rowKey="questionID"
                loading={loading}
                className="rounded-xl border border-[#FFD1D8] overflow-hidden"
                pagination={{ pageSize: 5}}
            />
            </ConfigProvider>

            {/* Modal hiển thị liên kết (Icon xích) */}
            <Modal
                    title={<span className="text-[#FF6B81] font-semibold">Câu hỏi liên kết</span>}
                    open={isLinkModalOpen}
                    onCancel={() => setIsLinkModalOpen(false)}
                    footer={null}
                    width={400}
                    className="custom-link-modal"
                >
                {linkedQuestions.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {linkedQuestions.map((item) => (
                            <div
                                key={item.questionID}
                                className="p-3 bg-[#FFF6F8] border border-[#FFD1D8] rounded-lg flex items-center justify-between hover:bg-[#FFE9EE] transition"
                            >
                                <span className="truncate flex-1 text-sm text-gray-700">
                                    {item.content}
                                </span>

                                <Tag
                                    className="ml-2 border-[#FF6B81] text-[#FF6B81] bg-[#FFF0F3]"
                                >
                                    {item.relation}
                                </Tag>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-gray-400">
                        Chưa có liên kết nào
                    </div>
                )}
            </Modal>
        </div>
    );
};
export default QuestionListView;