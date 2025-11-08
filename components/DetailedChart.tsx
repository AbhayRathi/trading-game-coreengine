import React from 'react';
import type { ChartAnnotation } from '../types';

interface DetailedChartProps {
  priceHistory: { time: number; price: number }[];
  annotations: ChartAnnotation[];
  isOpportunity: boolean;
}

const DetailedChart: React.FC<DetailedChartProps> = ({ priceHistory, annotations, isOpportunity }) => {
  if (!priceHistory || priceHistory.length < 2) {
    return <div className="text-slate-500">Not enough data to display chart.</div>;
  }

  const width = 500;
  const height = 300;
  const margin = { top: 20, right: 50, bottom: 20, left: 10 };

  const prices = priceHistory.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const getX = (index: number) => margin.left + (index / (priceHistory.length - 1)) * chartWidth;
  
  const getY = (price: number) => {
    const priceRange = maxPrice - minPrice;
    if (priceRange === 0) return margin.top + chartHeight / 2;
    return margin.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const candleWidth = Math.max(2, chartWidth / priceHistory.length * 0.6);

  const candles = priceHistory.slice(1).map((d, i) => {
    const open = priceHistory[i].price;
    const close = d.price;
    const isGain = close >= open;
    const color = isGain ? '#22c55e' : '#ef4444';
    
    return {
      x: getX(i + 0.5) - candleWidth / 2,
      y: getY(Math.max(open, close)),
      height: Math.abs(getY(open) - getY(close)) || 1,
      fill: color,
    };
  });
  
  const annotationPoints = annotations.map(anno => {
    const point = priceHistory[anno.index];
    if (!point) return null;
    const x = getX(anno.index);
    const y = getY(point.price);
    const textAnchor: 'start' | 'end' = x > width / 2 ? 'end' : 'start';
    return {
        ...anno,
        x,
        y,
        textAnchor,
        textX: x > width / 2 ? x - 10 : x + 10,
    }
  }).filter(Boolean);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      {/* Y-Axis labels */}
      <text x={width - margin.right + 5} y={margin.top} dy="0.3em" fill="#64748b" fontSize="10">{maxPrice.toFixed(2)}</text>
      <text x={width - margin.right + 5} y={height - margin.bottom} dy="0.3em" fill="#64748b" fontSize="10">{minPrice.toFixed(2)}</text>
      <line x1={width - margin.right} y1={margin.top} x2={width-margin.right} y2={height - margin.bottom} stroke="#334155" strokeDasharray="2" />

      {/* Candlestick bodies */}
      {candles.map((candle, i) => (
        <rect key={i} x={candle.x} y={candle.y} width={candleWidth} height={candle.height} fill={candle.fill} />
      ))}
      
      {/* Annotations */}
      {annotationPoints.map((anno, i) => (
        anno && (
            <g key={i}>
                <circle cx={anno.x} cy={anno.y} r="4" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
                <line x1={anno.x} y1={anno.y} x2={anno.textX} y2={anno.y} stroke="#38bdf8" strokeDasharray="3" />
                <text x={anno.textX} y={anno.y} dy="0.3em" fill="#e2e8f0" fontSize="11" textAnchor={anno.textAnchor} className="font-semibold">
                    {anno.text}
                </text>
            </g>
        )
      ))}
    </svg>
  );
};

export default DetailedChart;