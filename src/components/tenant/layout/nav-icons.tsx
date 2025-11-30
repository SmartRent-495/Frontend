import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { CreditCard as CreditCardIcon } from '@phosphor-icons/react/dist/ssr/CreditCard';
import { FileText as FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';
import { Folder as FolderIcon } from '@phosphor-icons/react/dist/ssr/Folder';
import { House as HouseIcon } from '@phosphor-icons/react/dist/ssr/House';
import { Wrench as WrenchIcon } from '@phosphor-icons/react/dist/ssr/Wrench';

export const navIcons = {
  'buildings': BuildingsIcon,
  'credit-card': CreditCardIcon,
  'file-text': FileTextIcon,
  'folder': FolderIcon,
  'house': HouseIcon,
  'wrench': WrenchIcon,
} as Record<string, Icon>;
