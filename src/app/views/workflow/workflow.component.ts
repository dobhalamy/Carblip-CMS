import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { WorkflowService } from 'app/shared/services/apis/workflow.service';

@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss']
})
export class WorkflowComponent implements OnInit {

  type: any;

  constructor(
    private dialog: MatDialog,
    private service$: WorkflowService,
  ) { }

  ngOnInit() {
  }

  



}
