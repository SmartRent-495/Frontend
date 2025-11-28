import type { ColorSystemOptions } from '@mui/material/styles';

import { 
  metuRed, 
  metuDarkBlue, 
  metuGold, 
  metuGray, 
  success, 
  error, 
  warning, 
  info 
} from './colors';
import type { ColorScheme } from './types';

export const colorSchemes = {
  dark: {
    palette: {
      action: { disabledBackground: 'rgba(0, 0, 0, 0.12)' },
      background: {
        default: 'var(--mui-palette-neutral-950)',
        defaultChannel: '15 23 42', // metuGray[950] RGB
        paper: 'var(--mui-palette-neutral-900)',
        paperChannel: '31 41 55', // metuGray[800] RGB
        level1: 'var(--mui-palette-neutral-800)',
        level2: 'var(--mui-palette-neutral-700)',
        level3: 'var(--mui-palette-neutral-600)',
      },
      common: { black: '#000000', white: '#ffffff' },
      divider: 'var(--mui-palette-neutral-700)',
      dividerChannel: '55 65 81', // metuGray[700] RGB
      error: {
        ...error,
        light: error[300],
        main: error[500],
        dark: error[700],
        contrastText: 'var(--mui-palette-common-white)',
      },
      info: {
        ...info,
        light: info[300],
        main: info[500],
        dark: info[700],
        contrastText: 'var(--mui-palette-common-white)',
      },
      neutral: { ...metuGray },
      primary: {
        ...metuRed,
        light: metuRed[400],
        main: metuRed[600], // METU Red
        dark: metuRed[800],
        contrastText: 'var(--mui-palette-common-white)',
      },
      secondary: {
        ...metuDarkBlue,
        light: metuDarkBlue[400],
        main: metuDarkBlue[600], // METU Dark Blue
        dark: metuDarkBlue[800],
        contrastText: 'var(--mui-palette-common-white)',
      },
      success: {
        ...success,
        light: success[400],
        main: success[600],
        dark: success[800],
        contrastText: 'var(--mui-palette-common-white)',
      },
      text: {
        primary: 'var(--mui-palette-common-white)',
        primaryChannel: '255 255 255',
        secondary: 'var(--mui-palette-neutral-300)',
        secondaryChannel: '209 213 219', // metuGray[300] RGB
        disabled: 'var(--mui-palette-neutral-500)',
      },
      warning: {
        ...warning,
        light: warning[400],
        main: warning[500],
        dark: warning[700],
        contrastText: 'var(--mui-palette-common-black)',
      },
    },
  },
  light: {
    palette: {
      action: { disabledBackground: 'rgba(0, 0, 0, 0.06)' },
      background: {
        default: 'var(--mui-palette-common-white)',
        defaultChannel: '255 255 255',
        paper: 'var(--mui-palette-common-white)',
        paperChannel: '255 255 255',
        level1: 'var(--mui-palette-neutral-50)',
        level2: 'var(--mui-palette-neutral-100)',
        level3: 'var(--mui-palette-neutral-200)',
      },
      common: { black: '#000000', white: '#ffffff' },
      divider: 'var(--mui-palette-neutral-200)',
      dividerChannel: '229 231 235', // metuGray[200] RGB
      error: {
        ...error,
        light: error[400],
        main: error[600],
        dark: error[800],
        contrastText: 'var(--mui-palette-common-white)',
      },
      info: {
        ...info,
        light: info[400],
        main: info[600],
        dark: info[800],
        contrastText: 'var(--mui-palette-common-white)',
      },
      neutral: { ...metuGray },
      primary: {
        ...metuRed,
        light: metuRed[400],
        main: metuRed[600], // METU Red
        dark: metuRed[800],
        contrastText: 'var(--mui-palette-common-white)',
      },
      secondary: {
        ...metuDarkBlue,
        light: metuDarkBlue[400],
        main: metuDarkBlue[700], // Slightly darker blue for better contrast
        dark: metuDarkBlue[900],
        contrastText: 'var(--mui-palette-common-white)',
      },
      success: {
        ...success,
        light: success[400],
        main: success[600],
        dark: success[800],
        contrastText: 'var(--mui-palette-common-white)',
      },
      text: {
        primary: 'var(--mui-palette-neutral-900)',
        primaryChannel: '17 24 39', // metuGray[900] RGB
        secondary: 'var(--mui-palette-neutral-600)',
        secondaryChannel: '75 85 99', // metuGray[600] RGB
        disabled: 'var(--mui-palette-neutral-400)',
      },
      warning: {
        ...warning,
        light: warning[400],
        main: warning[600],
        dark: warning[800],
        contrastText: 'var(--mui-palette-common-black)',
      },
    },
  },
} satisfies Partial<Record<ColorScheme, ColorSystemOptions>>;
