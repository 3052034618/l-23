import type { OutOfStockItem, Score, ScoreLevel } from '@/types';

export function calculateScore(
  tidiness: number,
  outOfStockItems: OutOfStockItem[],
  visibility: number,
  focusRatio: number
): Score {
  let fullnessDeduction = 0;
  outOfStockItems.forEach((item) => {
    switch (item.severity) {
      case 'high':
        fullnessDeduction += 10;
        break;
      case 'medium':
        fullnessDeduction += 5;
        break;
      case 'low':
        fullnessDeduction += 2;
        break;
    }
  });
  const fullness = Math.max(0, 100 - fullnessDeduction);

  const total = Math.round(
    tidiness * 0.25 + fullness * 0.30 + visibility * 0.25 + focusRatio * 0.20
  );

  let level: ScoreLevel;
  if (total >= 90) {
    level = 'excellent';
  } else if (total >= 75) {
    level = 'good';
  } else if (total >= 60) {
    level = 'pass';
  } else {
    level = 'fail';
  }

  return {
    tidiness,
    fullness,
    visibility,
    focusRatio,
    total,
    level,
  };
}

export function getLevelText(level: ScoreLevel): string {
  const map: Record<ScoreLevel, string> = {
    excellent: '优秀',
    good: '良好',
    pass: '合格',
    fail: '不合格',
  };
  return map[level];
}

export function getLevelColor(level: ScoreLevel): string {
  const map: Record<ScoreLevel, string> = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    pass: 'text-yellow-600',
    fail: 'text-red-600',
  };
  return map[level];
}

export function getLevelBgColor(level: ScoreLevel): string {
  const map: Record<ScoreLevel, string> = {
    excellent: 'bg-green-100',
    good: 'bg-blue-100',
    pass: 'bg-yellow-100',
    fail: 'bg-red-100',
  };
  return map[level];
}

export function getSeverityText(severity: string): string {
  const map: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低',
  };
  return map[severity] || severity;
}

export function getSeverityColor(severity: string): string {
  const map: Record<string, string> = {
    urgent: 'text-red-600 bg-red-100',
    high: 'text-orange-600 bg-orange-100',
    medium: 'text-yellow-600 bg-yellow-100',
    low: 'text-green-600 bg-green-100',
  };
  return map[severity] || 'text-gray-600 bg-gray-100';
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    reviewed: '已复查',
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'text-gray-600 bg-gray-100',
    in_progress: 'text-blue-600 bg-blue-100',
    completed: 'text-green-600 bg-green-100',
    reviewed: 'text-purple-600 bg-purple-100',
  };
  return map[status] || 'text-gray-600 bg-gray-100';
}
