import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ChartPieIcon } from '@phosphor-icons/react/dist/ssr/ChartPie';
import { HouseIcon } from '@phosphor-icons/react/dist/ssr/House';
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';
import { UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { WrenchIcon } from '@phosphor-icons/react/dist/ssr/Wrench';
import { CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar';
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';

export const navIcons = {
  'chart-pie': ChartPieIcon,
  'house': HouseIcon,
  'file-text': FileTextIcon,
  'users': UsersIcon,
  'wrench': WrenchIcon,
  'currency-dollar': CurrencyDollarIcon,
  'user': UserIcon,
  'gear-six': GearSixIcon,
} as Record<string, Icon>;
