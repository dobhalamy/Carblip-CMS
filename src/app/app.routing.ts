import { Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { AdminLayoutComponent } from './shared/components/layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './shared/components/layouts/auth-layout/auth-layout.component';
import { PrintLayoutComponent } from './shared/components/layouts/print-layout/print-layout.component';
import { AuthGuard } from './shared/services/auth/auth.guard';

export const rootRouterConfig: Routes = [
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full',
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'sessions',
        loadChildren: './views/sessions/sessions.module#SessionsModule',
        data: { title: '' },
      },
    ],
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'users',
        loadChildren: './views/users/users.module#UsersModule',
        data: { title: 'Users', breadcrumb: 'USERS' },
      },
      {
        path: 'locations',
        loadChildren: './views/locations/locations.module#LocationsModule',
        canActivate: [NgxPermissionsGuard],
        data: {
          title: 'Locations',
          breadcrumb: 'LOCATIONS',
          permissions: {
            only: ['superadmin', 'admin'],
          },
        },
      },
      {
        path: 'dealstage',
        loadChildren: './views/dealstage/dealstage.module#DealstageModule',
        canActivate: [NgxPermissionsGuard],
        data: {
          title: 'DealStage',
          breadcrumb: 'DEALSTAGE',
          permissions: {
            only: ['superadmin', 'admin'],
          },
        },
      },
      {
        path: 'requests',
        loadChildren: './views/requests/requests.module#RequestsModule',
        data: { title: 'Requests', breadcrumb: 'REQUESTS' },
      },
      {
        path: 'inventories',
        loadChildren:
          './views/inventories/inventories.module#InventoriesModule',
        data: {
          title: 'Inventories',
          breadcrumb: 'INVENTORY',
        },
      },
      {
        path: 'suppliers',
        loadChildren: './views/dealers/dealers.module#DealersModule',
        data: {
          title: 'Suppliers',
          breadcrumb: 'SUPPLIERS',
        },
      },
      {
        path: 'mdealers',
        loadChildren: './views/mdealers/mdealers.module#MDealersModule',
        data: {
          title: 'mPortal Dealers',
          breadcrumb: 'MPORTALDEALERS',
        },
      },
      {
        path: 'vendors',
        loadChildren: './views/vendors/vendors.module#VendorsModule',
        data: {
          title: 'Vendors',
          breadcrumb: 'VENDORS',
        },
      },
      {
        path: 'quotes',
        loadChildren: './views/quotes/quotes.module#QuotesModule',
        data: {
          title: 'Quotes',
          breadcrumb: 'QUOTES',
        },
      },
      {
        path: 'wholesalequote',
        loadChildren: './views/wholesale-quote/wholesale-quote.module#WholesaleQuoteModule',
        data: {
          title: 'WholesaleQuote',
          breadcrumb: 'WHOLESALE QUOTE',
        },
      },
      {
        path: 'purchaseorder',
        loadChildren: './views/purchase-order/purchase-order.module#PurchaseOrderModule',
        data: {
          title: 'Purchase Order',
          breadcrumb: 'PURCHASE ORDER',
        },
      },
      {
        path: 'carsdirect',
        loadChildren: './views/cars-direct/cars-direct.module#CarsDirectModule',
        data: {
          title: 'CB2',
          breadcrumb: 'CARSDIRECT',
        },
      },
      {
        path: 'cmsusers',
        loadChildren: './views/cmsusers/cmsusers.module#CmsUsersModule',
        canActivate: [NgxPermissionsGuard],
        data: {
          title: 'CmsUsers',
          breadcrumb: 'CMSUSERS',
          permissions: {
            only: [
              'manage_cms',
              'manage_cms_local',
              'manage_cms_sales',
              'manage_cms_sales_local',
            ],
          },
        },
      },
      {
        path: 'profile',
        loadChildren: './views/profile/profile.module#ProfileModule',
        data: { title: 'Profile', breadcrumb: 'PROFILE' },
      },
      {
        path: 'blocklist',
        loadChildren: './views/block-list/block-list.module#BlockListModule',
        data: { title: 'blocklist', breadcrumb: 'BLOCKLIST' },
      },
      {
        path: 'reports',
        loadChildren: './views/reports/reports.module#ReportsModule',
        data: {
          title: 'Reports',
          breadcrumb: 'REPORTS',
        },
      },
      {
        path: 'workflow',
        loadChildren: './views/workflow/workflow.module#WorkflowModule',
        data: { title: 'Workflow', breadcrumb: 'WORKFLOW' },
      },
      {
        path: 'clientfiles',
        loadChildren: './views/client-files/client-files.module#ClientFilesModule',
        data: {
          title: 'Client Files',
          breadcrumb: 'CLIENT FILES',
        },
      },
    ],
  },
  {
    path: 'prints',
    component: PrintLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: './views/prints/prints.module#PrintsModule',
        data: { title: '' },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'sessions/404',
  },
];
