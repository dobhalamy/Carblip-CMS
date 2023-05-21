import { Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-email-action',
  templateUrl: './email-action.component.html',
  styleUrls: ['./email-action.component.scss']
})
export class EmailActionComponent implements OnInit {
  @Input('data') data: any;
  @Input('id') id: any;
  output = new Subject<any>();
  @ViewChild('email_action', { read: ViewContainerRef }) email_action: ViewContainerRef;
  constructor() { }

  ngOnInit() {
  }

  action($branchData){
    let outputobj = {
      value:'add_action',
      data:null,
      container: this.email_action,
      action_id:this.id,
      sequence_id:$branchData.seq_id
    }
    this.output.next(outputobj)
  }

}
