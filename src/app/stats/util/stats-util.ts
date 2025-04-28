import { addDays, endOfMonth, format } from 'date-fns';

export type StatsPeriodType = 'daily' | 'weekly' | 'monthly';

/**
 * 통계 수집 기간 계산 유틸리티
 */
export function getPeriodRange(type: StatsPeriodType): { startDate: string; endDate: string } {
  const today = new Date();

  switch (type) {
    case 'daily': {
      const date = addDays(today, -1);
      const formatted = format(date, 'yyyy-MM-dd');
      return { startDate: formatted, endDate: formatted };
    }

    case 'weekly': {
      const end = addDays(today, -1);
      const start = addDays(end, -6);
      return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      };
    }

    case 'monthly': {
      const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfLastMonth = endOfMonth(firstDayOfLastMonth);
      return {
        startDate: format(firstDayOfLastMonth, 'yyyy-MM-dd'),
        endDate: format(lastDayOfLastMonth, 'yyyy-MM-dd'),
      };
    }

    default:
      throw new Error(`Invalid StatsPeriodType: ${type}`);
  }
}
