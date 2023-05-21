import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MatSnackBar } from '@angular/material';
import { MailboxModalComponent } from '../mailbox-modal/mailbox-modal.component';
import { UserService } from 'app/shared/services/apis/users.service';
import { MailboxdetailModalComponent } from '../mailboxdetail-modal/mailboxdetail-modal.component';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-mailbox-table',
  templateUrl: './mailbox-table.component.html',
  styleUrls: ['./mailbox-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],

})
export class MailboxTableComponent implements OnInit, OnDestroy {

  columnsToDisplay: string[] = ['srNo', 'subject', 'msg', 'type', 'created_at'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  @Input() userInfo: any ;
 
  public sortKey:string;
  public sortDirection:string;

  public RequestParam: any = {
		order_by: 'created_at',
		order_dir: 'desc',
		page: 1,
		per_page: 10,
	};
  emails: any;
  offset: number = 1;
  totalRecords: number

  pageNumber = 1;
  limit = 5;
  intervalId: any;
  tableRefresh = true;
  sider: string = '0px';
  isOpenDrawer: boolean = false;
  mailId: number = 0;
  sendTo: string = '';
  userdetails:any ;
  
  constructor(
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog:MatDialog,
    private service$: UserService,
    private snack$: MatSnackBar,
    private loader$: AppLoaderService,
    private _cdr: ChangeDetectorRef

  ) {
    // this.sortKey = localStorage.getItem("cf_module_order_by");
    // this.sortDirection=localStorage.getItem("cf_module_order_dir");
  }
  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  ngOnInit() {
    this.getMailList();
    this.loadMailsFromMessageBoxes();
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
      this.refreshMailList();
    }

  sortData(event) {
    
  }

  refreshTable() {
    this.changeDetectorRefs.detectChanges();
  }
  

  composeMail(){
    // const registerUserDetails  = this.userInfo;
    const title = 'Compose Email';

    const dialogRef: MatDialogRef<any> = this.dialog.open(
      MailboxModalComponent,
      {
        width: '754px',
        disableClose: false,
        data: { title: title, userdetails: this.userInfo },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        // If user press cancel
        return;
      } else {
        setTimeout(()=> {
          // console.log('called table on send message');
          this.refreshMailList();
          return;
        },6000)
      }
    });
  }

  refreshMail(){
    this.refreshMailList();
  }

  refreshMailList(){
    this.service$.refreshMailList(this.RequestParam,this.userInfo.email_address).subscribe((res: any) => {
      if(res.data.length > 0) {
        this.emails = res.data;
        this.totalRecords = res.meta.total;
        this.loader$.close();
        this._cdr.detectChanges();
      }else{
        this.emails = [];
        this.loader$.close();
      }
    })
  }

  getMailList(){
    this.service$.getMailList(this.RequestParam,this.userInfo.email_address).subscribe((res: any) => {
      if(res.data.length > 0) {
        this.emails = res.data;
        this.totalRecords = res.meta.total;
        this.loader$.close();
        this._cdr.detectChanges();
      }else{
        this.emails = [];
        this.loader$.close();
      }
    })
  }

  showinboxmsg(item:any) {
    this.loader$.open();
    if(item.status == 0) {
      this.service$.changeMsgstatus(item.id).subscribe(res=>{
      })
    }

    this.service$.getMessageDetails(item.id).subscribe(res=> {
      if(res.error) {
        this.snack$.open('Woops!  Something went wrong.  Please try again.', 'OK', {
          duration: 3000,
        });
      } else {
        this.loader$.close();
        const title = 'Show Message';
        const dialogRef: MatDialogRef<any> = this.dialog.open(
          MailboxdetailModalComponent,
          {
            width: '720px',
            disableClose: false,
            data: { title: title, payload: res.data },
          }
        );

        dialogRef.afterClosed().subscribe(res => {
          if (!res) {
            // If user press cancel
            return;
          }
        });
      }
    })

    
   
  }

  loadMailsFromMessageBoxes() {
    // this.intervalId =setInterval(()=>{
      this.refreshMailList();
      console.log('called');
    // }, 40000)
  }

  formatMessageText(message: string) {
    if(message !== undefined) {
      message = new String(message).replace(/(<([^>]+)>)/gi, ""); 
      return message.substring(0,15);
    } else {
      return "";
    }
  }

  //close the side dailouge
  closeSider($event: string) {
    this.isOpenDrawer = false;
  }

  //close the side dailouge
  openSider(id: number) {
    this.isOpenDrawer = !this.isOpenDrawer;
    if(this.isOpenDrawer) {
      this.mailId = id;
      this.sendTo = this.userInfo.email_address;
    }
  }
}
