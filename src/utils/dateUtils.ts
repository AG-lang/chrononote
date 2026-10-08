/**
 * Date utility functions for ChronoNote
 */

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getTodayDateString(): string {
  return formatDate(new Date());
}

export function getDaysInMonth(year: number, monthZeroIndexed: number): number {
  return new Date(year, monthZeroIndexed + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, monthZeroIndexed: number): number {
  // 0 = Sunday, 1 = Monday ... We want Monday as start of week (0 = Monday, 6 = Sunday)
  const day = new Date(year, monthZeroIndexed, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export const MONTH_NAMES_ZH = [
  '一月 孟春', '二月 仲春', '三月 季春',
  '四月 孟夏', '五月 仲夏', '六月 季夏',
  '七月 孟秋', '八月 仲秋', '九月 季秋',
  '十月 孟冬', '十一月 仲冬', '十二月 季冬'
];

export const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const WEEKDAYS_ZH = ['一', '二', '三', '四', '五', '六', '日'];

export function formatFriendlyDate(dateStr: string): string {
  const d = parseDate(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()];
  return `${d.getFullYear()}年${month}月${day}日 · ${weekday}`;
}

export function formatDateCN(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

