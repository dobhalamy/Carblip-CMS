import { Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-delay-action',
  templateUrl: './delay-action.component.html',
  styleUrls: ['./delay-action.component.scss']
})
export class DelayActionComponent implements OnInit {
  @Input('data') data: any;
  @Input('id') id: any;
  output = new Subject<any>();
  @ViewChild('delay_action', { read: ViewContainerRef }) delay_action: ViewContainerRef;
  constructor() { }

  ngOnInit() {
    
  }
  action($branchData){
    let outputobj = {
      value:'add_action',
      data:null,
      container: this.delay_action,
      action_id:this.id,
      sequence_id:$branchData.seq_id
    }
    this.output.next(outputobj)
  }

  deleteaction($branchData){
    let outputobj = {
      value:'delete_action',
      data:null,
      container: this.delay_action,
      action_id:this.id,
      sequence_id:$branchData.seq_id
    }
    this.output.next(outputobj)

  }



}
