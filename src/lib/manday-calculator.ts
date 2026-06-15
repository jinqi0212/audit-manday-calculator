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
export function calcEnergyComplexity(
  energyConsumption: number, // 年度综合能耗 (TJ)
  energyTypes: number,       // 能源种类数量
  mainEnergyUses: number     // 主要能源使用数量
): { value: number; level: string } {
  // 年度综合能耗系数
  let consumptionCoeff = 1.0;
  if (energyConsumption > 2000) consumptionCoeff = 1.6;
  else if (energyConsumption > 200) consumptionCoeff = 1.4;
  else if (energyConsumption > 20) consumptionCoeff = 1.2;

  // 能源种类系数
  let typeCoeff = 1.0;
  if (energyTypes >= 4) typeCoeff = 1.4;
  else if (energyTypes >= 3) typeCoeff = 1.2;

  // 主要能源使用系数
  let useCoeff = 1.0;
  if (mainEnergyUses >= 16) useCoeff = 1.6;
  else if (mainEnergyUses >= 11) useCoeff = 1.4;
  else if (mainEnergyUses >= 7) useCoeff = 1.3;
  else if (mainEnergyUses >= 4) useCoeff = 1.2;

  // 加权计算: 25% + 25% + 50%
  const value = consumptionCoeff * 0.25 + typeCoeff * 0.25 + useCoeff * 0.50;

  let level = '低';
  if (value > 1.35) level = '高';
  else if (value >= 1.15) level = '中';

  return { value: Math.round(value * 100) / 100, level };
}

// 能源管理体系人天计算
export function calcEnergy(empCount: number, complexityLevel: string, auditType: 'init' | 'monitor' | 'recert') {
  if (auditType === 'init') {
    const row = findEnergyRow(ENERGY_TABLE4, empCount);
    if (!row) return null;
    const level = complexityLevel as 'low' | 'mid' | 'high';
    return {
      total: row[level],
      level: complexityLevel,
    };
  } else {
    const row = findEnergyRow5(ENERGY_TABLE5, empCount);
    if (!row) return null;
    const key = auditType === 'monitor' ? 'mon' : 'recert';
    const level = complexityLevel as 'low' | 'mid' | 'high';
    const field = `${key}_${level}` as keyof typeof row;
    return {
      total: row[field] as number,
      level: complexityLevel,
    };
  }
}

function findEnergyRow(table: typeof ENERGY_TABLE4, empCount: number) {
  for (let i = table.length - 1; i >= 0; i--) {
    if (empCount >= table[i].emp_min) return table[i];
  }
  return table[0];
}

function findEnergyRow5(table: typeof ENERGY_TABLE5, empCount: number) {
  for (let i = table.length - 1; i >= 0; i--) {
    if (empCount >= table[i].emp_min) return table[i];
  }
  return table[0];
}

// 调整因子计算
export interface AdjustmentFactor {
  id: string;
  label: string;
  description: string;
  maxPercent: number;
  type: 'decrease' | 'increase';
  systems: ('Q' | 'E' | 'S' | 'En')[];
}

export const ADJUSTMENT_FACTORS: AdjustmentFactor[] = [
  // 减少因素
  { id: 'no_design', label: '客户不负责设计/不适用其他要素', description: '减少量通常不多于15%', maxPercent: 15, type: 'decrease', systems: ['Q'] },
  { id: 'low_risk_q', label: 'QMS风险级别低', description: '风险级别明显低于同行业典型组织，减少量20%', maxPercent: 20, type: 'decrease', systems: ['Q'] },
  { id: 'small_site_q', label: '现场很小(仅综合办公区)', description: '与人员数量相比现场很小，减少量≤5%', maxPercent: 5, type: 'decrease', systems: ['Q', 'E', 'S'] },
  { id: 'mature_system', label: '体系成熟', description: '减少量不多于10%', maxPercent: 10, type: 'decrease', systems: ['Q', 'E', 'S'] },
  { id: 'known_system', label: '已了解客户管理体系', description: '通过其他认证/已获得同类认证，初次可减免一阶段或再认证/监督减少≤10%', maxPercent: 10, type: 'decrease', systems: ['Q', 'E', 'S'] },
  { id: 'high_automation', label: '自动化程度高', description: '减少量不多于10%', maxPercent: 10, type: 'decrease', systems: ['Q'] },
  { id: 'repeat_process', label: '涉及重复活动/重复生产线', description: '减少量≤20%', maxPercent: 20, type: 'decrease', systems: ['Q'] },
  { id: 'offsite_workers', label: '部分员工在场所外工作', description: '销售人员/司机等，减少量不多于5%', maxPercent: 5, type: 'decrease', systems: ['E', 'S'] },
  { id: 'low_risk_es', label: 'ES风险级别低', description: '减少量20%', maxPercent: 20, type: 'decrease', systems: ['E', 'S'] },
  // 增加因素
  { id: 'multi_language', label: '使用多种语言审核', description: '需增加审核时间', maxPercent: 20, type: 'increase', systems: ['Q', 'E', 'S'] },
  { id: 'large_site', label: '物流和大型场所', description: '需增加审核时间', maxPercent: 20, type: 'increase', systems: ['Q', 'E', 'S'] },
  { id: 'org_changes', label: '客户组织发生重大变化', description: '需增加审核时间', maxPercent: 15, type: 'increase', systems: ['Q', 'E', 'S'] },
  { id: 'prev_findings', label: '以往审核有重大发现', description: '需增加审核时间', maxPercent: 10, type: 'increase', systems: ['Q', 'E', 'S'] },
  { id: 'multi_roles', label: '一人拥有多个角色', description: '需增加审核时间', maxPercent: 10, type: 'increase', systems: ['Q', 'E', 'S'] },
  // 能源特殊增加因素
  { id: 'energy_production', label: '现场能源生产(蒸汽/热电联产)', description: '需增加审核时间', maxPercent: 15, type: 'increase', systems: ['En'] },
  { id: 'rb_standard', label: '要求增加RB行业标准', description: '初次+1人日，监督+0.5，再认证+1', maxPercent: 0, type: 'increase', systems: ['En'] },
];
