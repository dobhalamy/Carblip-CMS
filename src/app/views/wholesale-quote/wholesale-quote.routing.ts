import { Routes } from '@angular/router';

import { PendingChangesGuard } from 'app/shared/services/pending-changes.guard';
import { WholesaleQuoteEditComponent } from './edit/edit.component';
import { WholesaleQuoteComponent } from './wholesale-quote.component';

export const WholesaleQuoteRoutes: Routes = [
  {
    path: '',
    component: WholesaleQuoteComponent,
  },
  {
    path: ':registerUserId/add',
    component: WholesaleQuoteEditComponent,
    canDeactivate: [PendingChangesGuard],
    data: { title: 'Add', breadcrumb: 'ADD' },
  },
  {
    path: ':id/edit',
    component: WholesaleQuoteEditComponent,
    canDeactivate: [PendingChangesGuard],
    data: { title: 'Edit', breadcrumb: 'EDIT' },
  },
];
