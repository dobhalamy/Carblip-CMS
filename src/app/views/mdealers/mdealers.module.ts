import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { MDealerService } from 'app/shared/services/apis/mdealer.service';
import { SharedMaterialModule } from 'app/shared/shared-material.module';
import { UserEffects } from 'app/store/users/users.effects';
import { store } from 'app/store/users/users.index';
import { ChartsModule } from 'ng2-charts';
import { FileUploadModule } from 'ng2-file-upload/ng2-file-upload';
import { SharedModule } from './../../shared/shared.module';
import { MDealersDetailComponent } from './detail/detail.component';
import { MDealersComponent } from './mdealers.component';
import { MDealersRoutes } from './mdealers.routing';
import { MDealersTableComponent } from './table/table.component';

@NgModule({
  imports: [
    CommonModule,
    ChartsModule,
    FileUploadModule,
    SharedMaterialModule,
    SharedModule,
    RouterModule.forChild(MDealersRoutes),

    StoreModule.forFeature(store.name, store.usersReducer),
    EffectsModule.forFeature([UserEffects]),
  ],
  declarations: [
    MDealersComponent,
    MDealersTableComponent,
    MDealersDetailComponent,
  ],
  providers: [MDealerService],
  entryComponents: [],
})
export class MDealersModule {}
