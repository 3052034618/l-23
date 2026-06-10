import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import type { Score } from '@/types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ScoreRadarProps {
  score: Score;
  size?: number;
}

export default function ScoreRadar({ score, size = 250 }: ScoreRadarProps) {
  const data = {
    labels: ['整洁度', '丰满度', '动线可见性', '重点商品占比'],
    datasets: [
      {
        label: '评分',
        data: [score.tidiness, score.fullness, score.visibility, score.focusRatio],
        backgroundColor: 'rgba(30, 58, 95, 0.15)',
        borderColor: 'rgba(30, 58, 95, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(30, 58, 95, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(30, 58, 95, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(0, 0, 0, 0.08)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
        },
        pointLabels: {
          font: {
            size: 12,
            family: "'Noto Sans SC', sans-serif",
          },
          color: '#64748b',
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 25,
          font: {
            size: 10,
          },
          color: '#94a3b8',
          backdropColor: 'transparent',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(30, 58, 95, 0.9)',
        titleFont: {
          family: "'Noto Sans SC', sans-serif",
          size: 13,
        },
        bodyFont: {
          family: "'Noto Sans SC', sans-serif",
          size: 12,
        },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function (context: { raw: unknown }) {
            return `得分: ${context.raw}分`;
          },
        },
      },
    },
  };

  return (
    <div style={{ width: size, height: size }}>
      <Radar data={data} options={options} />
    </div>
  );
}
