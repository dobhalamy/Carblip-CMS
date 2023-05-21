import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BlockListRoutingModule } from './block-list-routing.module';
import { BlockListComponent } from './block-list.component';
import { SharedMaterialModule } from 'app/shared/shared-material.module';
import { SharedModule } from 'app/shared/shared.module';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { RequestEffects } from 'app/store/requests/requests.effects';
import { store } from 'app/store/requests/requests.index';
import { BlocklistTableComponent } from './table/table.component';

@NgModule({
  declarations: [
    BlockListComponent,
    BlocklistTableComponent
  ],
  imports: [
    CommonModule,
    BlockListRoutingModule,
    SharedMaterialModule,
    SharedModule,
    StoreModule.forFeature(store.name, store.requestsReducer),
    EffectsModule.forFeature([RequestEffects]),
  ]
})
export class BlockListModule { }
