// 人天计算核心逻辑

import { MANDAY_TABLES, type MandayRow, ENERGY_TABLE4, ENERGY_TABLE5 } from '@/data/lookup-tables';

// 根据有效人数查找对应行
export function findRow(table: MandayRow[], empCount: number): MandayRow | null {
  for (let i = table.length - 1; i >= 0; i--) {
    if (empCount >= table[i].emp_min) {
      return table[i];
    }
  }
  return table[0];
}

// QMS人天计算
export function calcQMS(empCount: number, riskLevel: string, auditType: 'init' | 'monitor' | 'recert') {
  const tableKey = riskLevel === '一级' ? 'Q一级风险' : 'Q二级风险';
  const table = MANDAY_TABLES[tableKey];
  if (!table) return null;
  const row = findRow(table, empCount);
  if (!row) return null;

  if (auditType === 'init') {
    return {
      docReview: row.init_doc,
      phase1: row.init_p1,
      phase2: row.init_p2,
      totalOnsite: row.init_total_onsite,
      minOnsite: row.init_min_onsite,
      total: row.init_total,
    };
  } else if (auditType === 'monitor') {
    return {
      docReview: row.mon_doc,
      onsite: row.mon_onsite,
      minOnsite: row.mon_min_onsite,
      total: row.mon_total,
    };
  } else {
    return {
      docReview: row.recert_doc,
      onsite: row.recert_onsite,
      minOnsite: row.recert_min_onsite,
      total: row.recert_total,
    };
  }
}

// ES人天计算
export function calcES(empCount: number, riskLevel: string, auditType: 'init' | 'monitor' | 'recert') {
  let tableKey: string;
  if (riskLevel === '一级') tableKey = 'ES一级风险';
  else if (riskLevel === '二级') tableKey = 'ES二级风险';
  else if (riskLevel === '三级') tableKey = 'ES三级风险';
  else tableKey = 'E有限复杂';

  const table = MANDAY_TABLES[tableKey];
  if (!table) return null;
  const row = findRow(table, empCount);
  if (!row) return null;

  if (auditType === 'init') {
    return {
      docReview: row.init_doc,
      phase1: row.init_p1,
      phase2: row.init_p2,
      totalOnsite: row.init_total_onsite,
      minOnsite: row.init_min_onsite,
      total: row.init_total,
    };
  } else if (auditType === 'monitor') {
    return {
      docReview: row.mon_doc,
      onsite: row.mon_onsite,
      minOnsite: row.mon_min_onsite,
      total: row.mon_total,
    };
  } else {
    return {
      docReview: row.recert_doc,
      onsite: row.recert_onsite,
      minOnsite: row.recert_min_onsite,
      total: row.recert_total,
    };
  }
}

// 能源管理体系复杂程度计算
// 单位: TJ 或 万tce (1万tce ≈ 29.3 TJ)
export function calcEnergyComplexity(
  energyConsumption: number, // 年度综合能耗
  energyTypes: number, // 能源种类数量
  mainEnergyUses: number, // 主要能源使用数量
  unit: 'TJ' | 'tce' = 'TJ' // 单位类型
): { 
  value: number; 
  level: string;
  consumptionCoeff: number;
  typeCoeff: number;
  useCoeff: number;
} {
  // 年度综合能耗系数 (表2)
  // TJ: ≤20=1.0, >20且≤200=1.2, >200且≤2000=1.4, >2000=1.6
  // 万tce: ≤0.068=1.0, >0.068且≤0.68=1.2, >0.68且≤6.8=1.4, >6.8=1.6
  let consumptionCoeff = 1.0;
  if (unit === 'TJ') {
    if (energyConsumption > 2000) consumptionCoeff = 1.6;
    else if (energyConsumption > 200) consumptionCoeff = 1.4;
    else if (energyConsumption > 20) consumptionCoeff = 1.2;
  } else {
    if (energyConsumption > 6.8) consumptionCoeff = 1.6;
    else if (energyConsumption > 0.68) consumptionCoeff = 1.4;
    else if (energyConsumption > 0.068) consumptionCoeff = 1.2;
  }

  // 能源种类数量系数 (表2)
  // 1-2种=1.0, 3种=1.2, ≥4种=1.4
  let typeCoeff = 1.0;
  if (energyTypes >= 4) typeCoeff = 1.4;
  else if (energyTypes === 3) typeCoeff = 1.2;

  // 主要能源使用数量系数 (表2)
  // 1-3个=1.0, 4-6个=1.2, 7-10个=1.3, 11-15个=1.4, ≥16个=1.6
  let useCoeff = 1.0;
  if (mainEnergyUses >= 16) useCoeff = 1.6;
  else if (mainEnergyUses >= 11) useCoeff = 1.4;
  else if (mainEnergyUses >= 7) useCoeff = 1.3;
  else if (mainEnergyUses >= 4) useCoeff = 1.2;

  // 复杂程度值 C = (FEC × 0.25) + (FET × 0.25) + (FSEU × 0.5)
  const value = consumptionCoeff * 0.25 + typeCoeff * 0.25 + useCoeff * 0.5;
  
  // 复杂程度等级 (表3)
  // C > 1.35 = 高, 1.15~1.35 = 中, < 1.15 = 低
  let level = '低';
  if (value > 1.35) level = '高';
  else if (value >= 1.15) level = '中';

  return { 
    value: Math.round(value * 100) / 100, 
    level,
    consumptionCoeff,
    typeCoeff,
    useCoeff
  };
}

// 能源管理体系人天计算
// RB要求: 初次+1天, 监督+0.5天, 再认证+1天 (增加人天)
export function calcEnergy(
  empCount: number, 
  complexityLevel: string, 
  auditType: 'init' | 'monitor' | 'recert',
  hasRB: boolean = false
) {
  if (auditType === 'init') {
    // 手动查找能源表4
    let row: typeof ENERGY_TABLE4[number] | null = null;
    for (let i = ENERGY_TABLE4.length - 1; i >= 0; i--) {
      if (empCount >= ENERGY_TABLE4[i].emp_min) {
        row = ENERGY_TABLE4[i];
        break;
      }
    }
    if (!row) row = ENERGY_TABLE4[0];
    if (!row) return null;
    const total = complexityLevel === '高' ? row.high : complexityLevel === '中' ? row.mid : row.low;
    // RB要求下，初次认证增加1个人日
    const adjustedTotal = hasRB ? total + 1 : total;
    return { total: adjustedTotal, level: complexityLevel, hasRB, rbAdd: hasRB ? 1 : 0 };
  } else {
    // 手动查找能源表5
    let row: typeof ENERGY_TABLE5[number] | null = null;
    for (let i = ENERGY_TABLE5.length - 1; i >= 0; i--) {
      if (empCount >= ENERGY_TABLE5[i].emp_min) {
        row = ENERGY_TABLE5[i];
        break;
      }
    }
    if (!row) row = ENERGY_TABLE5[0];
    if (!row) return null;
    const suffix = complexityLevel === '高' ? 'high' : complexityLevel === '中' ? 'mid' : 'low';
    const key = (auditType === 'monitor' ? `mon_${suffix}` : `recert_${suffix}`) as keyof typeof row;
    const total = (row[key] as number) || 0;
    // RB要求下，监督+0.5天，再认证+1天
    const rbAdd = hasRB ? (auditType === 'monitor' ? 0.5 : 1) : 0;
    const adjustedTotal = total + rbAdd;
    return { total: adjustedTotal, level: complexityLevel, hasRB, rbAdd };
  }
}

// ============================================================
// 增减因子 - 完整数据来源于 QES能源人日 Sheet
// ============================================================

export interface AdjustmentFactor {
  id: string;
  system: 'Q' | 'E' | 'S' | 'common';
  direction: 'reduce' | 'increase';
  description: string;
  rule: string;
  maxPercent: number;
  defaultPercent: number;
}

// 减少因子 - 完整来源于Excel QES能源人日 Sheet Row 5-12
export const ADJUSTMENT_FACTORS: AdjustmentFactor[] = [
  // ========== Q体系减少因素 ==========
  {
    id: 'q_no_design',
    system: 'Q',
    direction: 'reduce',
    description: '客户不负责设计工作，或体系的范围不适用标准的其他要素',
    rule: '减少量通常不多于15%',
    maxPercent: 15,
    defaultPercent: 15,
  },
  {
    id: 'q_low_risk',
    system: 'Q',
    direction: 'reduce',
    description: 'QMS为3级风险；风险级别低；或风险级别明显低于对应专业代码同行业典型组织',
    rule: '减少量20%',
    maxPercent: 20,
    defaultPercent: 20,
  },
  {
    id: 'q_small_site',
    system: 'Q',
    direction: 'reduce',
    description: '与人员数量相比，现场很小（例如仅有综合办公区）',
    rule: '减少量≤5%',
    maxPercent: 5,
    defaultPercent: 5,
  },
  {
    id: 'q_mature',
    system: 'Q',
    direction: 'reduce',
    description: '体系成熟',
    rule: '减少量不多于10%',
    maxPercent: 10,
    defaultPercent: 10,
  },
  {
    id: 'q_other_cert',
    system: 'Q',
    direction: 'reduce',
    description: '对客户的管理体系已了解（如：通过了CQC其他管理体系认证；客户已获得其他认证机构的同类认证）',
    rule: '初次认证可减免第1阶段现场审核，或对应的人天数；再认证或监督减少量不多于10%',
    maxPercent: 10,
    defaultPercent: 10,
  },
  {
    id: 'q_auto',
    system: 'Q',
    direction: 'reduce',
    description: '自动化程度高',
    rule: '减少量不多于10%',
    maxPercent: 10,
    defaultPercent: 10,
  },
  {
    id: 'q_repeat',
    system: 'Q',
    direction: 'reduce',
    description: '涉及重复活动（过程）、重复的生产线',
    rule: '减少量≤20%',
    maxPercent: 20,
    defaultPercent: 20,
  },
  {
    id: 'q_offsite',
    system: 'Q',
    direction: 'reduce',
    description: '有一部分员工在组织的场所外工作（如销售人员、司机、服务人员等），并且有可能通过记录审查来对其活动是否符合体系要求进行充分地审核',
    rule: '减少量不多于5%（注意：与有效人数计算因素不能重复使用）',
    maxPercent: 5,
    defaultPercent: 5,
  },

  // ========== E体系减少因素 ==========
  {
    id: 'e_small_site',
    system: 'E',
    direction: 'reduce',
    description: '与人员数量相比，现场很小（例如仅有综合办公区）',
    rule: '减少量≤5%',
    maxPercent: 5,
    defaultPercent: 5,
  },
  {
    id: 'e_low_risk',
    system: 'E',
    direction: 'reduce',
    description: '风险级别低；或风险级别明显低于对应专业代码同行业典型组织',
    rule: '减少量20%',
    maxPercent: 20,
    defaultPercent: 20,
  },
  {
    id: 'e_mature',
    system: 'E',
    direction: 'reduce',
    description: '体系成熟',
    rule: '减少量不多于10%',
    maxPercent: 10,
    defaultPercent: 10,
  },
  {
    id: 'e_other_cert',
    system: 'E',
    direction: 'reduce',
    description: '对客户的管理体系已了解（如：通过了CQC其他管理体系认证；客户已获得其他认证机构的同类认证）',
    rule: '初次认证可减免第1阶段现场审核，或对应的人天数；再认证或监督减少量不多于10%',
    maxPercent: 10,
    defaultPercent: 10,
  },
  {
    id: 'e_auto',
    system: 'E',
    direction: 'reduce',
    description: '自动化程度高',
    rule: '减少量不多于10%',
    maxPercent: 10,
    defaultPercent: 10,
  },
  {
    id: 'e_repeat',
    system: 'E',
    direction: 'reduce',
    description: '涉及重复活动（过程）、重复的生产线',
    rule: '减少量≤20%',
    maxPercent: 20,
    defaultPercent: 20,
  },
  {
    id: 'e_offsite',
    system: 'E',
    direction: 'reduce',
    description: '有一部分员工在组织的场所外工作（如销售人员、司机、服务人员等），并且有可能通过记录审查来对其活动是否符合体系要求进行充分地审核',
    rule: '减少量不多于5%（注意：与有效人数计算因素不能重复使用）',
    maxPercent: 5,
    defaultPercent: 5,
  },

  // ========== S体系减少因素 ==========
  {
    id: 's_small_site',
    system: 'S',
    direction: 'reduce',
    description: '与人员数量相比，现场很小（例如仅有综合办公区）',
    rule: '减少量≤5%',
    maxPercent: 5,
    defaultPercent: 5,
  },
  {
    id: 's_low_risk',
    system: 'S',
    direction: 'reduce',
    description: '风险级别低；或风险级别明显低于对应专业代码同行业典型组织',
    rule: '减少量20%',
    maxPercent: 20,
    defaultPercent: 20,
  },
  {
    id: 's_mature',
    system: 'S',
    direction: 'reduce',
    description: '体系成熟',
    rule: '减少量不多于10%',
    maxPercent: 10,
    defaultPercent: 10,
  },
  {
    id: 's_other_cert',
    system: 'S',
    direction: 'reduce',
    description: '对客户的管理体系已了解（如：通过了CQC其他管理体系认证；客户已获得其他认证机构的同类认证）',
    rule: '初次认证可减免第1阶段现场审核，或对应的人天数；再认证或监督减少量不多于10%',
    maxPercent: 10,
    defaultPercent: 10,
  },
  {
    id: 's_auto',
    system: 'S',
    direction: 'reduce',
    description: '自动化程度高',
    rule: '减少量不多于10%',
    maxPercent: 10,
    defaultPercent: 10,
  },
  {
    id: 's_repeat',
    system: 'S',
    direction: 'reduce',
    description: '涉及重复活动（过程）、重复的生产线',
    rule: '减少量≤20%',
    maxPercent: 20,
    defaultPercent: 20,
  },
  {
    id: 's_offsite',
    system: 'S',
    direction: 'reduce',
    description: '有一部分员工在组织的场所外工作（如销售人员、司机、服务人员等），并且有可能通过记录审查来对其活动是否符合体系要求进行充分地审核',
    rule: '减少量不多于5%（注意：与有效人数计算因素不能重复使用）',
    maxPercent: 5,
    defaultPercent: 5,
  },

  // ========== 增加因素（通用） ==========
  {
    id: 'multi_system',
    system: 'common',
    direction: 'increase',
    description: '多体系叠加审核（QMS+EMS+OHSMS等同时进行）',
    rule: '增加量不多于100%（每增加一个体系+20%）',
    maxPercent: 100,
    defaultPercent: 20,
  },
  {
    id: 'scope_expand',
    system: 'common',
    direction: 'increase',
    description: '扩大认证范围（新增专业领域或业务范围）',
    rule: '增加量不多于50%',
    maxPercent: 50,
    defaultPercent: 30,
  },
  {
    id: 'high_risk',
    system: 'common',
    direction: 'increase',
    description: '高风险等级（一级风险或高于同行业典型组织）',
    rule: '增加量不多于50%',
    maxPercent: 50,
    defaultPercent: 30,
  },
  {
    id: 'complex_supply',
    system: 'common',
    direction: 'increase',
    description: '复杂供应链（多场所、多供应商、外包过程多）',
    rule: '增加量不多于30%',
    maxPercent: 30,
    defaultPercent: 20,
  },
  {
    id: 'special_regulation',
    system: 'common',
    direction: 'increase',
    description: '特殊监管要求（法规强制要求增加审核深度或频次）',
    rule: '增加量不多于30%',
    maxPercent: 30,
    defaultPercent: 20,
  },
  {
    id: 'remote_increase',
    system: 'common',
    direction: 'increase',
    description: '远程审核增加（因远程审核导致需要额外现场补充审核）',
    rule: '增加量不多于20%',
    maxPercent: 20,
    defaultPercent: 10,
  },
  {
    id: 'rb_compliance',
    system: 'common',
    direction: 'increase',
    description: '客户有RB（认可规则）合规要求',
    rule: '合规要求+1个人日',
    maxPercent: 0,
    defaultPercent: 0,
  },
  {
    id: 'version_change',
    system: 'common',
    direction: 'increase',
    description: '转版审核（标准版本变更导致的额外审核）',
    rule: '增加量不多于20%',
    maxPercent: 20,
    defaultPercent: 10,
  },
];

// 获取指定体系的增减因子
export function getFactorsForSystem(system: 'Q' | 'E' | 'S'): AdjustmentFactor[] {
  return ADJUSTMENT_FACTORS.filter(f => f.system === system || f.system === 'common');
}

// ============================================================
// 审核组能力计算 - 公式来源于 QES能源人日 Sheet Row 37-49
// ============================================================

// 审核组能力公式说明：
// 2个审核员时: 能力 = 最高能力分 / (最高能力分 + 次高能力分) × 100%
// 3个审核员时: 能力 = (最高×2 + 次高×1) / (最高+次高+第三) × 1/2 × 100%
// 4个审核员时: 能力 = (最高×3 + 次高×2 + 第三×1) / (最高+次高+第三+第四) × 1/3 × 100%
// n个审核员时: 能力 = Σ(权重×能力) / Σ能力 × 1/(n-1) × 100%
//   其中权重从n-1递减到0

export interface TeamMember {
  id: string;
  name: string;
  role: 'leader' | 'auditor' | 'technical' | 'observer';
  competencies: string[];
  auditDays: number;
}

export interface TeamCapabilityResult {
  capabilityPercent: number;
  formula: string;
  hasLeader: boolean;
  coveredCompetencies: string[];
  missingCompetencies: string[];
  maxReductionPercent: number;
}

export function calcTeamCapability(
  members: TeamMember[],
  requiredCompetencies: string[]
): TeamCapabilityResult {
  // 筛选有效审核人员（排除观察员和技术专家）
  const auditors = members.filter(m => m.role === 'leader' || m.role === 'auditor');
  const hasLeader = members.some(m => m.role === 'leader');

  // 按审核人天降序排列
  const sorted = [...auditors].sort((a, b) => b.auditDays - a.auditDays);
  const n = sorted.length;

  let capabilityPercent = 0;
  let formula = '';

  if (n === 0) {
    capabilityPercent = 0;
    formula = '无审核人员';
  } else if (n === 1) {
    capabilityPercent = 100;
    formula = `仅1名审核人员，能力=100%`;
  } else {
    // 计算加权能力
    // 权重从n-1递减到0
    let weightedSum = 0;
    let totalDays = 0;
    const parts: string[] = [];

    for (let i = 0; i < n; i++) {
      const weight = n - 1 - i;
      weightedSum += weight * sorted[i].auditDays;
      totalDays += sorted[i].auditDays;
      if (weight > 0) {
        parts.push(`${weight}×${sorted[i].auditDays}`);
      }
    }

    if (totalDays === 0) {
      capabilityPercent = 0;
      formula = '审核人员人天为0';
    } else {
      capabilityPercent = (weightedSum / totalDays) * (1 / (n - 1)) * 100;
      capabilityPercent = Math.round(capabilityPercent * 100) / 100;

      // 构建公式描述
      const numerator = parts.join(' + ');
      const denominator = sorted.map(m => m.auditDays).join(' + ');
      formula = `[${numerator}] / [(${denominator}) × ${n - 1}] × 100% = ${capabilityPercent}%`;
    }
  }

  // 计算能力覆盖
  const allCompetencies = new Set<string>();
  members.forEach(m => m.competencies.forEach(c => allCompetencies.add(c)));
  const coveredCompetencies = requiredCompetencies.filter(c => allCompetencies.has(c));
  const missingCompetencies = requiredCompetencies.filter(c => !allCompetencies.has(c));

  // 审核时间最多减少量 - 来源于 Row 51 公式
  // 基于审核组能力程度和体系成熟度
  let maxReductionPercent = 0;
  if (capabilityPercent >= 100) {
    maxReductionPercent = 20;
  } else if (capabilityPercent >= 80) {
    maxReductionPercent = 15;
  } else if (capabilityPercent >= 60) {
    maxReductionPercent = 10;
  } else if (capabilityPercent >= 40) {
    maxReductionPercent = 5;
  }

  return {
    capabilityPercent,
    formula,
    hasLeader,
    coveredCompetencies,
    missingCompetencies,
    maxReductionPercent,
  };
}
