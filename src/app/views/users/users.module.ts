import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { DealStageService } from 'app/shared/services/apis/dealstage.service';
import { UserService } from 'app/shared/services/apis/users.service';
import { VBrandService } from 'app/shared/services/apis/vbrand.service';
import { VehicleService } from 'app/shared/services/apis/vehicle.service';
import { VModelService } from 'app/shared/services/apis/vmodel.service';
import { SharedMaterialModule } from 'app/shared/shared-material.module';
import { UserEffects } from 'app/store/users/users.effects';
import { store } from 'app/store/users/users.index';
import { ChartsModule } from 'ng2-charts';
import { FileUploadModule } from 'ng2-file-upload/ng2-file-upload';
import { SharedModule } from './../../shared/shared.module';
import { UsersDetailComponent } from './detail/detail.component';
import { UsersRequestModalComponent } from './detail/request-modal/request-modal.component';
import { RequestTableComponent } from './detail/request-table/request-table.component';
import { WholesaleTableComponent } from './detail/wholesale-table/wholesale-table';
import { UsersEditModalComponent } from './table/edit-modal/edit-modal.component';
import { UsersTableComponent } from './table/table.component';
import { UsersComponent } from './users.component';
import { UsersRoutes } from './users.routing';
import { MailboxTableComponent } from './detail/mailbox-table/mailbox-table.component';
import { MailboxModalComponent } from './detail/mailbox-modal/mailbox-modal.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { MailboxdetailModalComponent } from './detail/mailboxdetail-modal/mailboxdetail-modal.component';
import { MailThreadComponent } from './detail/mail-thread/mail-thread.component';
import { UsersChatComponent } from './detail/user-sms/users-chat.component';
import { UserTwiliocallComponent } from './detail/user-twiliocall/user-twiliocall.component';
import { CallModalComponent } from './detail/user-twiliocall/call-modal/call-modal.component';
@NgModule({
  imports: [
    CommonModule,
    ChartsModule,
    FileUploadModule,
    SharedMaterialModule,
    SharedModule,
    CKEditorModule,
    RouterModule.forChild(UsersRoutes),
    StoreModule.forFeature(store.name, store.usersReducer),
    EffectsModule.forFeature([UserEffects]),
  ],
  declarations: [
    UsersComponent,
    UsersTableComponent,
    UsersEditModalComponent,
    
    UsersDetailComponent,
    UsersRequestModalComponent,
    RequestTableComponent,
    WholesaleTableComponent,
    MailboxTableComponent,
    MailboxModalComponent,
    MailboxdetailModalComponent,
    MailThreadComponent,
    UsersChatComponent,
    UserTwiliocallComponent,
    CallModalComponent,
  ],
  providers: [
    UserService,
    VBrandService,
    VModelService,
    VehicleService,
    DealStageService,
  ],
  entryComponents: [UsersEditModalComponent, UsersRequestModalComponent,MailboxModalComponent,MailboxdetailModalComponent,CallModalComponent],
})

export class UsersModule {}
