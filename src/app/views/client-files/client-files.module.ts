import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientFilesComponent } from './client-files.component';
import { RouterModule } from '@angular/router';
import { ClientFilesRoutes } from './client-files.routing';
import { TableComponent } from './table/table.component';
import { SharedMaterialModule } from 'app/shared/shared-material.module';
import { SharedModule } from 'app/shared/shared.module';
import { store } from 'app/store/client-files/client-files.index';
import { ClientFilesEffects } from 'app/store/client-files/client-files.effects';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

@NgModule({
  declarations: [
    ClientFilesComponent, 
    TableComponent
  ],
  imports: [
    CommonModule,
    SharedMaterialModule,
    SharedModule,
    RouterModule.forChild(ClientFilesRoutes),
    StoreModule.forFeature(store.name, store.cmsUsersReducer),
    EffectsModule.forFeature([ClientFilesEffects])
  ],
  entryComponents: []
})
export class ClientFilesModule { }
