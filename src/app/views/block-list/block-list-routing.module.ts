import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BlockListComponent } from './block-list.component';

const routes: Routes = [
  {
    path: '**',
    component: BlockListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlockListRoutingModule { }
