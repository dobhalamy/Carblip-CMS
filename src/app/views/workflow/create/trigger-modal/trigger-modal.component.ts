import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { WorkflowService } from 'app/shared/services/apis/workflow.service';
import { ACTION, CONDITION, EMAILLIST, PROPERTY, TYPE } from 'app/shared/enums/enums';

@Component({
  selector: 'app-trigger-modal',
  templateUrl: './trigger-modal.component.html',
  styleUrls: ['./trigger-modal.component.scss']
})
export class TriggerModalComponent implements OnInit {
  public triggerForm: FormGroup;
  type: any;
  propertyList: any;
  proertyValue: any;

  conditionList: Array<{}> = [
    {id: 1, value: 'Equals'},
    {id: 2, value: 'Does not equal'},
    {id: 3, value: 'known'},
    {id: 4, value: 'unknown'},
  ];
  conditionValue: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb:FormBuilder,
    private service$: WorkflowService,
    public dialogRef: MatDialogRef<TriggerModalComponent>,
  ) {
    this.initform();
   }

  ngOnInit() {
    this.gettype();
  }

  initform() {
    this.triggerForm = this.fb.group({
      type: ['', Validators.required],
      property: ['', Validators.required],
      condition: ['', Validators.required],
      conditionvalue: ['', Validators.required],
    })

    if(this.data.conditionval != null) {
      this.triggerForm.patchValue({type: this.data.conditionval})
      this.onTypechange(this.data.conditionval);
    }
  }

  gettype() {
    this.service$.gettype().subscribe((res: any) => {
      if (res) {
        this.type = res.data;
      }
    })
  }

  onTypechange($event: any) {
    this.service$.getproperty($event).subscribe((res: any) => {
      if (res) {
        this.propertyList = res.data;
      }
    })
  }

  onPropertychange($event:any){
    if($event != ''){
      this.proertyValue = $event;
    }
  }

  onConditionchange($event:any){
    this.conditionValue = $event;
  }

  Submit(){
    // console.log(this.triggerForm.value);
    let triggerObject = {};
    triggerObject = {
      type:{
        id:this.triggerForm.value.type,
        value:TYPE[this.triggerForm.value.type],
      },
      property:{
        id:this.triggerForm.value.property,
        value:PROPERTY[this.triggerForm.value.property],
      },
      condition:{
        id:this.triggerForm.value.condition,
        value:CONDITION[this.triggerForm.value.condition],
      },
      conditionvalue:this.triggerForm.value.conditionvalue,
      multivalue:[],
      event_master_id:101
    }

    this.dialogRef.close(triggerObject);
  }

  close() {
    this.dialogRef.close(null);
  }

}
