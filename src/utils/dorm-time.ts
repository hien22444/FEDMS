export const DORM_TIMEZONE = 'Asia/Ho_Chi_Minh';

const DORM_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: DORM_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const DORM_TIME_PARTS_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: DORM_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const toDate = (value: Date | string | number) =>
  value instanceof Date ? value : new Date(value);

export const getDormDateKey = (value: Date | string | number) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = DORM_DATE_PARTS_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return year && month && day ? `${year}-${month}-${day}` : '';
};

export const getDormTimeMinutes = (value: Date | string | number = new Date()) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = DORM_TIME_PARTS_FORMATTER.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
};

