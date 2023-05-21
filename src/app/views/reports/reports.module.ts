import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsComponent } from './reports.component';
import { RegisteredUsersComponent } from './registeredUsers/registered-users.component';
import { RequestsComponent } from './requests/requests.component';
import { CarQuotesComponent } from './carquotes/car-quotes.component';
import { WholesalequotesComponent } from './wholesalequotes/wholesalequotes.component';
import { PurchaseordersComponent } from './purchaseorders/purchaseorders.component';

import { RouterModule } from '@angular/router';
import { ReportsRoutes } from './reports.routing';
import { SharedMaterialModule } from 'app/shared/shared-material.module';
import { SharedModule } from 'app/shared/shared.module';
import { DatePipe } from '@angular/common';
import { DateFilterComponent } from './date-filter/date-filter.component';
import { QuoteRevenueComponent } from './quote-revenue/quote-revenue.component';
import { WholesalequotesRevenueComponent } from './wholesalequotes-revenue/wholesalequotes-revenue.component';
import { ChartsModule } from 'ng2-charts';


@NgModule({
  declarations: [
    ReportsComponent,
    RegisteredUsersComponent, 
    RequestsComponent, 
    CarQuotesComponent, 
    WholesalequotesComponent, 
    PurchaseordersComponent, DateFilterComponent, QuoteRevenueComponent, WholesalequotesRevenueComponent
  ],

  imports: [
    CommonModule,
    ChartsModule,
    SharedMaterialModule,
    SharedModule,
    RouterModule.forChild(ReportsRoutes)
  ],
  providers: [ DatePipe ]
})
export class ReportsModule { }
