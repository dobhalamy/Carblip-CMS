import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ExportService } from 'app/shared/services/apis/export.service';
import { VBrandService } from 'app/shared/services/apis/vbrand.service';
import { VModelService } from 'app/shared/services/apis/vmodel.service';
import { SharedMaterialModule } from 'app/shared/shared-material.module';
import { UserEffects } from 'app/store/users/users.effects';
import { store } from 'app/store/users/users.index';
import { ChartsModule } from 'ng2-charts';
import { FileUploadModule } from 'ng2-file-upload/ng2-file-upload';
import { SharedModule } from '../../shared/shared.module';
import { WholesaleQuoteEditComponent } from './edit/edit.component';
import { WholesaleQuoteComponent } from './wholesale-quote.component';
import { WholesaleQuoteRoutes } from './wholesale-quote.routing';
import { WholesaleQuoteTableComponent } from './table/table.component';

@NgModule({
  imports: [
    CommonModule,
    ChartsModule,
    FileUploadModule,
    SharedMaterialModule,
    SharedModule,
    RouterModule.forChild(WholesaleQuoteRoutes),

    StoreModule.forFeature(store.name, store.usersReducer),
    EffectsModule.forFeature([UserEffects]),
  ],
  declarations: [WholesaleQuoteComponent, WholesaleQuoteTableComponent, WholesaleQuoteEditComponent],
  providers: [ExportService, VBrandService, VModelService,DatePipe,TitleCasePipe],
  entryComponents: [],
})
export class WholesaleQuoteModule {}
