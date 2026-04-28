import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { parse, isWithinInterval, addHours, isAfter } from 'date-fns';
import { OperatingHours } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getOperatingStatus(hours: OperatingHours) {
  const now = new Date();
  const timeFormat = 'HH:mm';
  const openTime = parse(hours.open, timeFormat, now);
  const closeTime = parse(hours.close, timeFormat, now);
  
  // Handle overnight logic (e.g. 10:00 - 02:00)
  let actualClose = closeTime;
  if (isAfter(openTime, closeTime)) {
    actualClose = addHours(closeTime, 24);
  }

  const isOpen = isWithinInterval(now, { start: openTime, end: actualClose });
  const isClosingSoon = isOpen && isAfter(now, addHours(actualClose, -1));

  return { isOpen, isClosingSoon };
}
