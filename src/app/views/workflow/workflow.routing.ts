import { Routes } from '@angular/router';
import { CreateComponent } from './create/create.component';
import { WorkflowComponent } from './workflow.component';



export const WorkflowRoutes: Routes = [
  {
    path: '',
    component: WorkflowComponent,
  },
  {
    path: 'create',
    component: CreateComponent,
    data: { title: 'Create', breadcrumb: 'CREATE' },
  },
  {
    path: ':id',
    component: CreateComponent,
    data: { title: 'Edit', breadcrumb: 'EDIT' },
  },
  
];
