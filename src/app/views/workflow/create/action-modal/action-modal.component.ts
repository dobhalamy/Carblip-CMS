import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ACTION, CONDITION, DELAY, EMAILLIST, PROPERTY, TYPE } from 'app/shared/enums/enums';
import { WorkflowService } from 'app/shared/services/apis/workflow.service';

@Component({
  selector: 'app-action-modal',
  templateUrl: './action-modal.component.html',
  styleUrls: ['./action-modal.component.scss']
})
export class ActionModalComponent implements OnInit {
  public itemForm: FormGroup;
  actionList: Array<{}> = [
    { id: 1, value: 'Delay' },
    { id: 2, value: 'Branch' },
    { id: 3, value: 'Send Email' },
    { id: 4, value: 'Send SMS' }
  ];

  delayList: Array<{}> = [
    { delay_id: 1, value: 'Delay for a set amount of time' },
    { delay_id: 2, value: 'Delay until a day or time' },
  ];

  conditionList: Array<{}> = [
    { id: 1, value: 'Equals' },
    { id: 2, value: 'Does not equal' },
    { id: 3, value: 'known' },
    { id: 4, value: 'unknown' },
  ];

  actionValue: number;
  delayValue: number;
  typeList: any;
  propertyList: any;
  proertyValue: any;
  emailTemlateList: any;
  conditionVal: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private service$: WorkflowService,
    public dialogRef: MatDialogRef<ActionModalComponent>,
  ) {
    this.initform();
  }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close(null);
  }

  initform() {
    this.itemForm = this.fb.group({
      actioname: ['', Validators.required],
      delayaction: ['', Validators.required],
      days: ['',Validators.pattern("^[0-9]*$")],
      hours: ['',Validators.pattern("^[0-9]*$")],
      minutes: ['',Validators.pattern("^[0-9]*$")],
      seconds: ['',Validators.pattern("^[0-9]*$")],

      date: null,
      timeofday: null,

      type: null,
      property: null,
      condition: null,
      condition_value: null,
      emailtemp: null,
      branch_name: null
    })
  }

  onActionchange($event: number) {
    this.actionValue = $event
    if ($event == 2) {
      this.service$.gettype().subscribe((res: any) => {
        if (res) {
          this.typeList = res.data;
        }
      });

      // console.log(ACTION[1]);
      // console.log(ACTION[2]);
    }
    else if ($event == 3) {
      this.service$.getemailTemplate().subscribe((res: any) => {
        if (res) {
          this.emailTemlateList = res.data;
        }
      });
    }
  }

  onDelaychange($event: number) {
    this.delayValue = $event;
  }

  onTypechange($event: number) {
    this.service$.getproperty($event).subscribe((res: any) => {
      if (res) {
        this.propertyList = res.data;
      }
    })
  }

  onPropertychange($event: any) {
    if ($event != '') {
      this.proertyValue = $event;
    }
  }

  onConditionchange($event: any) {
    this.conditionVal = $event;
  }

  actionSave() {
    let actionObject = {};

  //  if(this.itemForm.valid){

    switch (ACTION[this.itemForm.value.actioname]) {
      case 'Delay':
        actionObject = {
          actionName: ACTION[this.itemForm.value.actioname],
          action: {
            id: this.itemForm.value.actioname,
            value: ACTION[this.itemForm.value.actioname],
          },
          delay: {
            id: this.itemForm.value.delayaction,
            value: DELAY[this.itemForm.value.delayaction],
          },
          days: this.itemForm.value.days,
          hours: this.itemForm.value.hours,
          minutes: this.itemForm.value.minutes,
          seconds: this.itemForm.value.seconds,
          date: this.itemForm.value.date,
          timeofday: this.itemForm.value.timeofday,
          parentContainer: null,
          event_master_id:102
        }
        break;

      case 'Branch':
        actionObject = {
          actionName: ACTION[this.itemForm.value.actioname],
          action: {
            id: this.itemForm.value.actioname,
            value: ACTION[this.itemForm.value.actioname],
          },
          type: {
            id: this.itemForm.value.type,
            value: TYPE[this.itemForm.value.type],
          },
          property: { 
            id: this.itemForm.value.property,
            value: PROPERTY[this.itemForm.value.property],
          },
          condition: {
            id: this.itemForm.value.condition,
            value: CONDITION[this.itemForm.value.condition],
          },
          conditionvalue: this.itemForm.value.condition_value,
          ifbranchname: this.itemForm.value.branch_name,
          ifbranchdata:[],
          thenbranchname: null,
          thenbranchdata:[],
          parentContainer: null,
          event_master_id:103

        }
        break;

      case 'Send Email':
        actionObject = {
          actionName: ACTION[this.itemForm.value.actioname],
          action: {
            id: this.itemForm.value.actioname,
            value: ACTION[this.itemForm.value.actioname],
          },
          email: {
            id: this.itemForm.value.emailtemp,
            value: EMAILLIST[this.itemForm.value.emailtemp],
          },
          parentContainer: null,
          event_master_id:104

        }
        break;

      // case 'Send SMS':
      // break;
    // }
  }

    this.dialogRef.close(actionObject);
     console.log('actionarray', actionObject);
  }


}
