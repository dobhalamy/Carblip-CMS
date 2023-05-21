import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { WorkflowService } from 'app/shared/services/apis/workflow.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';

@Component({
  selector: 'app-workflow-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class WorkflowTableComponent implements OnInit {
  columnHeaders: string[] = [
    'name',
    'type',
    'created_at',
    'updated_at',
    'actions'
  ];
  public RequestParam: any = {
    order_by: 'created_at',
    order_dir: 'desc',
    page: 0,
    per_page: 5,
  };

  pageNumber = 1;
  limit = 5;
  data: any;
  totalRecords: any;

  constructor(
    private service$: WorkflowService,
    private loader$: AppLoaderService,
    private _cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.getSMSList();
  }

  onLogPaginateChange(event: any) {
    this.pageNumber = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.getPaginationData();
  }

  getPaginationData() {
    this.loader$.open();
    this.RequestParam.page = this.pageNumber;
    this.RequestParam.per_page = this.limit;
    this.getSMSList();
  }

  getSMSList(){
    this.service$.getWorkflowList(this.RequestParam).subscribe((res: any) => {
      if(res){
        this.data = res.data;
        this.totalRecords = res.data.length;
        this._cdr.detectChanges();
      }
    });

  }
  

}
