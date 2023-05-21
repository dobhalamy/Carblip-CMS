import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog,MatDialogRef,MatSnackBar } from '@angular/material';
import { UserService } from 'app/shared/services/apis/users.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';

// declare const Twilio: any;
@Component({
  selector: 'app-users-chat',
  templateUrl: './users-chat.component.html',
  styleUrls: ['./users-chat.component.scss']
})
export class UsersChatComponent implements OnInit {
  public smsForm:FormGroup;
 
  SmsData: any; 

  @Input() userInfo: any ;
  public RequestParam: any = {
		order_by: 'created_at',
		order_dir: 'desc',
		page: 1,
		per_page: 10,
	};
  // connection: any;
  connect: any;
  constructor(
    private fb:FormBuilder,
    private service$: UserService,
    private loader$: AppLoaderService,
    private snack$: MatSnackBar,              
    private _cdr: ChangeDetectorRef,
    private dialog:MatDialog,
  ) { }

  ngOnInit() {
    this.initform();
    this.getSMSList();
    // this.service$.gettwiliotoken().subscribe((res: any) => {
    //   if(res.data) {
    //     Twilio.Device.setup(res.data);
    //   }
    // });
  }
  refresh(){
    this.getSMSList();
  }

  initform(){
    this.smsForm = this.fb.group({
      sent_to: this.userInfo.phone,
      message:['',Validators.required],
    })
  }

  getSMSList(){
    this.service$.getSMSList(this.RequestParam,this.userInfo.phone).subscribe((res: any) => {
      if(res.data.length > 0) {
        this.SmsData = res.data;
        this.loader$.close();
        this._cdr.detectChanges();
      }else{
        this.SmsData = [];
        this.loader$.close();
      }
    })
  }

  sendSms(){
    if(this.smsForm.valid) {
      this.loader$.open();
      this.service$.sendSMS(this.smsForm.value).subscribe((res: any) => {
        if(res) {
            this.loader$.close();
            this.snack$.open(res.data, 'OK', {
              duration: 3000,
            });
              this.getSMSList();
              this.smsForm.patchValue( {'message':null} );
        }
      })
    }else{
      this.snack$.open("Please check all the fields")
    }

  }


  // connectCall(){
  //   const title = 'Connect Call';
  //   const dialogRef: MatDialogRef<any> = this.dialog.open(
  //     UsersCallComponent,
  //     {
  //       width: '500px',
  //       disableClose: true,
  //       data: { title: title},
  //     }
  //   );
  //   dialogRef.afterClosed().subscribe(res => {
  //     if (res) {
  //       // If user press cancel
  //       return;
  //     } 
  //   });
  // }




  // twilioCall(){
  //   // const callRequestParam = {
  //   //   to_number: '+919759922112',
  //   //   from_number: '+15304571901',
  //   // };
  //   if(this.connection==null){
  //     console.log('connection is null. Initiating the call');
  //     var params = { "To": '+919759922112', "callerId":"+15304571901","IsRecord":true};
  //     this.connection = Twilio.Device.connect(params);
  //     this.connect = Twilio.Device.on('connect', function(connection) {
  //       connection.accept();
  //       console.log(connection.accept());
  //       // do awesome ui stuff here
  //       // $('#call-status').text("you're on a call!");
  //     });
  //     // device.on 
  //     // console.log('connection',this.connection);
  //   }else {
  //     this.connection = null;
  //     Twilio.Device.disconnectAll();
  //   }

  // }

  // call(){
  //   if(this.smsForm.valid) {
  //     this.loader$.open();
     
  //   }else{
  //     this.snack$.open("Please check all the fields")
  //   }

  // }

}
