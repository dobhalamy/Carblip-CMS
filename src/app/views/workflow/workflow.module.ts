import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedMaterialModule } from 'app/shared/shared-material.module';
import { SharedModule } from 'app/shared/shared.module';
import { WorkflowRoutes } from './workflow.routing';
import { RouterModule } from '@angular/router';
import { WorkflowComponent } from './workflow.component';
import { WorkflowTableComponent } from './table/table.component';
import { WorkflowService } from 'app/shared/services/apis/workflow.service';
import { CreateComponent } from './create/create.component';
import { ActionModalComponent } from './create/action-modal/action-modal.component';
import { TriggerModalComponent } from './create/trigger-modal/trigger-modal.component';
import { DelayActionComponent } from './create/action-master/delay-action/delay-action.component';
import { BranchActionComponent } from './create/action-master/branch-action/branch-action.component';
import { EmailActionComponent } from './create/action-master/email-action/email-action.component';
import { SmsActionComponent } from './create/action-master/sms-action/sms-action.component';
import { TriggerMasterComponent } from './create/trigger-master/trigger-master.component';

@NgModule({
  declarations: [WorkflowComponent, WorkflowTableComponent, CreateComponent, ActionModalComponent, TriggerModalComponent, DelayActionComponent, BranchActionComponent, EmailActionComponent, SmsActionComponent, TriggerMasterComponent],
  imports: [
    CommonModule,
    SharedMaterialModule,
    SharedModule,
    RouterModule.forChild(WorkflowRoutes),
  ],
  providers: [
    WorkflowService
  ],
  entryComponents: [ActionModalComponent, TriggerModalComponent, DelayActionComponent, EmailActionComponent, BranchActionComponent,SmsActionComponent,TriggerMasterComponent],
})
export class WorkflowModule { }
