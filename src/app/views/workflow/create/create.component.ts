import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, ComponentFactoryResolver, ComponentRef, Inject, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { WorkflowService } from 'app/shared/services/apis/workflow.service';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BranchActionComponent } from './action-master/branch-action/branch-action.component';
import { DelayActionComponent } from './action-master/delay-action/delay-action.component';
import { EmailActionComponent } from './action-master/email-action/email-action.component';
import { ActionModalComponent } from './action-modal/action-modal.component';
import { TriggerMasterComponent } from './trigger-master/trigger-master.component';
import { TriggerModalComponent } from './trigger-modal/trigger-modal.component';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit {
  public itemForm: FormGroup;
  actions = [];
  triggers = [];
  data: any;
  private _jsonURL = 'assets/workflow_data.json';
  counter: number = 0;
  @ViewChild('container', { read: ViewContainerRef }) container: ViewContainerRef;

  obj = {
    triggers: [],
    actions: []
    // workflowname: null,
  };

  components = [];
  componentsJson = [];
  constructor(
    private fb: FormBuilder,
    private service$: WorkflowService,
    private dialog: MatDialog,
    private _cdr: ChangeDetectorRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private http: HttpClient,
    private route: ActivatedRoute,
    private confirmService$: AppConfirmService,
  ) {
    // service.addDynamicComponent()
    this.initform();
    // this.getJSON().subscribe(data => { this.generateWorkflow(data) }, error => console.log(error));
  }

  ngOnInit() {
    this.route.params.subscribe(res => {
      if (res.id) {
        this.service$.getworkflow(res.id).subscribe((result: any) => {
          if (result) {

            let workflow_data = result.data[0].workflow_payload;

            this.triggers = workflow_data.triggers;
            this.actions = workflow_data.actions;
            this.generateWorkflow(workflow_data);
          }
        });
      }
    })
  }
  initform() {
    this.itemForm = this.fb.group({
      name: null,
    })
    this.itemForm.patchValue({ name: 'Unnamed workflow' })
  }

  addDelayAction(data: any, container: ViewContainerRef) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(DelayActionComponent)
    const componentRef = container.createComponent(componentFactory);
    // Push the component so that we can keep track of which components are created

    componentRef.instance.id = this.components.length + 1;
    componentRef.instance.data = data;
    this.components.push(componentRef);
    componentRef.instance.output.subscribe((results) => {

      switch (results.value) {
        case 'add_action':
          this.action(results.container, results.action_id, results.sequence_id, 'Delay');
          break;
        case 'delete_action':
          this.deleteAction(results.container, results.action_id, results.sequence_id, 'Delay');
          break;

        default:
          break;
      }

    });
    this._cdr.detectChanges();
    return componentRef;
  }

  addBranchAction(data: any, container: any) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(BranchActionComponent)
    const componentRef = container.createComponent(componentFactory);

    // componentRef.instance.id = this.components.length + 1;
    componentRef.instance.data = data;
    this.components.push(componentRef);
    componentRef.instance.output.subscribe((results) => {
      // console.log('BranchResult', results);
      switch (results.value) {
        case 'add_action':
          this.action(results.container, results.action_id, results.sequence_id, 'Branch', results.data);
          break;

        default:
          break;
      }
    });
    this._cdr.detectChanges();
    return componentRef;
  }

  addemailAction(data: any, container: any) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(EmailActionComponent)
    const componentRef = container.createComponent(componentFactory);

    // this.components.push({data:data,parent:null});
    componentRef.instance.id = this.components.length + 1;
    componentRef.instance.data = data;
    this.components.push(componentRef);
    componentRef.instance.output.subscribe((results) => {
      switch (results.value) {
        case 'add_action':
          this.action(results.container, results.action_id, results.sequence_id, 'Send Email');
          break;

        default:
          break;
      }
    });
    this._cdr.detectChanges();
    return componentRef;
  }

  addTrigger(data: any) {
    if (data.length <= 1) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(TriggerMasterComponent)
      let componentRef = this.container.createComponent(componentFactory);

      componentRef.instance.triggers = data;
      componentRef.instance.output.subscribe((results) => {
        switch (results.value) {
          case 'add_action':
            this.action(results.container, results.action_id, results.sequence_id, 'Trigger');
            break;

          case 'add_contidion':
            this.onAddcondition(results.data.condtion, results.data.triggertype, results.data.arrayindex);
         
}

