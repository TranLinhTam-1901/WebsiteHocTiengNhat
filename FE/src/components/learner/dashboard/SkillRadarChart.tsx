import React, { useMemo } from 'react';
import { UserSkillMatrixItem } from '../../../interfaces/Learner/Dashboard';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';
import { SKILL_TYPE_LABELS } from '../../../constants/admin/questionOptions';

const SKILL_COLORS: Record<number, string> = {
  [SkillType.Vocabulary]: '#f287b6',
  [SkillType.Grammar]: '#f59e0b',
  [SkillType.Kanji]: '#10b981',
  [SkillType.Reading]: '#6366f1',
  [SkillType.Listening]: '#8b5cf6',
};

const SKILL_ICONS: Record<number, string> = {
  [SkillType.Vocabulary]: 'translate',
  [SkillType.Grammar]: 'menu_book',
  [SkillType.Kanji]: 'draw',
  [SkillType.Reading]: 'auto_stories',
  [SkillType.Listening]: 'headphones',
};

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 118;
const LABEL_OFFSET = 28;

function polarPoint(index: number, total: number, value: number, maxRadius: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const r = (value / 100) * maxRadius;
  return {
    x: CENTER + r * Math.cos(angle),
    y: CENTER + r * Math.sin(angle),
  };
}

function buildPolygon(values: number[], maxRadius: number) {
  return values
    .map((value, index) => {
      const { x, y } = polarPoint(index, values.length, value, maxRadius);
      return `${x},${y}`;
    })
    .join(' ');
}

type SkillRadarChartProps = {
  skills: UserSkillMatrixItem[];
  onSkillClick?: (skillType: number) => void;
};

const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ skills, onSkillClick }) => {
  const orderedSkills = useMemo(() => {
    const order = [
      SkillType.Vocabulary,
      SkillType.Grammar,
      SkillType.Kanji,
      SkillType.Reading,
      SkillType.Listening,
    ];
    const map = new Map(skills.map((s) => [s.skillType, s]));
    return order.map((type) => map.get(type) ?? {
      skillType: type,
      skillName: SKILL_TYPE_LABELS[type as SkillType],
      proficiencyScore: 0,
      confidence: 0,
      needsReview: false,
    });
  }, [skills]);

  const proficiencyValues = orderedSkills.map((s) => s.proficiencyScore);
  const confidenceValues = orderedSkills.map((s) => s.confidence);

  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <div className="flex flex-col xl:flex-row items-center gap-10">
      <div className="relative shrink-0">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-[min(100%,320px)] h-[min(100%,320px)] drop-shadow-sm"
          role="img"
          aria-label="Biểu đồ radar chỉ số kỹ năng"
        >
          {gridLevels.map((level) => (
            <polygon
              key={level}
              points={buildPolygon(Array(orderedSkills.length).fill(level), RADIUS)}
              fill="none"
              stroke="#f4f0f2"
              strokeWidth={level === 100 ? 1.5 : 1}
            />
          ))}

          {orderedSkills.map((_, index) => {
            const end = polarPoint(index, orderedSkills.length, 100, RADIUS);
            return (
              <line
                key={`axis-${index}`}
                x1={CENTER}
                y1={CENTER}
                x2={end.x}
                y2={end.y}
                stroke="#ece6ea"
                strokeWidth={1}
              />
            );
          })}

          <polygon
            points={buildPolygon(confidenceValues, RADIUS)}
            fill="rgba(242, 135, 182, 0.08)"
            stroke="#f287b6"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            strokeLinejoin="round"
          />

          <polygon
            points={buildPolygon(proficiencyValues, RADIUS)}
            fill="rgba(242, 135, 182, 0.22)"
            stroke="#e0609a"
            strokeWidth={2.5}
            strokeLinejoin="round"
            className="transition-all duration-700 ease-out"
          />

          {orderedSkills.map((skill, index) => {
            const point = polarPoint(index, orderedSkills.length, skill.proficiencyScore, RADIUS);
            const color = SKILL_COLORS[skill.skillType] ?? '#f287b6';
            return (
              <g key={skill.skillType}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={5}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={2}
                  className="cursor-pointer"
                  onClick={() => onSkillClick?.(skill.skillType)}
                />
              </g>
            );
          })}

          {orderedSkills.map((skill, index) => {
            const labelPoint = polarPoint(index, orderedSkills.length, 100, RADIUS + LABEL_OFFSET);
            const color = SKILL_COLORS[skill.skillType] ?? '#886373';
            return (
              <text
                key={`label-${skill.skillType}`}
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] font-black uppercase tracking-wider fill-current"
                style={{ fill: color }}
              >
                {SKILL_TYPE_LABELS[skill.skillType as SkillType]?.split(' ')[0]}
              </text>
            );
          })}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-3xl font-black text-[#181114]">
              {Math.round(
                proficiencyValues.reduce((a, b) => a + b, 0) / Math.max(proficiencyValues.length, 1)
              )}
            </p>
            <p className="text-[9px] font-black text-[#886373] uppercase tracking-[0.2em]">TB thành thạo</p>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full space-y-3">
        {orderedSkills.map((skill) => {
          const color = SKILL_COLORS[skill.skillType] ?? '#f287b6';
          const label = SKILL_TYPE_LABELS[skill.skillType as SkillType];
          const icon = SKILL_ICONS[skill.skillType] ?? 'school';

          return (
            <button
              key={skill.skillType}
              type="button"
              onClick={() => onSkillClick?.(skill.skillType)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-[#f4f0f2] bg-white hover:border-primary/20 hover:shadow-md transition-all text-left group"
            >
              <div
                className="size-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}18`, color }}
              >
                <span className="material-symbols-outlined text-xl">{icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-black text-[#181114]">{label}</span>
                  <div className="flex items-center gap-2">
                    {skill.needsReview && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                        Cần ôn
                      </span>
                    )}
                    <span className="text-sm font-black" style={{ color }}>
                      {skill.proficiencyScore}%
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-[#f4f0f2] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${skill.proficiencyScore}%`, backgroundColor: color }}
                  />
                </div>

                <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#886373] font-bold">
                  <span>Tự tin: {skill.confidence}%</span>
                  {skill.lastUpdated && (
                    <span className="opacity-70">
                      Cập nhật {new Date(skill.lastUpdated).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>

              <span className="material-symbols-outlined text-[#886373] opacity-0 group-hover:opacity-100 transition-opacity">
                chevron_right
              </span>
            </button>
          );
        })}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#faf8f9] border border-[#f4f0f2] px-2.5 py-1.5">
            <svg viewBox="0 0 40 8" className="w-15 h-2 shrink-0" aria-hidden>
              <line
                x1="1"
                y1="4"
                x2="39"
                y2="4"
                stroke="#e0609a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[12px] font-black text-[#181114]">Thành thạo</span>
          </span>

          <span className="inline-flex items-center gap-2 rounded-lg bg-[#faf8f9] border border-[#f4f0f2] px-2.5 py-1.5">
            <svg viewBox="0 0 40 8" className="w-15 h-2 shrink-0" aria-hidden>
              <line
                x1="1"
                y1="4"
                x2="39"
                y2="4"
                stroke="#f287b6"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[12px] font-black text-[#181114]">Tự tin</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SkillRadarChart;
