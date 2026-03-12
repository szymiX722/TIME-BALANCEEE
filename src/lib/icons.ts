/* Icon mapper - maps string names to lucide icons */
import {
  BookOpen, Dumbbell, Book, Moon, Briefcase, Gamepad2,
  Smartphone, UtensilsCrossed, Car, MoreHorizontal, LucideIcon,
  CircleDot
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen, Dumbbell, Book, Moon, Briefcase, Gamepad2,
  Smartphone, UtensilsCrossed, Car, MoreHorizontal, CircleDot,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || CircleDot;
}
