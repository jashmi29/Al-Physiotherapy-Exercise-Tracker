import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLevelFromXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getXPForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

export function getLevelProgress(xp: number): number {
  const level = getLevelFromXP(xp);
  const xpForCurrentLevel = getXPForLevel(level);
  const xpForNextLevel = getXPForLevel(level + 1);
  const progress = (xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel);
  return Math.max(0, Math.min(100, Math.round(progress * 100)));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function calculateCalories(exercise: string, minutes: number, weight: number = 70): number {
  const metValues: Record<string, number> = {
    Squats: 8,
    'Arm Raises': 3,
    'Leg Raises': 4,
    Lunges: 7,
    'Knee Extensions': 2.5,
    'Heel Slides': 1.5,
    'Shoulder Rotations': 2,
    'Ankle Pumps': 1,
    'Physiotherapy Glute Bridges': 4,
    'Rehabilitation Wall Push-ups': 3,
  };
  const met = metValues[exercise] || 4;
  return Math.round((met * 3.5 * weight) / 200 * minutes);
}

