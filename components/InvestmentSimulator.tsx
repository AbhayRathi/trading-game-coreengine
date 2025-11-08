import React, { useState, useMemo } from 'react';
import { Turtle, Scale, Rocket } from 'lucide-react';

type RiskLevel = 'conservative' | 'moderate' | 'aggressive';

const RISK_CONFIG = {
  conservative: { name: 'Steady Turtle', rate: 0.04, icon: <Turtle size={20} />, color: 'text-cyan-600', bgColor: 'bg-cyan-100', accentColor: 'accent-cyan-500' },
  moderate: { name: 'Balanced Badger', rate: 0.07, icon: <Scale size={20} />, color: 'text-amber-600', bgColor: 'bg-amber-100', accentColor: 'accent-amber-500' },
  aggressive: { name: 'Rocket Raccoon', rate: 0.10, icon: <Rocket size={20} />, color: 'text-rose-600', bgColor: 'bg-rose-100', accentColor: 'accent-rose-500' },
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const InvestmentSimulator: React.FC = () => {
    const [initialInvestment, setInitialInvestment] = useState(1000);
    const [monthlyContribution, setMonthlyContribution] = useState(100);
    const [timeHorizon, setTimeHorizon] = useState(10);
    const [riskLevel, setRiskLevel] = useState<RiskLevel>('moderate');

    const annualRate = RISK_CONFIG[riskLevel].rate;

    const calculation = useMemo(() => {
        let futureValue = initialInvestment;
        const yearlyData = [];
        for (let year = 1; year <= timeHorizon; year++) {
            futureValue += monthlyContribution * 12; // Contributions for the year
            futureValue *= (1 + annualRate); // Annual growth
            yearlyData.push(futureValue);
        }
        
        const totalContributions = initialInvestment + (monthlyContribution * 12 * timeHorizon);
        const investmentGrowth = futureValue - totalContributions;

        return { futureValue, totalContributions, investmentGrowth, yearlyData };
    }, [initialInvestment, monthlyContribution, timeHorizon, annualRate]);

    const maxChartValue = Math.max(...calculation.yearlyData, 1);

    return (
        <div className="w-full h-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-center text-slate-800">Investment Playground</h2>
            <p className="text-center text-slate-500 mb-6">See how your money can grow!</p>

            <div className="space-y-4">
                {/* Risk Profile Selector */}
                <div>
                    <p className="font-semibold mb-2 text-slate-600">Choose Your Style</p>
                    <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(RISK_CONFIG) as RiskLevel[]).map(level => (
                            <button 
                                key={level}
                                onClick={() => setRiskLevel(level)}
                                className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all duration-200 border-2 ${riskLevel === level ? `${RISK_CONFIG[level].bgColor} border-current ${RISK_CONFIG[level].color}` : 'bg-slate-100 border-transparent hover:bg-slate-200'}`}
                            >
                                <span className={RISK_CONFIG[level].color}>{RISK_CONFIG[level].icon}</span>
                                <span className={`text-xs font-bold mt-1 ${RISK_CONFIG[level].color}`}>{RISK_CONFIG[level].name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sliders */}
                <SliderInput 
                    label="Initial Investment"
                    value={initialInvestment}
                    displayValue={formatCurrency(initialInvestment)}
                    onChange={e => setInitialInvestment(Number(e.target.value))}
                    min={0} max={10000} step={100}
                    accentColor={RISK_CONFIG[riskLevel].accentColor}
                />
                <SliderInput 
                    label="Monthly Contribution"
                    value={monthlyContribution}
                    displayValue={formatCurrency(monthlyContribution)}
                    onChange={e => setMonthlyContribution(Number(e.target.value))}
                    min={0} max={1000} step={10}
                    accentColor={RISK_CONFIG[riskLevel].accentColor}
                />
                <SliderInput 
                    label="Time Horizon"
                    value={timeHorizon}
                    displayValue={`${timeHorizon} Years`}
                    onChange={e => setTimeHorizon(Number(e.target.value))}
                    min={1} max={30} step={1}
                    accentColor={RISK_CONFIG[riskLevel].accentColor}
                />
            </div>
            
            {/* Results */}
            <div className={`mt-6 p-4 rounded-lg text-center ${RISK_CONFIG[riskLevel].bgColor}`}>
                <p className="text-sm font-bold uppercase ${RISK_CONFIG[riskLevel].color}">Future Value</p>
                <p className={`text-4xl font-bold ${RISK_CONFIG[riskLevel].color}`}>{formatCurrency(calculation.futureValue)}</p>
                 <div className="flex justify-center gap-4 text-xs mt-2">
                    <span>Contributions: {formatCurrency(calculation.totalContributions)}</span>
                    <span className={RISK_CONFIG[riskLevel].color}>Growth: {formatCurrency(calculation.investmentGrowth)}</span>
                </div>
            </div>

             {/* Chart */}
            <div className="mt-4 h-24 w-full flex items-end justify-between gap-1 px-2 border-b border-slate-200">
                {calculation.yearlyData.map((value, index) => (
                    <div 
                        key={index}
                        title={`Year ${index + 1}: ${formatCurrency(value)}`}
                        className={`w-full rounded-t-sm transition-all duration-300 ease-out ${RISK_CONFIG[riskLevel].bgColor.replace('100', '400')}`}
                        style={{ height: `${(value / maxChartValue) * 100}%` }}
                    />
                ))}
            </div>

        </div>
    );
};

interface SliderInputProps {
    label: string;
    value: number;
    displayValue: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    min: number; max: number; step: number;
    accentColor: string;
}
const SliderInput: React.FC<SliderInputProps> = ({ label, value, displayValue, onChange, min, max, step, accentColor }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label className="font-semibold text-slate-600 text-sm">{label}</label>
            <span className="font-bold text-slate-700 text-sm">{displayValue}</span>
        </div>
        <input 
            type="range"
            value={value}
            onChange={onChange}
            min={min} max={max} step={step}
            className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer ${accentColor}`}
        />
    </div>
);


export default InvestmentSimulator;