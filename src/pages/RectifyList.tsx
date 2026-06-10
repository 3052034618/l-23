import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  User,
  Calendar as CalendarIcon,
  Camera,
  CheckCircle,
  XCircle,
  Plus,
  X,
  ChevronRight,
  MapPin,
  Edit,
  Image as ImageIcon,
} from 'lucide-react';
import Header from '@/components/Header';
import { useAppStore } from '@/store/useAppStore';
import { getSeverityText, getSeverityColor, getStatusText, getStatusColor } from '@/utils/scoreUtils';
import { compressImage, generateId } from '@/utils/imageUtils';
import type { RectifyTask } from '@/types';

export default function RectifyList() {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reviewFileInputRef = useRef<HTMLInputElement>(null);

  const { records, addRectifyTask, updateRectifyTask, getRecord } = useAppStore();
  const record = records.find((r) => r.id === recordId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RectifyTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [newTask, setNewTask] = useState({
    description: '',
    position: '',
    severity: 'medium' as 'urgent' | 'high' | 'medium' | 'low',
    assignee: '',
    deadline: '',
  });

  const [reviewNote, setReviewNote] = useState('');

  const filteredTasks = record?.rectifyTasks.filter((task) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') {
      return task.status === 'completed' || task.status === 'reviewed';
    }
    return task.status === filterStatus;
  }).sort((a, b) => {
    const severityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  }) || [];

  const groupedTasks = {
    urgent: filteredTasks.filter((t) => t.severity === 'urgent'),
    high: filteredTasks.filter((t) => t.severity === 'high'),
    medium: filteredTasks.filter((t) => t.severity === 'medium'),
    low: filteredTasks.filter((t) => t.severity === 'low'),
  };

  const handleAddTask = () => {
    if (!newTask.description.trim() || !record) return;

    addRectifyTask(record.id, {
      description: newTask.description,
      position: newTask.position,
      severity: newTask.severity,
      status: 'pending',
      assignee: newTask.assignee || undefined,
      deadline: newTask.deadline || undefined,
    });

    setNewTask({
      description: '',
      position: '',
      severity: 'medium',
      assignee: '',
      deadline: '',
    });
    setShowAddModal(false);
  };

  const handleTaskClick = (task: RectifyTask) => {
    setSelectedTask(task);
    setReviewNote('');
    setShowDetailModal(true);
  };

  const handleUpdateStatus = (taskId: string, status: RectifyTask['status']) => {
    if (!record) return;
    updateRectifyTask(record.id, taskId, { status });
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, status });
    }
  };

  const handleUploadCompletionPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !record || !selectedTask) return;

    try {
      const compressed = await compressImage(file);
      updateRectifyTask(record.id, selectedTask.id, {
        completionPhoto: compressed,
        status: 'completed',
      });
      setSelectedTask({ ...selectedTask, completionPhoto: compressed, status: 'completed' });
    } catch (error) {
      console.error('Photo upload failed:', error);
    }
  };

  const handleReview = (result: 'pass' | 'fail') => {
    if (!record || !selectedTask) return;

    updateRectifyTask(record.id, selectedTask.id, {
      reviewResult: result,
      reviewDate: new Date().toISOString().split('T')[0],
      reviewNote: reviewNote || undefined,
      status: 'reviewed',
    });

    setShowDetailModal(false);
    setSelectedTask(null);
  };

  const handleComplete = () => {
    navigate('/records');
  };

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="整改清单" showBack />
        <div className="p-8 text-center text-gray-500">评估记录不存在</div>
      </div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'high':
        return <AlertTriangle size={16} className="text-orange-500" />;
      case 'medium':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return <Clock size={16} className="text-green-500" />;
    }
  };

  const stats = {
    total: record.rectifyTasks.length,
    pending: record.rectifyTasks.filter((t) => t.status === 'pending').length,
    inProgress: record.rectifyTasks.filter((t) => t.status === 'in_progress').length,
    completed: record.rectifyTasks.filter((t) => t.status === 'completed' || t.status === 'reviewed').length,
  };

  const TaskCard = ({ task }: { task: RectifyTask }) => (
    <div
      onClick={() => handleTaskClick(task)}
      className="card p-4 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getSeverityIcon(task.severity)}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSeverityColor(task.severity)}`}>
            {getSeverityText(task.severity)}
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
          {getStatusText(task.status)}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-900 mb-1">{task.description}</p>
      <div className="flex items-center text-xs text-gray-500 gap-3">
        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {task.position || '未指定位置'}
        </span>
        {task.assignee && (
          <span className="flex items-center gap-1">
            <User size={12} />
            {task.assignee}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header
        title="整改清单"
        showBack
        rightAction={
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 -mr-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Plus size={22} />
          </button>
        }
      />

      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <MapPin size={16} className="text-primary-500" />
          <span className="font-medium text-gray-900">{record.storeName}</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '全部', value: stats.total, key: 'all' },
            { label: '待处理', value: stats.pending, key: 'pending' },
            { label: '进行中', value: stats.inProgress, key: 'in_progress' },
            { label: '已完成', value: stats.completed, key: 'completed' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterStatus(item.key)}
              className={`p-2 rounded-xl text-center transition-all ${
                filterStatus === item.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="text-xl font-bold">{item.value}</div>
              <div className="text-xs">{item.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {Object.entries(groupedTasks).map(([severity, tasks]) => {
          if (tasks.length === 0) return null;
          return (
            <div key={severity}>
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                {getSeverityIcon(severity)}
                {getSeverityText(severity)}优先级
                <span className="text-gray-400">({tasks.length})</span>
              </h3>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无整改任务</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 btn btn-primary"
            >
              <Plus size={18} className="mr-1" />
              添加任务
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40">
        <button onClick={handleComplete} className="w-full btn btn-primary text-base py-3">
          完成巡店
          <ChevronRight size={20} className="ml-1" />
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 md:items-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">添加整改任务</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  问题描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="请描述需要整改的问题"
                  className="input h-24 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  位置
                </label>
                <input
                  type="text"
                  value={newTask.position}
                  onChange={(e) => setNewTask({ ...newTask, position: e.target.value })}
                  placeholder="例如：饮料区A货架第2层"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  紧急程度
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'urgent', label: '紧急' },
                    { value: 'high', label: '高' },
                    { value: 'medium', label: '中' },
                    { value: 'low', label: '低' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setNewTask({ ...newTask, severity: s.value as any })}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${
                        newTask.severity === s.value
                          ? getSeverityColor(s.value) + ' text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  责任人
                </label>
                <input
                  type="text"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  placeholder="请输入责任人姓名"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  截止日期
                </label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  className="input"
                />
              </div>

              <button
                onClick={handleAddTask}
                disabled={!newTask.description.trim()}
                className="w-full btn btn-primary"
              >
                <Plus size={18} className="mr-1" />
                添加任务
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 md:items-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">任务详情</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getSeverityColor(selectedTask.severity)}`}>
                  {getSeverityText(selectedTask.severity)}优先级
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(selectedTask.status)}`}>
                  {getStatusText(selectedTask.status)}
                </span>
              </div>

              <div>
                <h4 className="text-base font-medium text-gray-900 mb-2">问题描述</h4>
                <p className="text-sm text-gray-600">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">位置</p>
                  <p className="text-sm text-gray-900">{selectedTask.position || '未指定'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">责任人</p>
                  <p className="text-sm text-gray-900">{selectedTask.assignee || '未指定'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">截止日期</p>
                  <p className="text-sm text-gray-900">{selectedTask.deadline || '未设置'}</p>
                </div>
              </div>

              {selectedTask.completionPhoto && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">完成照片</p>
                  <img
                    src={selectedTask.completionPhoto}
                    alt="完成照片"
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {selectedTask.status === 'pending' && (
                <button
                  onClick={() => handleUpdateStatus(selectedTask.id, 'in_progress')}
                  className="w-full btn btn-secondary"
                >
                  开始处理
                </button>
              )}

              {(selectedTask.status === 'pending' || selectedTask.status === 'in_progress') && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleUploadCompletionPhoto}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full btn btn-accent"
                  >
                    <Camera size={18} className="mr-2" />
                    上传完成照片
                  </button>
                </>
              )}

              {selectedTask.status === 'completed' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      复查意见
                    </label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="请输入复查意见"
                      className="input h-20 resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleReview('fail')}
                      className="btn btn-danger"
                    >
                      <XCircle size={18} className="mr-1" />
                      不通过
                    </button>
                    <button
                      onClick={() => handleReview('pass')}
                      className="btn btn-primary"
                    >
                      <CheckCircle size={18} className="mr-1" />
                      通过
                    </button>
                  </div>
                </div>
              )}

              {selectedTask.status === 'reviewed' && (
                <div className={`p-4 rounded-xl ${selectedTask.reviewResult === 'pass' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedTask.reviewResult === 'pass' ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <XCircle className="text-red-500" size={20} />
                    )}
                    <span className={`font-medium ${selectedTask.reviewResult === 'pass' ? 'text-green-700' : 'text-red-700'}`}>
                      {selectedTask.reviewResult === 'pass' ? '复查通过' : '复查不通过'}
                    </span>
                  </div>
                  {selectedTask.reviewNote && (
                    <p className="text-sm text-gray-600">{selectedTask.reviewNote}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    复查时间：{selectedTask.reviewDate}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
