import {
  IcApps,
  IcBilling,
  IcGeneral,
  IcLibraries,
  IcTeam,
  IcUpgrade,
} from './icons';
import { ROUTES } from './routes';

export const PRIVATE_HEADER_MENU = [
  {
    title: 'Dashboard',
    path: ROUTES.DASHBOARD,
    children: [],
  },
  {
    title: 'Marketplace',
    path: '',
    children: [
      {
        title: 'Overview',
        path: '',
      },
      {
        title: 'Libraries',
        path: '',
      },
      {
        title: 'Apps',
        path: '',
      },
    ],
  },
  {
    title: 'Learn',
    path: '',
    children: [],
  },
  {
    title: 'Resources',
    path: '',
    children: [
      {
        title: 'Documentation',
        path: '',
      },
      {
        title: 'Tutorials',
        path: '',
      },
      {
        title: 'Blog',
        path: '',
      },
      {
        title: 'Community',
        path: '',
      },
    ],
  },
];

export const PRIVATE_SETTING_MENU = [
  {
    title: 'General',
    path: '',
    icon: IcGeneral,
    children: [],
  },
  {
    title: 'Team',
    path: '',
    icon: IcTeam,
    children: [],
  },
  {
    title: 'Plans',
    path: '',
    icon: IcUpgrade,
    children: [],
  },
  {
    title: 'Billing',
    path: '',
    icon: IcBilling,
    children: [],
  },
  {
    title: 'Apps & Integrations',
    path: '',
    icon: IcApps,
    children: [
      {
        title: 'Develop',
        path: '',
      },
      {
        title: 'Manage',
        path: '',
      },
    ],
  },
  {
    title: 'Libraries & Templates',
    path: '',
    icon: IcLibraries,
    children: [
      {
        title: 'Shared',
        path: '',
      },
      {
        title: 'Marketplace',
        path: '',
      },
    ],
  },
];
