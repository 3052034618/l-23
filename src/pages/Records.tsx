import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  Calendar,
  MapPin,
  ChevronRight,
  X,
  Store,
  Tag,
  Star,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import Header from '@/components/Header';
import { useAppStore } from '@/store/useAppStore';
import { getLevelText, getLevelColor, getLevelBgColor } from '@/utils/scoreUtils';
import { categories } from '@/data/mockData';
import type { ScoreLevel } from '@/types';

export default function Records() {
  const navigate = useNavigate();
  const { records, stores } = useAppStore();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (dateRange.start) {
      result = result.filter((r) => r.visitDate >= dateRange.start);
    }
    if (dateRange.end) {
      result = result.filter((r) => r.visitDate <= dateRange.end);
    }

    if (selectedStore !== 'all') {
      result = result.filter((r) => r.storeId === selectedStore);
    }

    if (selectedCategory !== 'all') {
      result = result.filter((r) => r.storeCategory === selectedCategory);
    }

    if (selectedLevel !== 'all') {
      result = result.filter((r) => r.score.level === selectedLevel);
    }

    return result.sort(
      (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    );
  }, [records, selectedStore, selectedCategory, selectedLevel, dateRange]);

  const hasActiveFilters =
    selectedStore !== 'all' ||
    selectedCategory !== 'all' ||
    selectedLevel !== 'all' ||
    dateRange.start ||
    dateRange.end;

  const activeFilterCount = [
    selectedStore !== 'all',
    selectedCategory !== 'all',
    selectedLevel !== 'all',
    dateRange.start || dateRange.end,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSelectedStore('all');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setDateRange({ start: '', end: '' });
  };

  const handleRecordClick = (recordId: string) => {
    navigate(`/score/${recordId}`);
  };

  const groupedRecords = useMemo(() => {
    const groups: Record<string, typeof records> = {};
    filteredRecords.forEach((record) => {
      const date = record.visitDate;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
    });
    return groups;
  }, [filteredRecords]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <Header
        title="巡店记录"
        rightAction={
          <button
            onClick={() => setShowFilterModal(true)}
            className="relative p-1.5 -mr-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter size={22} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        }
      />

      <div className="px-4 py-4">
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            <span className="text-sm text-gray-500 flex-shrink-0">已选筛选：</span>
            {selectedStore !== 'all' && (
              <span className="tag tag-primary flex items-center gap-1 flex-shrink-0">
                {stores.find((s) => s.id === selectedStore)?.name || selectedStore}
                <button
                  onClick={() => setSelectedStore('all')}
                  className="hover:text-primary-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="tag tag-accent flex items-center gap-1 flex-shrink-0">
                {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="hover:text-accent-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedLevel !== 'all' && (
              <span className="tag tag-success flex items-center gap-1 flex-shrink-0">
                {getLevelText(selectedLevel as ScoreLevel)}
                <button
                  onClick={() => setSelectedLevel('all')}
                  className="hover:text-green-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex-shrink-0"
            >
              全部清除
            </button>
          </div>
        )}

        <div className="space-y-6">
          {Object.entries(groupedRecords).map(([date, dayRecords]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-500">{date}</span>
                <span className="text-xs text-gray-400">({dayRecords.length}条记录)</span>
              </div>

              <div className="space-y-3">
                {dayRecords.map((record, index) => (
                  <div
                    key={record.id}
                    onClick={() => handleRecordClick(record.id)}
                    className="card p-4 cursor-pointer hover:shadow-md transition-all animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={record.shelfPhoto}
                        alt="货架照片"
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 truncate">
                              {record.storeName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="tag tag-primary">
                                {record.storeCategory}
                              </span>
                              <span
                                className={`tag ${getLevelBgColor(record.score.level)} ${getLevelColor(record.score.level)}`}
                              >
                                {getLevelText(record.score.level)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${getLevelColor(record.score.level)}`}>
                              {record.score.total}
                            </div>
                            <div className="text-xs text-gray-400">分</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {record.outOfStockItems.length}处缺货
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle size={12} />
                            {record.priceTagChecks.filter((c) => c.checked).length}/
                            {record.priceTagChecks.length}价格牌
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={12} />
                            {record.rectifyTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length}待整改
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-16">
            <Store size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">暂无巡店记录</p>
            <p className="text-sm text-gray-400">调整筛选条件或开始新的巡店</p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 btn btn-secondary"
              >
                清除筛选
              </button>
            )}
          </div>
        )}
      </div>

      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 md:items-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">筛选条件</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Calendar size={16} />
                  日期范围
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="input flex-1 text-sm"
                  />
                  <span className="text-gray-400 flex items-center">至</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="input flex-1 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Store size={16} />
                  门店
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="input"
                >
                  <option value="all">全部门店</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Tag size={16} />
                  品类
                </label>
                <div className="flex flex-wrap gap-2">
                  {['all', ...categories].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        selectedCategory === cat
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat === 'all' ? '全部' : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Star size={16} />
                  评分等级
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'all', label: '全部' },
                    { value: 'excellent', label: '优秀' },
                    { value: 'good', label: '良好' },
                    { value: 'pass', label: '合格' },
                    { value: 'fail', label: '不合格' },
                  ].map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setSelectedLevel(level.value)}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedLevel === level.value
                          ? level.value === 'all'
                            ? 'bg-primary-600 text-white'
                            : getLevelBgColor(level.value as ScoreLevel) + ' ' + getLevelColor(level.value as ScoreLevel)
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetFilters}
                  className="flex-1 btn btn-secondary"
                >
                  重置
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 btn btn-primary"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
