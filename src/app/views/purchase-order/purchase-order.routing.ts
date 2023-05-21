import { Routes } from '@angular/router';
import { PurchaseOrderEditComponent } from './edit/edit.component';
import { PurchaseOrderComponent } from './purchase-order.component';

export const PurchaseOrderRoutes: Routes = [
  {
    path: '',
    component: PurchaseOrderComponent,
  },
  {
    path: ':id/edit',
    component: PurchaseOrderEditComponent,
    data: { title: 'Edit', breadcrumb: 'EDIT' },
  },
  {
    path: 'add',
    component: PurchaseOrderEditComponent,
    data: { title: 'Add', breadcrumb: 'ADD' },
  },
];
