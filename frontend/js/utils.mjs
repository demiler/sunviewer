export function dateToDTString(date) { //YYYY-MM-ddThh:mm
  const toUTC = new Date(date);
  toUTC.setMinutes(toUTC.getMinutes() - date.getTimezoneOffset());
  return toUTC.toISOString().replace(/:\d\d\.\d+Z$/, '');
}

export function padNumber02(num) { //1 -> '01', 2 -> '02', 10 -> '10', etc.
  return String(num).padStart(2, '0');
}

export function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
