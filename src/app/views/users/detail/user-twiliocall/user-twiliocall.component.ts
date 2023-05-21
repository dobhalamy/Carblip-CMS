import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { UserService } from 'app/shared/services/apis/users.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { CallModalComponent } from './call-modal/call-modal.component';
import { Subject } from 'rxjs';
import { promise } from 'protractor';
declare const Twilio: any;

@Component({
  selector: 'app-user-twiliocall',
  templateUrl: './user-twiliocall.component.html',
  styleUrls: ['./user-twiliocall.component.scss']
})
export class UserTwiliocallComponent implements OnInit {

  private subject: Subject<any> = new Subject<any>();
  @Input() userInfo: any;
  columnHeaders: string[] = [
    // 'srNo',
    // 'from',
    // 'to',
    'direction',
    'status',
    'duration',
    'call_record',
    'created_at'
  ];

  public RequestParam: any = {
    order_by: 'created_at',
    order_dir: 'desc',
    page: 0,
    per_page: 5,
  };


  pageNumber = 1;
  limit = 5;
  SmsData: any = [];
  totalRecords: any;
  intervalId: any;
  device: any;
  incomingconn: any;
  twilioParam: any = {};
  recordingUrl: any = '';
  playRecording: any = '';
  // callStatus: string;
  constructor(
    private dialog: MatDialog,
    private service$: UserService,
    private loader$: AppLoaderService,
    private _cdr: ChangeDetectorRef

  ) {

  }

  ngOnInit() {
    this.twilioParam = { To: this.userInfo.phone, callerId: "+15304571901", IsRecord: true };

    // this.getSMSList();
    this.service$.getTwilioToken().subscribe((res: any) => {
      Twilio.Device.setup(res.data, { 'debug': true, 'enableRingingState': true });
      this.device = Twilio.Device.ready((device) => {
      });
    });

    Twilio.Device.incoming((conn) => {
      this.incomingconn = conn;
      const dialogRef: MatDialogRef<any> = this.dialog.open(
        CallModalComponent,
        {
          width: '500px',
          disableClose: true,
          data: { title: 'Incoming Call', callerId: conn.parameters.From },
        }
      );
      // this.callStatus = 'ringing';
    });

    this.service$.acceptCallStatus.subscribe(res => {
      // 1 for Accept and 2 for Reject
      if (res == 1) {
        this.incomingconn.accept();
      } else if (res == 2) {
        this.incomingconn.reject();
      } else if (res == 3) {
        this.incomingconn.disconnect();
      }
      this.getSMSList();
    })
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

  getSMSList() {
    Promise.all([
      this.service$.getOutGoingCallList(this.RequestParam, this.twilioParam.To),
      this.service$.getIncomingCallList(this.RequestParam, this.twilioParam.To)
    ]).then(res => {
      // console.log(res);
      var result = res[0].data.concat(res[1].data);
      result = result.sort((a,b)=>Date.parse(b.start_time)-Date.parse(a.start_time));
      this.SmsData = result;
      this.totalRecords = result.length;
      this.loader$.close();
      this._cdr.detectChanges();
    })
  }

  refresh() {
    this.getSMSList();
  }

  call() {
    this.device.connect(this.twilioParam);
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      CallModalComponent,
      {
        width: '500px',
        disableClose: true,
        data: { title: 'Outgoing Call', callerId: this.twilioParam.To },
      }
    );
  }


  playrecording(data:any){
    
    this.service$.getcallRecordUrl(data).subscribe((res: any) => {
      if(res.media_url) {
        this.playRecording = data;
        this.recordingUrl = res.media_url;
        this._cdr.detectChanges();
      }

    });
  }


}
