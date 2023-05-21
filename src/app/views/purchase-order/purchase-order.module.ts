import { NgModule } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { PurchaseOrderComponent } from './purchase-order.component';
import { SharedMaterialModule } from 'app/shared/shared-material.module';
import { SharedModule } from 'app/shared/shared.module';
import { RouterModule } from '@angular/router';
import { PurchaseOrderRoutes } from './purchase-order.routing';
import { PurchaseOrderTableComponent } from './table/table.component';
import { PurchaseOrderService } from 'app/shared/services/apis/purchase-order.service';
import { PurchaseOrderEditComponent } from './edit/edit.component';

@NgModule({
  declarations: [
    PurchaseOrderComponent,
    PurchaseOrderTableComponent,
    PurchaseOrderEditComponent,
    ],
  imports: [
    CommonModule,
    SharedMaterialModule,
    SharedModule,
    RouterModule.forChild(PurchaseOrderRoutes),
  ],
  providers:[PurchaseOrderService,TitleCasePipe,DatePipe],
  entryComponents:[]
})
export class PurchaseOrderModule { }
