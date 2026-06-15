// 审核人天查找表 - 自动从Excel提取

export interface MandayRow {
  emp_min: number;
  emp_max: number | null;
  init_doc: number; init_p1: number; init_p2: number;
  init_total_onsite: number; init_min_onsite: number; init_total: number;
  mon_doc: number; mon_onsite: number; mon_min_onsite: number; mon_total: number;
  recert_doc: number; recert_onsite: number; recert_min_onsite: number; recert_total: number;
}

const Q1: MandayRow[] = [
  { emp_min: 1, emp_max: 5, init_doc: 0.6, init_p1: 0.6, init_p2: 1.7, init_total_onsite: 2.2, init_min_onsite: 1.5, init_total: 2.75, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.4, recert_onsite: 1.5, recert_min_onsite: 1.0, recert_total: 1.8 },
  { emp_min: 6, emp_max: 10, init_doc: 0.6, init_p1: 0.6, init_p2: 1.7, init_total_onsite: 2.2, init_min_onsite: 1.5, init_total: 2.75, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.4, recert_onsite: 1.5, recert_min_onsite: 1.0, recert_total: 1.8 },
  { emp_min: 11, emp_max: 15, init_doc: 0.6, init_p1: 0.6, init_p2: 1.7, init_total_onsite: 2.2, init_min_onsite: 1.5, init_total: 2.75, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.4, recert_onsite: 1.5, recert_min_onsite: 1.0, recert_total: 1.8 },
  { emp_min: 16, emp_max: 25, init_doc: 0.7, init_p1: 0.7, init_p2: 2.0, init_total_onsite: 2.6, init_min_onsite: 1.8, init_total: 3.3, mon_doc: 0.2, mon_onsite: 0.9, mon_min_onsite: 0.8, mon_total: 1.1, recert_doc: 0.4, recert_onsite: 1.8, recert_min_onsite: 1.2, recert_total: 2.2 },
  { emp_min: 26, emp_max: 45, init_doc: 0.9, init_p1: 0.9, init_p2: 2.6, init_total_onsite: 3.5, init_min_onsite: 2.5, init_total: 4.4, mon_doc: 0.3, mon_onsite: 1.2, mon_min_onsite: 0.8, mon_total: 1.5, recert_doc: 0.6, recert_onsite: 2.3, recert_min_onsite: 1.6, recert_total: 2.9 },
  { emp_min: 46, emp_max: 65, init_doc: 1.1, init_p1: 1.1, init_p2: 3.3, init_total_onsite: 4.4, init_min_onsite: 3.1, init_total: 5.5, mon_doc: 0.4, mon_onsite: 1.5, mon_min_onsite: 1.0, mon_total: 1.8, recert_doc: 0.7, recert_onsite: 2.9, recert_min_onsite: 2.1, recert_total: 3.7 },
  { emp_min: 66, emp_max: 85, init_doc: 1.3, init_p1: 1.3, init_p2: 4.0, init_total_onsite: 5.3, init_min_onsite: 3.7, init_total: 6.6, mon_doc: 0.4, mon_onsite: 1.8, mon_min_onsite: 1.2, mon_total: 2.2, recert_doc: 0.9, recert_onsite: 3.5, recert_min_onsite: 2.5, recert_total: 4.4 },
  { emp_min: 86, emp_max: 125, init_doc: 1.5, init_p1: 1.5, init_p2: 4.6, init_total_onsite: 6.2, init_min_onsite: 4.3, init_total: 7.7, mon_doc: 0.5, mon_onsite: 2.1, mon_min_onsite: 1.4, mon_total: 2.6, recert_doc: 1.0, recert_onsite: 4.1, recert_min_onsite: 2.9, recert_total: 5.1 },
  { emp_min: 126, emp_max: 175, init_doc: 1.8, init_p1: 1.8, init_p2: 5.3, init_total_onsite: 7.0, init_min_onsite: 4.9, init_total: 8.8, mon_doc: 0.6, mon_onsite: 2.3, mon_min_onsite: 1.6, mon_total: 2.9, recert_doc: 1.2, recert_onsite: 4.7, recert_min_onsite: 3.3, recert_total: 5.9 },
  { emp_min: 176, emp_max: 275, init_doc: 2.0, init_p1: 2.0, init_p2: 5.9, init_total_onsite: 7.9, init_min_onsite: 5.5, init_total: 9.9, mon_doc: 0.7, mon_onsite: 2.6, mon_min_onsite: 1.8, mon_total: 3.3, recert_doc: 1.3, recert_onsite: 5.3, recert_min_onsite: 3.7, recert_total: 6.6 },
  { emp_min: 276, emp_max: 425, init_doc: 2.2, init_p1: 2.2, init_p2: 6.6, init_total_onsite: 8.8, init_min_onsite: 6.2, init_total: 11.0, mon_doc: 0.7, mon_onsite: 2.9, mon_min_onsite: 2.1, mon_total: 3.7, recert_doc: 1.5, recert_onsite: 5.9, recert_min_onsite: 4.1, recert_total: 7.3 },
  { emp_min: 426, emp_max: 625, init_doc: 2.4, init_p1: 2.4, init_p2: 7.3, init_total_onsite: 9.7, init_min_onsite: 6.8, init_total: 12.1, mon_doc: 0.8, mon_onsite: 3.2, mon_min_onsite: 2.3, mon_total: 4.0, recert_doc: 1.6, recert_onsite: 6.5, recert_min_onsite: 4.5, recert_total: 8.1 },
  { emp_min: 626, emp_max: 875, init_doc: 2.6, init_p1: 2.6, init_p2: 7.9, init_total_onsite: 10.6, init_min_onsite: 7.4, init_total: 13.2, mon_doc: 0.9, mon_onsite: 3.5, mon_min_onsite: 2.5, mon_total: 4.4, recert_doc: 1.8, recert_onsite: 7.0, recert_min_onsite: 4.9, recert_total: 8.8 },
  { emp_min: 876, emp_max: 1175, init_doc: 2.9, init_p1: 2.9, init_p2: 8.6, init_total_onsite: 11.4, init_min_onsite: 8.0, init_total: 14.3, mon_doc: 1.0, mon_onsite: 3.8, mon_min_onsite: 2.7, mon_total: 4.8, recert_doc: 1.9, recert_onsite: 7.6, recert_min_onsite: 5.3, recert_total: 9.5 },
  { emp_min: 1176, emp_max: 1550, init_doc: 3.1, init_p1: 3.1, init_p2: 9.2, init_total_onsite: 12.3, init_min_onsite: 8.6, init_total: 15.4, mon_doc: 1.0, mon_onsite: 4.1, mon_min_onsite: 2.9, mon_total: 5.1, recert_doc: 2.1, recert_onsite: 8.2, recert_min_onsite: 5.7, recert_total: 10.3 },
  { emp_min: 1551, emp_max: 2025, init_doc: 3.3, init_p1: 3.3, init_p2: 9.9, init_total_onsite: 13.2, init_min_onsite: 9.2, init_total: 16.5, mon_doc: 1.1, mon_onsite: 4.4, mon_min_onsite: 3.1, mon_total: 5.5, recert_doc: 2.2, recert_onsite: 8.8, recert_min_onsite: 6.2, recert_total: 11.0 },
  { emp_min: 2026, emp_max: 2675, init_doc: 3.5, init_p1: 3.5, init_p2: 10.6, init_total_onsite: 14.1, init_min_onsite: 9.9, init_total: 17.6, mon_doc: 1.2, mon_onsite: 4.7, mon_min_onsite: 3.3, mon_total: 5.9, recert_doc: 2.3, recert_onsite: 9.4, recert_min_onsite: 6.6, recert_total: 11.7 },
  { emp_min: 2676, emp_max: 3450, init_doc: 3.7, init_p1: 3.7, init_p2: 11.2, init_total_onsite: 15.0, init_min_onsite: 10.5, init_total: 18.7, mon_doc: 1.2, mon_onsite: 5.0, mon_min_onsite: 3.5, mon_total: 6.2, recert_doc: 2.5, recert_onsite: 10.0, recert_min_onsite: 7.0, recert_total: 12.5 },
  { emp_min: 3451, emp_max: 4350, init_doc: 4.0, init_p1: 4.0, init_p2: 11.9, init_total_onsite: 15.8, init_min_onsite: 11.1, init_total: 19.8, mon_doc: 1.3, mon_onsite: 5.3, mon_min_onsite: 3.7, mon_total: 6.6, recert_doc: 2.6, recert_onsite: 10.6, recert_min_onsite: 7.4, recert_total: 13.2 },
  { emp_min: 4351, emp_max: 5450, init_doc: 4.2, init_p1: 4.2, init_p2: 12.5, init_total_onsite: 16.7, init_min_onsite: 11.7, init_total: 20.9, mon_doc: 1.4, mon_onsite: 5.6, mon_min_onsite: 3.9, mon_total: 7.0, recert_doc: 2.8, recert_onsite: 11.1, recert_min_onsite: 7.8, recert_total: 13.9 },
  { emp_min: 5451, emp_max: 6800, init_doc: 4.4, init_p1: 4.4, init_p2: 13.2, init_total_onsite: 17.6, init_min_onsite: 12.3, init_total: 22.0, mon_doc: 1.5, mon_onsite: 5.9, mon_min_onsite: 4.1, mon_total: 7.3, recert_doc: 2.9, recert_onsite: 11.7, recert_min_onsite: 8.2, recert_total: 14.7 },
  { emp_min: 6801, emp_max: 8500, init_doc: 4.6, init_p1: 4.6, init_p2: 13.9, init_total_onsite: 18.5, init_min_onsite: 12.9, init_total: 23.1, mon_doc: 1.5, mon_onsite: 6.2, mon_min_onsite: 4.3, mon_total: 7.7, recert_doc: 3.1, recert_onsite: 12.3, recert_min_onsite: 8.6, recert_total: 15.4 },
  { emp_min: 8501, emp_max: 10700, init_doc: 4.8, init_p1: 4.8, init_p2: 14.5, init_total_onsite: 19.4, init_min_onsite: 13.6, init_total: 24.2, mon_doc: 1.6, mon_onsite: 6.5, mon_min_onsite: 4.5, mon_total: 8.1, recert_doc: 3.2, recert_onsite: 12.9, recert_min_onsite: 9.0, recert_total: 16.1 },
];

const Q2: MandayRow[] = [
  { emp_min: 1, emp_max: 5, init_doc: 0.3, init_p1: 0.5, init_p2: 1.5, init_total_onsite: 2.0, init_min_onsite: 1.4, init_total: 2.5, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.3, recert_onsite: 1.3, recert_min_onsite: 0.9, recert_total: 1.7 },
  { emp_min: 6, emp_max: 10, init_doc: 0.5, init_p1: 0.5, init_p2: 1.5, init_total_onsite: 2.0, init_min_onsite: 1.4, init_total: 2.5, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.3, recert_onsite: 1.3, recert_min_onsite: 0.9, recert_total: 1.7 },
  { emp_min: 11, emp_max: 15, init_doc: 0.5, init_p1: 0.5, init_p2: 1.5, init_total_onsite: 2.0, init_min_onsite: 1.4, init_total: 2.5, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.3, recert_onsite: 1.3, recert_min_onsite: 0.9, recert_total: 1.7 },
  { emp_min: 16, emp_max: 25, init_doc: 0.6, init_p1: 0.6, init_p2: 1.8, init_total_onsite: 2.4, init_min_onsite: 1.7, init_total: 3.0, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.4, recert_onsite: 1.6, recert_min_onsite: 1.1, recert_total: 2.0 },
  { emp_min: 26, emp_max: 45, init_doc: 0.8, init_p1: 0.8, init_p2: 2.4, init_total_onsite: 3.2, init_min_onsite: 2.2, init_total: 4.0, mon_doc: 0.3, mon_onsite: 1.1, mon_min_onsite: 0.8, mon_total: 1.3, recert_doc: 0.5, recert_onsite: 2.1, recert_min_onsite: 1.5, recert_total: 2.7 },
  { emp_min: 46, emp_max: 65, init_doc: 1.0, init_p1: 1.0, init_p2: 3.0, init_total_onsite: 4.0, init_min_onsite: 2.8, init_total: 5.0, mon_doc: 0.3, mon_onsite: 1.3, mon_min_onsite: 0.9, mon_total: 1.7, recert_doc: 0.7, recert_onsite: 2.7, recert_min_onsite: 1.9, recert_total: 3.3 },
  { emp_min: 66, emp_max: 85, init_doc: 1.2, init_p1: 1.2, init_p2: 3.6, init_total_onsite: 4.8, init_min_onsite: 3.4, init_total: 6.0, mon_doc: 0.4, mon_onsite: 1.6, mon_min_onsite: 1.1, mon_total: 2.0, recert_doc: 0.8, recert_onsite: 3.2, recert_min_onsite: 2.2, recert_total: 4.0 },
  { emp_min: 86, emp_max: 125, init_doc: 1.4, init_p1: 1.4, init_p2: 4.2, init_total_onsite: 5.6, init_min_onsite: 3.9, init_total: 7.0, mon_doc: 0.5, mon_onsite: 1.9, mon_min_onsite: 1.3, mon_total: 2.3, recert_doc: 0.9, recert_onsite: 3.7, recert_min_onsite: 2.6, recert_total: 4.7 },
  { emp_min: 126, emp_max: 175, init_doc: 1.6, init_p1: 1.6, init_p2: 4.8, init_total_onsite: 6.4, init_min_onsite: 4.5, init_total: 8.0, mon_doc: 0.5, mon_onsite: 2.1, mon_min_onsite: 1.5, mon_total: 2.7, recert_doc: 1.1, recert_onsite: 4.3, recert_min_onsite: 3.0, recert_total: 5.3 },
  { emp_min: 176, emp_max: 275, init_doc: 1.8, init_p1: 1.8, init_p2: 5.4, init_total_onsite: 7.2, init_min_onsite: 5.0, init_total: 9.0, mon_doc: 0.6, mon_onsite: 2.4, mon_min_onsite: 1.7, mon_total: 3.0, recert_doc: 1.2, recert_onsite: 4.8, recert_min_onsite: 3.4, recert_total: 6.0 },
  { emp_min: 276, emp_max: 425, init_doc: 2.0, init_p1: 2.0, init_p2: 6.0, init_total_onsite: 8.0, init_min_onsite: 5.6, init_total: 10.0, mon_doc: 0.7, mon_onsite: 2.7, mon_min_onsite: 1.9, mon_total: 3.3, recert_doc: 1.3, recert_onsite: 5.3, recert_min_onsite: 3.7, recert_total: 6.7 },
  { emp_min: 426, emp_max: 625, init_doc: 2.2, init_p1: 2.2, init_p2: 6.6, init_total_onsite: 8.8, init_min_onsite: 6.2, init_total: 11.0, mon_doc: 0.7, mon_onsite: 2.9, mon_min_onsite: 2.1, mon_total: 3.7, recert_doc: 1.5, recert_onsite: 5.9, recert_min_onsite: 4.1, recert_total: 7.3 },
  { emp_min: 626, emp_max: 875, init_doc: 2.4, init_p1: 2.4, init_p2: 7.2, init_total_onsite: 9.6, init_min_onsite: 6.7, init_total: 12.0, mon_doc: 0.8, mon_onsite: 3.2, mon_min_onsite: 2.2, mon_total: 4.0, recert_doc: 1.6, recert_onsite: 6.4, recert_min_onsite: 4.5, recert_total: 8.0 },
  { emp_min: 876, emp_max: 1175, init_doc: 2.6, init_p1: 2.6, init_p2: 7.8, init_total_onsite: 10.4, init_min_onsite: 7.3, init_total: 13.0, mon_doc: 0.9, mon_onsite: 3.5, mon_min_onsite: 2.4, mon_total: 4.3, recert_doc: 1.7, recert_onsite: 6.9, recert_min_onsite: 4.9, recert_total: 8.7 },
  { emp_min: 1176, emp_max: 1550, init_doc: 2.8, init_p1: 2.8, init_p2: 8.4, init_total_onsite: 11.2, init_min_onsite: 7.8, init_total: 14.0, mon_doc: 0.9, mon_onsite: 3.7, mon_min_onsite: 2.6, mon_total: 4.7, recert_doc: 1.9, recert_onsite: 7.5, recert_min_onsite: 5.2, recert_total: 9.3 },
  { emp_min: 1551, emp_max: 2025, init_doc: 3.0, init_p1: 3.0, init_p2: 9.0, init_total_onsite: 12.0, init_min_onsite: 8.4, init_total: 15.0, mon_doc: 1.0, mon_onsite: 4.0, mon_min_onsite: 2.8, mon_total: 5.0, recert_doc: 2.0, recert_onsite: 8.0, recert_min_onsite: 5.6, recert_total: 10.0 },
  { emp_min: 2026, emp_max: 2675, init_doc: 3.2, init_p1: 3.2, init_p2: 9.6, init_total_onsite: 12.8, init_min_onsite: 9.0, init_total: 16.0, mon_doc: 1.1, mon_onsite: 4.3, mon_min_onsite: 3.0, mon_total: 5.3, recert_doc: 2.1, recert_onsite: 8.5, recert_min_onsite: 6.0, recert_total: 10.7 },
  { emp_min: 2676, emp_max: 3450, init_doc: 3.4, init_p1: 3.4, init_p2: 10.2, init_total_onsite: 13.6, init_min_onsite: 9.5, init_total: 17.0, mon_doc: 1.1, mon_onsite: 4.5, mon_min_onsite: 3.2, mon_total: 5.7, recert_doc: 2.3, recert_onsite: 9.1, recert_min_onsite: 6.3, recert_total: 11.3 },
  { emp_min: 3451, emp_max: 4350, init_doc: 3.6, init_p1: 3.6, init_p2: 10.8, init_total_onsite: 14.4, init_min_onsite: 10.1, init_total: 18.0, mon_doc: 1.2, mon_onsite: 4.8, mon_min_onsite: 3.4, mon_total: 6.0, recert_doc: 2.4, recert_onsite: 9.6, recert_min_onsite: 6.7, recert_total: 12.0 },
  { emp_min: 4351, emp_max: 5450, init_doc: 3.8, init_p1: 3.8, init_p2: 11.4, init_total_onsite: 15.2, init_min_onsite: 10.6, init_total: 19.0, mon_doc: 1.3, mon_onsite: 5.1, mon_min_onsite: 3.5, mon_total: 6.3, recert_doc: 2.5, recert_onsite: 10.1, recert_min_onsite: 7.1, recert_total: 12.7 },
  { emp_min: 5451, emp_max: 6800, init_doc: 4.0, init_p1: 4.0, init_p2: 12.0, init_total_onsite: 16.0, init_min_onsite: 11.2, init_total: 20.0, mon_doc: 1.3, mon_onsite: 5.3, mon_min_onsite: 3.7, mon_total: 6.7, recert_doc: 2.7, recert_onsite: 10.7, recert_min_onsite: 7.5, recert_total: 13.3 },
  { emp_min: 6801, emp_max: 8500, init_doc: 4.2, init_p1: 4.2, init_p2: 12.6, init_total_onsite: 16.8, init_min_onsite: 11.8, init_total: 21.0, mon_doc: 1.4, mon_onsite: 5.6, mon_min_onsite: 3.9, mon_total: 7.0, recert_doc: 2.8, recert_onsite: 11.2, recert_min_onsite: 7.8, recert_total: 14.0 },
  { emp_min: 8501, emp_max: 10700, init_doc: 4.4, init_p1: 4.4, init_p2: 13.2, init_total_onsite: 17.6, init_min_onsite: 12.3, init_total: 22.0, mon_doc: 1.5, mon_onsite: 5.9, mon_min_onsite: 4.1, mon_total: 7.3, recert_doc: 2.9, recert_onsite: 11.7, recert_min_onsite: 8.2, recert_total: 14.7 },
];

const ES1: MandayRow[] = [
  { emp_min: 1, emp_max: 5, init_doc: 0.9, init_p1: 0.9, init_p2: 2.7, init_total_onsite: 3.6, init_min_onsite: 2.5, init_total: 4.5, mon_doc: 0.3, mon_onsite: 1.2, mon_min_onsite: 0.8, mon_total: 1.5, recert_doc: 0.6, recert_onsite: 2.4, recert_min_onsite: 1.7, recert_total: 3.0 },
  { emp_min: 6, emp_max: 10, init_doc: 0.9, init_p1: 0.9, init_p2: 2.7, init_total_onsite: 3.6, init_min_onsite: 2.5, init_total: 4.5, mon_doc: 0.3, mon_onsite: 1.2, mon_min_onsite: 0.8, mon_total: 1.5, recert_doc: 0.6, recert_onsite: 2.4, recert_min_onsite: 1.7, recert_total: 3.0 },
  { emp_min: 11, emp_max: 15, init_doc: 0.9, init_p1: 0.9, init_p2: 2.7, init_total_onsite: 3.6, init_min_onsite: 2.5, init_total: 4.5, mon_doc: 0.3, mon_onsite: 1.2, mon_min_onsite: 0.8, mon_total: 1.5, recert_doc: 0.6, recert_onsite: 2.4, recert_min_onsite: 1.7, recert_total: 3.0 },
  { emp_min: 16, emp_max: 25, init_doc: 1.1, init_p1: 1.1, init_p2: 3.3, init_total_onsite: 4.4, init_min_onsite: 3.1, init_total: 5.5, mon_doc: 0.4, mon_onsite: 1.5, mon_min_onsite: 1.0, mon_total: 1.8, recert_doc: 0.7, recert_onsite: 2.9, recert_min_onsite: 2.1, recert_total: 3.7 },
  { emp_min: 26, emp_max: 45, init_doc: 1.4, init_p1: 1.4, init_p2: 4.2, init_total_onsite: 5.6, init_min_onsite: 3.9, init_total: 7.0, mon_doc: 0.5, mon_onsite: 1.9, mon_min_onsite: 1.3, mon_total: 2.3, recert_doc: 0.9, recert_onsite: 3.7, recert_min_onsite: 2.6, recert_total: 4.7 },
  { emp_min: 46, emp_max: 65, init_doc: 1.6, init_p1: 1.6, init_p2: 4.8, init_total_onsite: 6.4, init_min_onsite: 4.5, init_total: 8.0, mon_doc: 0.5, mon_onsite: 2.1, mon_min_onsite: 1.5, mon_total: 2.7, recert_doc: 1.1, recert_onsite: 4.3, recert_min_onsite: 3.0, recert_total: 5.3 },
  { emp_min: 66, emp_max: 85, init_doc: 1.8, init_p1: 1.8, init_p2: 5.4, init_total_onsite: 7.2, init_min_onsite: 5.0, init_total: 9.0, mon_doc: 0.6, mon_onsite: 2.4, mon_min_onsite: 1.7, mon_total: 3.0, recert_doc: 1.2, recert_onsite: 4.8, recert_min_onsite: 3.4, recert_total: 6.0 },
  { emp_min: 86, emp_max: 125, init_doc: 2.2, init_p1: 2.2, init_p2: 6.6, init_total_onsite: 8.8, init_min_onsite: 6.2, init_total: 11.0, mon_doc: 0.7, mon_onsite: 2.9, mon_min_onsite: 2.1, mon_total: 3.7, recert_doc: 1.5, recert_onsite: 5.9, recert_min_onsite: 4.1, recert_total: 7.3 },
  { emp_min: 126, emp_max: 175, init_doc: 2.4, init_p1: 2.4, init_p2: 7.2, init_total_onsite: 9.6, init_min_onsite: 6.7, init_total: 12.0, mon_doc: 0.8, mon_onsite: 3.2, mon_min_onsite: 2.2, mon_total: 4.0, recert_doc: 1.6, recert_onsite: 6.4, recert_min_onsite: 4.5, recert_total: 8.0 },
  { emp_min: 176, emp_max: 275, init_doc: 2.6, init_p1: 2.6, init_p2: 7.8, init_total_onsite: 10.4, init_min_onsite: 7.3, init_total: 13.0, mon_doc: 0.9, mon_onsite: 3.5, mon_min_onsite: 2.4, mon_total: 4.3, recert_doc: 1.7, recert_onsite: 6.9, recert_min_onsite: 4.9, recert_total: 8.7 },
  { emp_min: 276, emp_max: 425, init_doc: 3.0, init_p1: 3.0, init_p2: 9.0, init_total_onsite: 12.0, init_min_onsite: 8.4, init_total: 15.0, mon_doc: 1.0, mon_onsite: 4.0, mon_min_onsite: 2.8, mon_total: 5.0, recert_doc: 2.0, recert_onsite: 8.0, recert_min_onsite: 5.6, recert_total: 10.0 },
  { emp_min: 426, emp_max: 625, init_doc: 3.2, init_p1: 3.2, init_p2: 9.6, init_total_onsite: 12.8, init_min_onsite: 9.0, init_total: 16.0, mon_doc: 1.1, mon_onsite: 4.3, mon_min_onsite: 3.0, mon_total: 5.3, recert_doc: 2.1, recert_onsite: 8.5, recert_min_onsite: 6.0, recert_total: 10.7 },
  { emp_min: 626, emp_max: 875, init_doc: 3.4, init_p1: 3.4, init_p2: 10.2, init_total_onsite: 13.6, init_min_onsite: 9.5, init_total: 17.0, mon_doc: 1.1, mon_onsite: 4.5, mon_min_onsite: 3.2, mon_total: 5.7, recert_doc: 2.3, recert_onsite: 9.1, recert_min_onsite: 6.3, recert_total: 11.3 },
  { emp_min: 876, emp_max: 1175, init_doc: 3.8, init_p1: 3.8, init_p2: 11.4, init_total_onsite: 15.2, init_min_onsite: 10.6, init_total: 19.0, mon_doc: 1.3, mon_onsite: 5.1, mon_min_onsite: 3.5, mon_total: 6.3, recert_doc: 2.5, recert_onsite: 10.1, recert_min_onsite: 7.1, recert_total: 12.7 },
  { emp_min: 1176, emp_max: 1550, init_doc: 4.0, init_p1: 4.0, init_p2: 12.0, init_total_onsite: 16.0, init_min_onsite: 11.2, init_total: 20.0, mon_doc: 1.3, mon_onsite: 5.3, mon_min_onsite: 3.7, mon_total: 6.7, recert_doc: 2.7, recert_onsite: 10.7, recert_min_onsite: 7.5, recert_total: 13.3 },
  { emp_min: 1551, emp_max: 2025, init_doc: 4.2, init_p1: 4.2, init_p2: 12.6, init_total_onsite: 16.8, init_min_onsite: 11.8, init_total: 21.0, mon_doc: 1.4, mon_onsite: 5.6, mon_min_onsite: 3.9, mon_total: 7.0, recert_doc: 2.8, recert_onsite: 11.2, recert_min_onsite: 7.8, recert_total: 14.0 },
  { emp_min: 2026, emp_max: 2675, init_doc: 4.6, init_p1: 4.6, init_p2: 13.8, init_total_onsite: 18.4, init_min_onsite: 12.9, init_total: 23.0, mon_doc: 1.5, mon_onsite: 6.1, mon_min_onsite: 4.3, mon_total: 7.7, recert_doc: 3.1, recert_onsite: 12.3, recert_min_onsite: 8.6, recert_total: 15.3 },
  { emp_min: 2676, emp_max: 3450, init_doc: 5.0, init_p1: 5.0, init_p2: 15.0, init_total_onsite: 20.0, init_min_onsite: 14.0, init_total: 25.0, mon_doc: 1.7, mon_onsite: 6.7, mon_min_onsite: 4.7, mon_total: 8.3, recert_doc: 3.3, recert_onsite: 13.3, recert_min_onsite: 9.3, recert_total: 16.7 },
  { emp_min: 3451, emp_max: 4350, init_doc: 5.4, init_p1: 5.4, init_p2: 16.2, init_total_onsite: 21.6, init_min_onsite: 15.1, init_total: 27.0, mon_doc: 1.8, mon_onsite: 7.2, mon_min_onsite: 5.0, mon_total: 9.0, recert_doc: 3.6, recert_onsite: 14.4, recert_min_onsite: 10.1, recert_total: 18.0 },
  { emp_min: 4351, emp_max: 5450, init_doc: 5.6, init_p1: 5.6, init_p2: 16.8, init_total_onsite: 22.4, init_min_onsite: 15.7, init_total: 28.0, mon_doc: 1.9, mon_onsite: 7.5, mon_min_onsite: 5.2, mon_total: 9.3, recert_doc: 3.7, recert_onsite: 14.9, recert_min_onsite: 10.5, recert_total: 18.7 },
  { emp_min: 5451, emp_max: 6800, init_doc: 6.0, init_p1: 6.0, init_p2: 18.0, init_total_onsite: 24.0, init_min_onsite: 16.8, init_total: 30.0, mon_doc: 2.0, mon_onsite: 8.0, mon_min_onsite: 5.6, mon_total: 10.0, recert_doc: 4.0, recert_onsite: 16.0, recert_min_onsite: 11.2, recert_total: 20.0 },
  { emp_min: 6801, emp_max: 8500, init_doc: 6.4, init_p1: 6.4, init_p2: 19.2, init_total_onsite: 25.6, init_min_onsite: 17.9, init_total: 32.0, mon_doc: 2.1, mon_onsite: 8.5, mon_min_onsite: 6.0, mon_total: 10.7, recert_doc: 4.3, recert_onsite: 17.1, recert_min_onsite: 11.9, recert_total: 21.3 },
  { emp_min: 8501, emp_max: 10700, init_doc: 6.8, init_p1: 6.8, init_p2: 20.4, init_total_onsite: 27.2, init_min_onsite: 19.0, init_total: 34.0, mon_doc: 2.3, mon_onsite: 9.1, mon_min_onsite: 6.3, mon_total: 11.3, recert_doc: 4.5, recert_onsite: 18.1, recert_min_onsite: 12.7, recert_total: 22.7 },
];

const ES2: MandayRow[] = [
  { emp_min: 1, emp_max: 5, init_doc: 0.7, init_p1: 0.7, init_p2: 2.1, init_total_onsite: 2.8, init_min_onsite: 2.0, init_total: 3.5, mon_doc: 0.2, mon_onsite: 0.9, mon_min_onsite: 0.8, mon_total: 1.2, recert_doc: 0.5, recert_onsite: 1.9, recert_min_onsite: 1.3, recert_total: 2.3 },
  { emp_min: 6, emp_max: 10, init_doc: 0.7, init_p1: 0.7, init_p2: 2.1, init_total_onsite: 2.8, init_min_onsite: 2.0, init_total: 3.5, mon_doc: 0.2, mon_onsite: 0.9, mon_min_onsite: 0.8, mon_total: 1.2, recert_doc: 0.5, recert_onsite: 1.9, recert_min_onsite: 1.3, recert_total: 2.3 },
  { emp_min: 11, emp_max: 15, init_doc: 0.7, init_p1: 0.7, init_p2: 2.1, init_total_onsite: 2.8, init_min_onsite: 2.0, init_total: 3.5, mon_doc: 0.2, mon_onsite: 0.9, mon_min_onsite: 0.8, mon_total: 1.2, recert_doc: 0.5, recert_onsite: 1.9, recert_min_onsite: 1.3, recert_total: 2.3 },
  { emp_min: 16, emp_max: 25, init_doc: 0.9, init_p1: 0.9, init_p2: 2.7, init_total_onsite: 3.6, init_min_onsite: 2.5, init_total: 4.5, mon_doc: 0.3, mon_onsite: 1.2, mon_min_onsite: 0.8, mon_total: 1.5, recert_doc: 0.6, recert_onsite: 2.4, recert_min_onsite: 1.7, recert_total: 3.0 },
  { emp_min: 26, emp_max: 45, init_doc: 1.1, init_p1: 1.1, init_p2: 3.3, init_total_onsite: 4.4, init_min_onsite: 3.1, init_total: 5.5, mon_doc: 0.4, mon_onsite: 1.5, mon_min_onsite: 1.0, mon_total: 1.8, recert_doc: 0.7, recert_onsite: 2.9, recert_min_onsite: 2.1, recert_total: 3.7 },
  { emp_min: 46, emp_max: 65, init_doc: 1.2, init_p1: 1.2, init_p2: 3.6, init_total_onsite: 4.8, init_min_onsite: 3.4, init_total: 6.0, mon_doc: 0.4, mon_onsite: 1.6, mon_min_onsite: 1.1, mon_total: 2.0, recert_doc: 0.8, recert_onsite: 3.2, recert_min_onsite: 2.2, recert_total: 4.0 },
  { emp_min: 66, emp_max: 85, init_doc: 1.4, init_p1: 1.4, init_p2: 4.2, init_total_onsite: 5.6, init_min_onsite: 3.9, init_total: 7.0, mon_doc: 0.5, mon_onsite: 1.9, mon_min_onsite: 1.3, mon_total: 2.3, recert_doc: 0.9, recert_onsite: 3.7, recert_min_onsite: 2.6, recert_total: 4.7 },
  { emp_min: 86, emp_max: 125, init_doc: 1.6, init_p1: 1.6, init_p2: 4.8, init_total_onsite: 6.4, init_min_onsite: 4.5, init_total: 8.0, mon_doc: 0.5, mon_onsite: 2.1, mon_min_onsite: 1.5, mon_total: 2.7, recert_doc: 1.1, recert_onsite: 4.3, recert_min_onsite: 3.0, recert_total: 5.3 },
  { emp_min: 126, emp_max: 175, init_doc: 1.8, init_p1: 1.8, init_p2: 5.4, init_total_onsite: 7.2, init_min_onsite: 5.0, init_total: 9.0, mon_doc: 0.6, mon_onsite: 2.4, mon_min_onsite: 1.7, mon_total: 3.0, recert_doc: 1.2, recert_onsite: 4.8, recert_min_onsite: 3.4, recert_total: 6.0 },
  { emp_min: 176, emp_max: 275, init_doc: 2.0, init_p1: 2.0, init_p2: 6.0, init_total_onsite: 8.0, init_min_onsite: 5.6, init_total: 10.0, mon_doc: 0.7, mon_onsite: 2.7, mon_min_onsite: 1.9, mon_total: 3.3, recert_doc: 1.3, recert_onsite: 5.3, recert_min_onsite: 3.7, recert_total: 6.7 },
  { emp_min: 276, emp_max: 425, init_doc: 2.2, init_p1: 2.2, init_p2: 6.6, init_total_onsite: 8.8, init_min_onsite: 6.2, init_total: 11.0, mon_doc: 0.7, mon_onsite: 2.9, mon_min_onsite: 2.1, mon_total: 3.7, recert_doc: 1.5, recert_onsite: 5.9, recert_min_onsite: 4.1, recert_total: 7.3 },
  { emp_min: 426, emp_max: 625, init_doc: 2.4, init_p1: 2.4, init_p2: 7.2, init_total_onsite: 9.6, init_min_onsite: 6.7, init_total: 12.0, mon_doc: 0.8, mon_onsite: 3.2, mon_min_onsite: 2.2, mon_total: 4.0, recert_doc: 1.6, recert_onsite: 6.4, recert_min_onsite: 4.5, recert_total: 8.0 },
  { emp_min: 626, emp_max: 875, init_doc: 2.6, init_p1: 2.6, init_p2: 7.8, init_total_onsite: 10.4, init_min_onsite: 7.3, init_total: 13.0, mon_doc: 0.9, mon_onsite: 3.5, mon_min_onsite: 2.4, mon_total: 4.3, recert_doc: 1.7, recert_onsite: 6.9, recert_min_onsite: 4.9, recert_total: 8.7 },
  { emp_min: 876, emp_max: 1175, init_doc: 3.0, init_p1: 3.0, init_p2: 9.0, init_total_onsite: 12.0, init_min_onsite: 8.4, init_total: 15.0, mon_doc: 1.0, mon_onsite: 4.0, mon_min_onsite: 2.8, mon_total: 5.0, recert_doc: 2.0, recert_onsite: 8.0, recert_min_onsite: 5.6, recert_total: 10.0 },
  { emp_min: 1176, emp_max: 1550, init_doc: 3.2, init_p1: 3.2, init_p2: 9.6, init_total_onsite: 12.8, init_min_onsite: 9.0, init_total: 16.0, mon_doc: 1.1, mon_onsite: 4.3, mon_min_onsite: 3.0, mon_total: 5.3, recert_doc: 2.1, recert_onsite: 8.5, recert_min_onsite: 6.0, recert_total: 10.7 },
  { emp_min: 1551, emp_max: 2025, init_doc: 3.4, init_p1: 3.4, init_p2: 10.2, init_total_onsite: 13.6, init_min_onsite: 9.5, init_total: 17.0, mon_doc: 1.1, mon_onsite: 4.5, mon_min_onsite: 3.2, mon_total: 5.7, recert_doc: 2.3, recert_onsite: 9.1, recert_min_onsite: 6.3, recert_total: 11.3 },
  { emp_min: 2026, emp_max: 2675, init_doc: 3.6, init_p1: 3.6, init_p2: 10.8, init_total_onsite: 14.4, init_min_onsite: 10.1, init_total: 18.0, mon_doc: 1.2, mon_onsite: 4.8, mon_min_onsite: 3.4, mon_total: 6.0, recert_doc: 2.4, recert_onsite: 9.6, recert_min_onsite: 6.7, recert_total: 12.0 },
  { emp_min: 2676, emp_max: 3450, init_doc: 3.8, init_p1: 3.8, init_p2: 11.4, init_total_onsite: 15.2, init_min_onsite: 10.6, init_total: 19.0, mon_doc: 1.3, mon_onsite: 5.1, mon_min_onsite: 3.5, mon_total: 6.3, recert_doc: 2.5, recert_onsite: 10.1, recert_min_onsite: 7.1, recert_total: 12.7 },
  { emp_min: 3451, emp_max: 4350, init_doc: 4.0, init_p1: 4.0, init_p2: 12.0, init_total_onsite: 16.0, init_min_onsite: 11.2, init_total: 20.0, mon_doc: 1.3, mon_onsite: 5.3, mon_min_onsite: 3.7, mon_total: 6.7, recert_doc: 2.7, recert_onsite: 10.7, recert_min_onsite: 7.5, recert_total: 13.3 },
  { emp_min: 4351, emp_max: 5450, init_doc: 4.2, init_p1: 4.2, init_p2: 12.6, init_total_onsite: 16.8, init_min_onsite: 11.8, init_total: 21.0, mon_doc: 1.4, mon_onsite: 5.6, mon_min_onsite: 3.9, mon_total: 7.0, recert_doc: 2.8, recert_onsite: 11.2, recert_min_onsite: 7.8, recert_total: 14.0 },
  { emp_min: 5451, emp_max: 6800, init_doc: 4.6, init_p1: 4.6, init_p2: 13.8, init_total_onsite: 18.4, init_min_onsite: 12.9, init_total: 23.0, mon_doc: 1.5, mon_onsite: 6.1, mon_min_onsite: 4.3, mon_total: 7.7, recert_doc: 3.1, recert_onsite: 12.3, recert_min_onsite: 8.6, recert_total: 15.3 },
  { emp_min: 6801, emp_max: 8500, init_doc: 5.0, init_p1: 5.0, init_p2: 15.0, init_total_onsite: 20.0, init_min_onsite: 14.0, init_total: 25.0, mon_doc: 1.7, mon_onsite: 6.7, mon_min_onsite: 4.7, mon_total: 8.3, recert_doc: 3.3, recert_onsite: 13.3, recert_min_onsite: 9.3, recert_total: 16.7 },
  { emp_min: 8501, emp_max: 10700, init_doc: 5.4, init_p1: 5.4, init_p2: 16.2, init_total_onsite: 21.6, init_min_onsite: 15.1, init_total: 27.0, mon_doc: 1.8, mon_onsite: 7.2, mon_min_onsite: 5.0, mon_total: 9.0, recert_doc: 3.6, recert_onsite: 14.4, recert_min_onsite: 10.1, recert_total: 18.0 },
];

const ES3: MandayRow[] = [
  { emp_min: 1, emp_max: 5, init_doc: 0.6, init_p1: 0.6, init_p2: 1.8, init_total_onsite: 2.4, init_min_onsite: 1.7, init_total: 3.0, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.4, recert_onsite: 1.6, recert_min_onsite: 1.1, recert_total: 2.0 },
  { emp_min: 6, emp_max: 10, init_doc: 0.6, init_p1: 0.6, init_p2: 1.8, init_total_onsite: 2.4, init_min_onsite: 1.7, init_total: 3.0, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.4, recert_onsite: 1.6, recert_min_onsite: 1.1, recert_total: 2.0 },
  { emp_min: 11, emp_max: 15, init_doc: 0.6, init_p1: 0.6, init_p2: 1.8, init_total_onsite: 2.4, init_min_onsite: 1.7, init_total: 3.0, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.4, recert_onsite: 1.6, recert_min_onsite: 1.1, recert_total: 2.0 },
  { emp_min: 16, emp_max: 25, init_doc: 0.7, init_p1: 0.7, init_p2: 2.1, init_total_onsite: 2.8, init_min_onsite: 2.0, init_total: 3.5, mon_doc: 0.2, mon_onsite: 0.9, mon_min_onsite: 0.8, mon_total: 1.2, recert_doc: 0.5, recert_onsite: 1.9, recert_min_onsite: 1.3, recert_total: 2.3 },
  { emp_min: 26, emp_max: 45, init_doc: 0.8, init_p1: 0.8, init_p2: 2.4, init_total_onsite: 3.2, init_min_onsite: 2.2, init_total: 4.0, mon_doc: 0.3, mon_onsite: 1.1, mon_min_onsite: 0.8, mon_total: 1.3, recert_doc: 0.5, recert_onsite: 2.1, recert_min_onsite: 1.5, recert_total: 2.7 },
  { emp_min: 46, emp_max: 65, init_doc: 0.9, init_p1: 0.9, init_p2: 2.7, init_total_onsite: 3.6, init_min_onsite: 2.5, init_total: 4.5, mon_doc: 0.3, mon_onsite: 1.2, mon_min_onsite: 0.8, mon_total: 1.5, recert_doc: 0.6, recert_onsite: 2.4, recert_min_onsite: 1.7, recert_total: 3.0 },
  { emp_min: 66, emp_max: 85, init_doc: 1.0, init_p1: 1.0, init_p2: 3.0, init_total_onsite: 4.0, init_min_onsite: 2.8, init_total: 5.0, mon_doc: 0.3, mon_onsite: 1.3, mon_min_onsite: 0.9, mon_total: 1.7, recert_doc: 0.7, recert_onsite: 2.7, recert_min_onsite: 1.9, recert_total: 3.3 },
  { emp_min: 86, emp_max: 125, init_doc: 1.1, init_p1: 1.1, init_p2: 3.3, init_total_onsite: 4.4, init_min_onsite: 3.1, init_total: 5.5, mon_doc: 0.4, mon_onsite: 1.5, mon_min_onsite: 1.0, mon_total: 1.8, recert_doc: 0.7, recert_onsite: 2.9, recert_min_onsite: 2.1, recert_total: 3.7 },
  { emp_min: 126, emp_max: 175, init_doc: 1.2, init_p1: 1.2, init_p2: 3.6, init_total_onsite: 4.8, init_min_onsite: 3.4, init_total: 6.0, mon_doc: 0.4, mon_onsite: 1.6, mon_min_onsite: 1.1, mon_total: 2.0, recert_doc: 0.8, recert_onsite: 3.2, recert_min_onsite: 2.2, recert_total: 4.0 },
  { emp_min: 176, emp_max: 275, init_doc: 1.4, init_p1: 1.4, init_p2: 4.2, init_total_onsite: 5.6, init_min_onsite: 3.9, init_total: 7.0, mon_doc: 0.5, mon_onsite: 1.9, mon_min_onsite: 1.3, mon_total: 2.3, recert_doc: 0.9, recert_onsite: 3.7, recert_min_onsite: 2.6, recert_total: 4.7 },
  { emp_min: 276, emp_max: 425, init_doc: 1.6, init_p1: 1.6, init_p2: 4.8, init_total_onsite: 6.4, init_min_onsite: 4.5, init_total: 8.0, mon_doc: 0.5, mon_onsite: 2.1, mon_min_onsite: 1.5, mon_total: 2.7, recert_doc: 1.1, recert_onsite: 4.3, recert_min_onsite: 3.0, recert_total: 5.3 },
  { emp_min: 426, emp_max: 625, init_doc: 1.8, init_p1: 1.8, init_p2: 5.4, init_total_onsite: 7.2, init_min_onsite: 5.0, init_total: 9.0, mon_doc: 0.6, mon_onsite: 2.4, mon_min_onsite: 1.7, mon_total: 3.0, recert_doc: 1.2, recert_onsite: 4.8, recert_min_onsite: 3.4, recert_total: 6.0 },
  { emp_min: 626, emp_max: 875, init_doc: 2.0, init_p1: 2.0, init_p2: 6.0, init_total_onsite: 8.0, init_min_onsite: 5.6, init_total: 10.0, mon_doc: 0.7, mon_onsite: 2.7, mon_min_onsite: 1.9, mon_total: 3.3, recert_doc: 1.3, recert_onsite: 5.3, recert_min_onsite: 3.7, recert_total: 6.7 },
  { emp_min: 876, emp_max: 1175, init_doc: 2.2, init_p1: 2.2, init_p2: 6.6, init_total_onsite: 8.8, init_min_onsite: 6.2, init_total: 11.0, mon_doc: 0.7, mon_onsite: 2.9, mon_min_onsite: 2.1, mon_total: 3.7, recert_doc: 1.5, recert_onsite: 5.9, recert_min_onsite: 4.1, recert_total: 7.3 },
  { emp_min: 1176, emp_max: 1550, init_doc: 2.4, init_p1: 2.4, init_p2: 7.2, init_total_onsite: 9.6, init_min_onsite: 6.7, init_total: 12.0, mon_doc: 0.8, mon_onsite: 3.2, mon_min_onsite: 2.2, mon_total: 4.0, recert_doc: 1.6, recert_onsite: 6.4, recert_min_onsite: 4.5, recert_total: 8.0 },
  { emp_min: 1551, emp_max: 2025, init_doc: 2.4, init_p1: 2.4, init_p2: 7.2, init_total_onsite: 9.6, init_min_onsite: 6.7, init_total: 12.0, mon_doc: 0.8, mon_onsite: 3.2, mon_min_onsite: 2.2, mon_total: 4.0, recert_doc: 1.6, recert_onsite: 6.4, recert_min_onsite: 4.5, recert_total: 8.0 },
  { emp_min: 2026, emp_max: 2675, init_doc: 2.6, init_p1: 2.6, init_p2: 7.8, init_total_onsite: 10.4, init_min_onsite: 7.3, init_total: 13.0, mon_doc: 0.9, mon_onsite: 3.5, mon_min_onsite: 2.4, mon_total: 4.3, recert_doc: 1.7, recert_onsite: 6.9, recert_min_onsite: 4.9, recert_total: 8.7 },
  { emp_min: 2676, emp_max: 3450, init_doc: 2.8, init_p1: 2.8, init_p2: 8.4, init_total_onsite: 11.2, init_min_onsite: 7.8, init_total: 14.0, mon_doc: 0.9, mon_onsite: 3.7, mon_min_onsite: 2.6, mon_total: 4.7, recert_doc: 1.9, recert_onsite: 7.5, recert_min_onsite: 5.2, recert_total: 9.3 },
  { emp_min: 3451, emp_max: 4350, init_doc: 3.0, init_p1: 3.0, init_p2: 9.0, init_total_onsite: 12.0, init_min_onsite: 8.4, init_total: 15.0, mon_doc: 1.0, mon_onsite: 4.0, mon_min_onsite: 2.8, mon_total: 5.0, recert_doc: 2.0, recert_onsite: 8.0, recert_min_onsite: 5.6, recert_total: 10.0 },
  { emp_min: 4351, emp_max: 5450, init_doc: 3.2, init_p1: 3.2, init_p2: 9.6, init_total_onsite: 12.8, init_min_onsite: 9.0, init_total: 16.0, mon_doc: 1.1, mon_onsite: 4.3, mon_min_onsite: 3.0, mon_total: 5.3, recert_doc: 2.1, recert_onsite: 8.5, recert_min_onsite: 6.0, recert_total: 10.7 },
  { emp_min: 5451, emp_max: 6800, init_doc: 3.4, init_p1: 3.4, init_p2: 10.2, init_total_onsite: 13.6, init_min_onsite: 9.5, init_total: 17.0, mon_doc: 1.1, mon_onsite: 4.5, mon_min_onsite: 3.2, mon_total: 5.7, recert_doc: 2.3, recert_onsite: 9.1, recert_min_onsite: 6.3, recert_total: 11.3 },
  { emp_min: 6801, emp_max: 8500, init_doc: 3.8, init_p1: 3.8, init_p2: 11.4, init_total_onsite: 15.2, init_min_onsite: 10.6, init_total: 19.0, mon_doc: 1.3, mon_onsite: 5.1, mon_min_onsite: 3.5, mon_total: 6.3, recert_doc: 2.5, recert_onsite: 10.1, recert_min_onsite: 7.1, recert_total: 12.7 },
  { emp_min: 8501, emp_max: 10700, init_doc: 4.0, init_p1: 4.0, init_p2: 12.0, init_total_onsite: 16.0, init_min_onsite: 11.2, init_total: 20.0, mon_doc: 1.3, mon_onsite: 5.3, mon_min_onsite: 3.7, mon_total: 6.7, recert_doc: 2.7, recert_onsite: 10.7, recert_min_onsite: 7.5, recert_total: 13.3 },
];

const E_LimitedComplex: MandayRow[] = [
  { emp_min: 1, emp_max: 5, init_doc: 0.6, init_p1: 0.6, init_p2: 1.8, init_total_onsite: 2.4, init_min_onsite: 1.7, init_total: 3.0, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.4, recert_onsite: 1.6, recert_min_onsite: 1.1, recert_total: 2.0 },
  { emp_min: 6, emp_max: 10, init_doc: 0.6, init_p1: 0.6, init_p2: 1.8, init_total_onsite: 2.4, init_min_onsite: 1.7, init_total: 3.0, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.4, recert_onsite: 1.6, recert_min_onsite: 1.1, recert_total: 2.0 },
  { emp_min: 11, emp_max: 15, init_doc: 0.6, init_p1: 0.6, init_p2: 1.8, init_total_onsite: 2.4, init_min_onsite: 1.7, init_total: 3.0, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.4, recert_onsite: 1.6, recert_min_onsite: 1.1, recert_total: 2.0 },
  { emp_min: 16, emp_max: 25, init_doc: 0.6, init_p1: 0.6, init_p2: 1.8, init_total_onsite: 2.4, init_min_onsite: 1.7, init_total: 3.0, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.4, recert_onsite: 1.6, recert_min_onsite: 1.1, recert_total: 2.0 },
  { emp_min: 26, emp_max: 45, init_doc: 0.6, init_p1: 0.6, init_p2: 1.8, init_total_onsite: 2.4, init_min_onsite: 1.7, init_total: 3.0, mon_doc: 0.2, mon_onsite: 0.8, mon_min_onsite: 0.8, mon_total: 1.0, recert_doc: 0.4, recert_onsite: 1.6, recert_min_onsite: 1.1, recert_total: 2.0 },
  { emp_min: 46, emp_max: 65, init_doc: 0.7, init_p1: 0.7, init_p2: 2.1, init_total_onsite: 2.8, init_min_onsite: 2.0, init_total: 3.5, mon_doc: 0.2, mon_onsite: 0.9, mon_min_onsite: 0.8, mon_total: 1.2, recert_doc: 0.5, recert_onsite: 1.9, recert_min_onsite: 1.3, recert_total: 2.3 },
  { emp_min: 66, emp_max: 85, init_doc: 0.7, init_p1: 0.7, init_p2: 2.1, init_total_onsite: 2.8, init_min_onsite: 2.0, init_total: 3.5, mon_doc: 0.2, mon_onsite: 0.9, mon_min_onsite: 0.8, mon_total: 1.2, recert_doc: 0.5, recert_onsite: 1.9, recert_min_onsite: 1.3, recert_total: 2.3 },
  { emp_min: 86, emp_max: 125, init_doc: 0.8, init_p1: 0.8, init_p2: 2.4, init_total_onsite: 3.2, init_min_onsite: 2.2, init_total: 4.0, mon_doc: 0.3, mon_onsite: 1.1, mon_min_onsite: 0.8, mon_total: 1.3, recert_doc: 0.5, recert_onsite: 2.1, recert_min_onsite: 1.5, recert_total: 2.7 },
  { emp_min: 126, emp_max: 175, init_doc: 0.9, init_p1: 0.9, init_p2: 2.7, init_total_onsite: 3.6, init_min_onsite: 2.5, init_total: 4.5, mon_doc: 0.3, mon_onsite: 1.2, mon_min_onsite: 0.8, mon_total: 1.5, recert_doc: 0.6, recert_onsite: 2.4, recert_min_onsite: 1.7, recert_total: 3.0 },
  { emp_min: 176, emp_max: 275, init_doc: 1.0, init_p1: 1.0, init_p2: 3.0, init_total_onsite: 4.0, init_min_onsite: 2.8, init_total: 5.0, mon_doc: 0.3, mon_onsite: 1.3, mon_min_onsite: 0.9, mon_total: 1.7, recert_doc: 0.7, recert_onsite: 2.7, recert_min_onsite: 1.9, recert_total: 3.3 },
  { emp_min: 276, emp_max: 425, init_doc: 1.1, init_p1: 1.1, init_p2: 3.3, init_total_onsite: 4.4, init_min_onsite: 3.1, init_total: 5.5, mon_doc: 0.4, mon_onsite: 1.5, mon_min_onsite: 1.0, mon_total: 1.8, recert_doc: 0.7, recert_onsite: 2.9, recert_min_onsite: 2.1, recert_total: 3.7 },
  { emp_min: 426, emp_max: 625, init_doc: 1.2, init_p1: 1.2, init_p2: 3.6, init_total_onsite: 4.8, init_min_onsite: 3.4, init_total: 6.0, mon_doc: 0.4, mon_onsite: 1.6, mon_min_onsite: 1.1, mon_total: 2.0, recert_doc: 0.8, recert_onsite: 3.2, recert_min_onsite: 2.2, recert_total: 4.0 },
  { emp_min: 626, emp_max: 875, init_doc: 1.3, init_p1: 1.3, init_p2: 3.9, init_total_onsite: 5.2, init_min_onsite: 3.6, init_total: 6.5, mon_doc: 0.4, mon_onsite: 1.7, mon_min_onsite: 1.2, mon_total: 2.2, recert_doc: 0.9, recert_onsite: 3.5, recert_min_onsite: 2.4, recert_total: 4.3 },
  { emp_min: 876, emp_max: 1175, init_doc: 1.4, init_p1: 1.4, init_p2: 4.2, init_total_onsite: 5.6, init_min_onsite: 3.9, init_total: 7.0, mon_doc: 0.5, mon_onsite: 1.9, mon_min_onsite: 1.3, mon_total: 2.3, recert_doc: 0.9, recert_onsite: 3.7, recert_min_onsite: 2.6, recert_total: 4.7 },
  { emp_min: 1176, emp_max: 1550, init_doc: 1.5, init_p1: 1.5, init_p2: 4.5, init_total_onsite: 6.0, init_min_onsite: 4.2, init_total: 7.5, mon_doc: 0.5, mon_onsite: 2.0, mon_min_onsite: 1.4, mon_total: 2.5, recert_doc: 1.0, recert_onsite: 4.0, recert_min_onsite: 2.8, recert_total: 5.0 },
  { emp_min: 1551, emp_max: 2025, init_doc: 1.6, init_p1: 1.6, init_p2: 4.8, init_total_onsite: 6.4, init_min_onsite: 4.5, init_total: 8.0, mon_doc: 0.5, mon_onsite: 2.1, mon_min_onsite: 1.5, mon_total: 2.7, recert_doc: 1.1, recert_onsite: 4.3, recert_min_onsite: 3.0, recert_total: 5.3 },
  { emp_min: 2026, emp_max: 2675, init_doc: 1.7, init_p1: 1.7, init_p2: 5.1, init_total_onsite: 6.8, init_min_onsite: 4.8, init_total: 8.5, mon_doc: 0.6, mon_onsite: 2.3, mon_min_onsite: 1.6, mon_total: 2.8, recert_doc: 1.1, recert_onsite: 4.5, recert_min_onsite: 3.2, recert_total: 5.7 },
  { emp_min: 2676, emp_max: 3450, init_doc: 1.8, init_p1: 1.8, init_p2: 5.4, init_total_onsite: 7.2, init_min_onsite: 5.0, init_total: 9.0, mon_doc: 0.6, mon_onsite: 2.4, mon_min_onsite: 1.7, mon_total: 3.0, recert_doc: 1.2, recert_onsite: 4.8, recert_min_onsite: 3.4, recert_total: 6.0 },
  { emp_min: 3451, emp_max: 4350, init_doc: 2.0, init_p1: 2.0, init_p2: 6.0, init_total_onsite: 8.0, init_min_onsite: 5.6, init_total: 10.0, mon_doc: 0.7, mon_onsite: 2.7, mon_min_onsite: 1.9, mon_total: 3.3, recert_doc: 1.3, recert_onsite: 5.3, recert_min_onsite: 3.7, recert_total: 6.7 },
  { emp_min: 4351, emp_max: 5450, init_doc: 2.2, init_p1: 2.2, init_p2: 6.6, init_total_onsite: 8.8, init_min_onsite: 6.2, init_total: 11.0, mon_doc: 0.7, mon_onsite: 2.9, mon_min_onsite: 2.1, mon_total: 3.7, recert_doc: 1.5, recert_onsite: 5.9, recert_min_onsite: 4.1, recert_total: 7.3 },
  { emp_min: 5451, emp_max: 6800, init_doc: 2.4, init_p1: 2.4, init_p2: 7.2, init_total_onsite: 9.6, init_min_onsite: 6.7, init_total: 12.0, mon_doc: 0.8, mon_onsite: 3.2, mon_min_onsite: 2.2, mon_total: 4.0, recert_doc: 1.6, recert_onsite: 6.4, recert_min_onsite: 4.5, recert_total: 8.0 },
  { emp_min: 6801, emp_max: 8500, init_doc: 2.6, init_p1: 2.6, init_p2: 7.8, init_total_onsite: 10.4, init_min_onsite: 7.3, init_total: 13.0, mon_doc: 0.9, mon_onsite: 3.5, mon_min_onsite: 2.4, mon_total: 4.3, recert_doc: 1.7, recert_onsite: 6.9, recert_min_onsite: 4.9, recert_total: 8.7 },
  { emp_min: 8501, emp_max: 10700, init_doc: 2.8, init_p1: 2.8, init_p2: 8.4, init_total_onsite: 11.2, init_min_onsite: 7.8, init_total: 14.0, mon_doc: 0.9, mon_onsite: 3.7, mon_min_onsite: 2.6, mon_total: 4.7, recert_doc: 1.9, recert_onsite: 7.5, recert_min_onsite: 5.2, recert_total: 9.3 },
];

export const MANDAY_TABLES: Record<string, MandayRow[]> = {
  'Q一级风险': Q1,
  'Q二级风险': Q2,
  'ES一级风险': ES1,
  'ES二级风险': ES2,
  'ES三级风险': ES3,
  'E有限复杂': E_LimitedComplex,
};

// 能源管理体系审核人天表
export interface EnergyTable4Row {
  emp_min: number; emp_max: number | null;
  low: number; mid: number; high: number;
}

export interface EnergyTable5Row {
  emp_min: number; emp_max: number | null;
  mon_low: number; recert_low: number;
  mon_mid: number; recert_mid: number;
  mon_high: number; recert_high: number;
}

export const ENERGY_TABLE4: EnergyTable4Row[] = [
  { emp_min: 1, emp_max: 8, low: 4.0, mid: 6.0, high: 7.0 },
  { emp_min: 9, emp_max: 15, low: 4.0, mid: 6.0, high: 7.0 },
  { emp_min: 16, emp_max: 25, low: 5.0, mid: 7.0, high: 9.0 },
  { emp_min: 26, emp_max: 65, low: 6.5, mid: 8.0, high: 10.0 },
  { emp_min: 66, emp_max: 85, low: 8.0, mid: 9.5, high: 11.5 },
  { emp_min: 86, emp_max: 175, low: 8.5, mid: 11.0, high: 12.0 },
  { emp_min: 176, emp_max: 275, low: 9.0, mid: 11.5, high: 12.5 },
  { emp_min: 276, emp_max: 425, low: 10.0, mid: 13.0, high: 15.0 },
  { emp_min: 426, emp_max: 625, low: 10.5, mid: 13.5, high: 15.5 },
  { emp_min: 626, emp_max: 875, low: 11.0, mid: 14.0, high: 16.0 },
  { emp_min: 876, emp_max: 1175, low: 13.0, mid: 16.0, high: 18.0 },
  { emp_min: 1176, emp_max: 1550, low: 14.0, mid: 17.0, high: 19.0 },
  { emp_min: 1551, emp_max: 2025, low: 15.0, mid: 18.0, high: 20.0 },
  { emp_min: 2026, emp_max: 2675, low: 16.0, mid: 19.0, high: 21.0 },
  { emp_min: 2676, emp_max: 3450, low: 17.0, mid: 20.0, high: 22.0 },
  { emp_min: 3451, emp_max: 4350, low: 18.0, mid: 21.0, high: 23.0 },
  { emp_min: 4351, emp_max: 5450, low: 19.0, mid: 22.0, high: 24.0 },
  { emp_min: 5451, emp_max: 6800, low: 21.0, mid: 24.0, high: 26.0 },
  { emp_min: 6801, emp_max: 8500, low: 23.0, mid: 26.0, high: 28.0 },
  { emp_min: 8501, emp_max: 10700, low: 25.0, mid: 28.0, high: 30.0 },
];

export const ENERGY_TABLE5: EnergyTable5Row[] = [
  { emp_min: 8, emp_max: 1, mon_low: 3.0, recert_low: 2.0, mon_mid: 4.0, recert_mid: 2.5, mon_high: 5.0, recert_high: 0 },
  { emp_min: 15, emp_max: 1, mon_low: 3.0, recert_low: 2.0, mon_mid: 4.0, recert_mid: 2.5, mon_high: 5.0, recert_high: 0 },
  { emp_min: 25, emp_max: null, mon_low: 3.5, recert_low: 2.5, mon_mid: 5.0, recert_mid: 3.0, mon_high: 6.0, recert_high: 0 },
  { emp_min: 65, emp_max: null, mon_low: 5.0, recert_low: 3.0, mon_mid: 6.0, recert_mid: 3.5, mon_high: 7.0, recert_high: 0 },
  { emp_min: 85, emp_max: 3, mon_low: 6.0, recert_low: 3.5, mon_mid: 6.5, recert_mid: 4.0, mon_high: 8.5, recert_high: 0 },
  { emp_min: 175, emp_max: 3, mon_low: 6.0, recert_low: 4.0, mon_mid: 7.5, recert_mid: 4.0, mon_high: 8.5, recert_high: 0 },
  { emp_min: 275, emp_max: null, mon_low: 6.0, recert_low: 4.0, mon_mid: 8.0, recert_mid: 4.5, mon_high: 9.5, recert_high: 0 },
  { emp_min: 425, emp_max: null, mon_low: 7.0, recert_low: 4.5, mon_mid: 9.0, recert_mid: 5.0, mon_high: 11.0, recert_high: 0 },
  { emp_min: 625, emp_max: null, mon_low: 7.0, recert_low: 4.5, mon_mid: 9.0, recert_mid: 5.5, mon_high: 11.0, recert_high: 0 },
  { emp_min: 875, emp_max: 4, mon_low: 7.5, recert_low: 5.0, mon_mid: 9.5, recert_mid: 5.5, mon_high: 12.0, recert_high: 0 },
  { emp_min: 1175, emp_max: 4, mon_low: 9.0, recert_low: 5.5, mon_mid: 11.0, recert_mid: 6.0, mon_high: 12.5, recert_high: 0 },
  { emp_min: 1550, emp_max: 5, mon_low: 9.5, recert_low: 6.0, mon_mid: 11.5, recert_mid: 6.5, mon_high: 13.0, recert_high: 0 },
  { emp_min: 2025, emp_max: null, mon_low: 10.0, recert_low: 6.0, mon_mid: 12.0, recert_mid: 7.0, mon_high: 13.5, recert_high: 0 },
  { emp_min: 2675, emp_max: 5, mon_low: 11.0, recert_low: 6.5, mon_mid: 13.0, recert_mid: 7.0, mon_high: 14.0, recert_high: 0 },
  { emp_min: 3450, emp_max: 6, mon_low: 11.5, recert_low: 7.0, mon_mid: 13.5, recert_mid: 7.5, mon_high: 15.0, recert_high: 0 },
  { emp_min: 4350, emp_max: null, mon_low: 12.0, recert_low: 7.0, mon_mid: 14.0, recert_mid: 8.0, mon_high: 15.5, recert_high: 0 },
  { emp_min: 5450, emp_max: 6, mon_low: 13.0, recert_low: 7.5, mon_mid: 15.0, recert_mid: 8.0, mon_high: 16.0, recert_high: 0 },
  { emp_min: 6800, emp_max: null, mon_low: 14.0, recert_low: 8.0, mon_mid: 16.0, recert_mid: 9.0, mon_high: 17.5, recert_high: 0 },
  { emp_min: 8500, emp_max: null, mon_low: 16.0, recert_low: 9.0, mon_mid: 17.5, recert_mid: 9.5, mon_high: 19.0, recert_high: 0 },
  { emp_min: 10700, emp_max: 8, mon_low: 17.0, recert_low: 9.5, mon_mid: 19.0, recert_mid: 10.0, mon_high: 20.0, recert_high: 0 },
];