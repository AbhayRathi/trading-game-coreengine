import React from 'react';

interface MiniChartProps {
  data: { time: number; price: number }[];
  isOpportunity: boolean;
}

const MiniChart: React.FC<MiniChartProps> = ({ data, isOpportunity }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const width = 100;
  const height = 40;

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const getX = (index: number) => (index / (data.length - 1)) * width;
  const getY = (price: number) => {
    const range = maxPrice - minPrice;
    if (range === 0) return height / 2;
    return height - ((price - minPrice) / range) * height;
  };

  const pathD = data.map((point, index) => {
      const x = getX(index);
      const y = getY(point.price);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

  const areaPathD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  const strokeColor = isOpportunity ? '#22c55e' : '#f97316';
  const gradientId = `gradient-${isOpportunity ? 'opp' : 'trap'}-${Math.random()}`;
  const gradientStartColor = isOpportunity ? 'rgba(74, 222, 128, 0.4)' : 'rgba(251, 146, 60, 0.4)';
  const gradientEndColor = isOpportunity ? 'rgba(74, 222, 128, 0.0)' : 'rgba(251, 146, 60, 0.0)';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradientStartColor} />
          <stop offset="100%" stopColor={gradientEndColor} />
        </linearGradient>
      </defs>
      <path d={areaPathD} fill={`url(#${gradientId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export default MiniChart;