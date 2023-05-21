import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { CmsUserService } from 'app/shared/services/apis/cmsusers.service';
import { SharedMaterialModule } from 'app/shared/shared-material.module';
import { CmsUserEffects } from 'app/store/cmsusers/cmsusers.effects';
import { store } from 'app/store/cmsusers/cmsusers.index';
import { ChartsModule } from 'ng2-charts';
import { FileUploadModule } from 'ng2-file-upload/ng2-file-upload';
import { SharedModule } from './../../shared/shared.module';
import { CmsUsersComponent } from './cmsusers.component';
import { CmsUsersRoutes } from './cmsusers.routing';
import { CmsUsersDetailComponent } from './detail/detail.component';
import { CmsUsersEditModalComponent } from './table/edit-modal/edit-modal.component';
import { CmsUsersTableComponent } from './table/table.component';

@NgModule({
  imports: [
    CommonModule,
    ChartsModule,
    FileUploadModule,
    SharedMaterialModule,
    SharedModule,
    RouterModule.forChild(CmsUsersRoutes),

    StoreModule.forFeature(store.name, store.cmsUsersReducer),
    EffectsModule.forFeature([CmsUserEffects]),
  ],
  declarations: [
    CmsUsersComponent,
    CmsUsersTableComponent,
    CmsUsersEditModalComponent,
    CmsUsersDetailComponent,
  ],
  providers: [CmsUserService],
  entryComponents: [CmsUsersEditModalComponent],
})
export class CmsUsersModule {}
