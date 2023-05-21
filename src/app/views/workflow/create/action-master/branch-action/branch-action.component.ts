import { ChangeDetectorRef, Component, ComponentFactoryResolver, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Subject } from 'rxjs';
import { ActionModalComponent } from '../../action-modal/action-modal.component';
import { DelayActionComponent } from '../delay-action/delay-action.component';
import { EmailActionComponent } from '../email-action/email-action.component';

@Component({
  selector: 'app-branch-action',
  templateUrl: './branch-action.component.html',
  styleUrls: ['./branch-action.component.scss']
})
export class BranchActionComponent implements OnInit, OnChanges {
  @Input('data') data: any;
  @Input('id') id: any;
  output = new Subject<any>();

  @ViewChild('branch_true', { read: ViewContainerRef }) branch_true: ViewContainerRef;
  @ViewChild('branch_false', { read: ViewContainerRef }) branch_false: ViewContainerRef;
  components = [];

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private dialog: MatDialog, private _cdr: ChangeDetectorRef,) { }
  ngOnChanges(changes: SimpleChanges): void {
    // console.log(this.branchActions)
  }

  ngOnInit() {
  }

  action_true($event,$branchData) {

    let container_name;
    if ($event != null) {
      if ($event) {
        container_name = 0;
      } else {
        container_name = 1;
      }
    }

    let outputobj = {
      value: 'add_action',
      data: container_name,
      container: container_name == 0 ? this.branch_true : this.branch_false,
      action_id:this.id,
      sequence_id:$branchData.seq_id
    }
    this.output.next(outputobj)

  }

  deleteaction($branchData){
    // let container_name;

    let outputobj = {
      value: 'delete_action',
      // data: container_name,
      // container: container_name == 0 ? this.branch_true : this.branch_false,
      action_id:this.id,
      sequence_id:$branchData.seq_id
    }
    this.output.next(outputobj)

  }

}
