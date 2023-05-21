import { Routes } from '@angular/router';

import { CmsUsersComponent } from './cmsusers.component';
import { CmsUsersDetailComponent } from './detail/detail.component';

export const CmsUsersRoutes: Routes = [
  {
    path: '',
    component: CmsUsersComponent,
  },
  {
    path: ':id',
    component: CmsUsersDetailComponent,
    data: { title: 'Detail', breadcrumb: 'DETAIL' },
  },
];
