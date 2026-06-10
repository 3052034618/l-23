import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  LayoutGrid,
  Eye,
  Star,
  ChevronRight,
  TrendingUp,
  Calendar,
  MapPin,
} from 'lucide-react';
import Header from '@/components/Header';
import ScoreRadar from '@/components/ScoreRadar';
import { useAppStore } from '@/store/useAppStore';
import { getLevelText, getLevelColor, getLevelBgColor, calculateScore } from '@/utils/scoreUtils';

interface ScoreDimension {
  key: 'tidiness' | 'fullness' | 'visibility' | 'focusRatio';
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const initialScores = {
  tidiness: 80,
  visibility: 80,
  focusRatio: 80,
};

export default function ScorePanel() {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { calculateAndSetScore, records, generateRectifyTasksFromEvaluation } = useAppStore();

  const record = records.find((r) => r.id === recordId);

  const [tidiness, setTidiness] = useState(record?.score.tidiness || 80);
  const [visibility, setVisibility] = useState(record?.score.visibility || 80);
  const [focusRatio, setFocusRatio] = useState(record?.score.focusRatio || 80);

  const [score, setScore] = useState(record?.score || {
    tidiness: 80,
    fullness: 100,
    visibility: 80,
    focusRatio: 80,
    total: 85,
    level: 'good' as const,
  });

  useEffect(() => {
    if (record) {
      const calculatedScore = calculateScore(
        tidiness,
        record.outOfStockItems,
        visibility,
        focusRatio
      );
      setScore(calculatedScore);
    }
  }, [tidiness, visibility, focusRatio, record]);

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="评分面板" showBack />
        <div className="p-8 text-center text-gray-500">评估记录不存在</div>
      </div>
    );
  }

  const dimensions: ScoreDimension[] = [
    {
      key: 'tidiness',
      label: '整洁度',
      icon: <Sparkles size={20} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      key: 'fullness',
      label: '丰满度',
      icon: <LayoutGrid size={20} />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      key: 'visibility',
      label: '动线可见性',
      icon: <Eye size={20} />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      key: 'focusRatio',
      label: '重点商品占比',
      icon: <Star size={20} />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const handleSaveAndNext = () => {
    calculateAndSetScore(record.id, tidiness, visibility, focusRatio);
    generateRectifyTasksFromEvaluation(record.id);
    navigate(`/rectify/${record.id}`);
  };

  const getScoreColor = (value: number) => {
    if (value >= 90) return 'text-green-600';
    if (value >= 75) return 'text-blue-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return 'bg-green-500';
    if (value >= 75) return 'bg-blue-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="评分面板" showBack />

      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white px-4 pb-8 pt-6">
        <div className="flex items-center gap-2 text-sm text-primary-100 mb-4">
          <MapPin size={14} />
          <span>{record.storeName}</span>
          <span className="mx-1">·</span>
          <Calendar size={14} />
          <span>{record.visitDate}</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-primary-100 text-sm mb-1">综合评分</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold">{score.total}</span>
              <span className="text-lg">分</span>
            </div>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getLevelBgColor(score.level)} ${getLevelColor(score.level)}`}>
              {getLevelText(score.level)}
            </span>
          </div>

          <div className="bg-white/10 rounded-2xl p-1 -mr-2">
            <ScoreRadar score={score} size={140} />
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="card p-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-500" />
            各维度评分
          </h3>

          <div className="space-y-4">
            {dimensions.map((dim) => {
              const value = score[dim.key as keyof typeof score] as number;
              const isEditable = dim.key === 'tidiness' || dim.key === 'visibility' || dim.key === 'focusRatio';

              return (
                <div key={dim.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${dim.bgColor}`}>
                        <span className={dim.color}>{dim.icon}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{dim.label}</span>
                    </div>
                    <span className={`text-lg font-bold ${getScoreColor(value)}`}>
                      {value}分
                    </span>
                  </div>

                  {isEditable ? (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={
                        dim.key === 'tidiness'
                          ? tidiness
                          : dim.key === 'visibility'
                          ? visibility
                          : focusRatio
                      }
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (dim.key === 'tidiness') setTidiness(val);
                        else if (dim.key === 'visibility') setVisibility(val);
                        else if (dim.key === 'focusRatio') setFocusRatio(val);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                  ) : (
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(value)} rounded-full transition-all duration-500`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  )}

                  {dim.key === 'fullness' && (
                    <p className="text-xs text-gray-500">
                      根据 {record.outOfStockItems.length} 处缺货自动计算
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-3">评分依据</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              <p>
                <span className="font-medium">整洁度（25%）：</span>
                货架整体整洁程度、商品排列整齐度
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <p>
                <span className="font-medium">丰满度（30%）：</span>
                根据缺货数量自动计算，高优缺货扣10分
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
              <p>
                <span className="font-medium">动线可见性（25%）：</span>
                主通道、端架、堆头的商品可见度
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
              <p>
                <span className="font-medium">重点商品占比（20%）：</span>
                重点商品陈列面积占比是否达标
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-medium text-gray-900 mb-3">检查项统计</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {record.priceTagChecks.filter((c) => c.checked).length}/
                {record.priceTagChecks.length}
              </p>
              <p className="text-sm text-blue-600 mt-1">价格牌检查</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">
                {record.promoChecks.filter((c) => c.checked).length}/
                {record.promoChecks.length}
              </p>
              <p className="text-sm text-orange-600 mt-1">促销物料检查</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40">
        <button onClick={handleSaveAndNext} className="w-full btn btn-accent text-base py-3">
          生成整改清单
          <ChevronRight size={20} className="ml-1" />
        </button>
      </div>
    </div>
  );
}
