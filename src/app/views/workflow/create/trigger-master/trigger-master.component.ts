import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-trigger-master',
  templateUrl: './trigger-master.component.html',
  styleUrls: ['./trigger-master.component.scss']
})
export class TriggerMasterComponent implements OnInit,OnChanges {

  @Input('triggers') triggers: any;
  output = new Subject<any>();
  constructor() { }
  ngOnChanges(changes: SimpleChanges): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit() {
  }

  action(){
    let outputobj = {
      value:'add_action',
      data:null
    }
    this.output.next(outputobj)
  }
  
  onAddcondition($condition,triggerType,index){
    let outputobj = {
      value:'add_contidion',
      data:{condtion:$condition,triggertype:triggerType,arrayindex:index},
    }
    this.output.next(outputobj)
  }

}
