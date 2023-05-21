import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { UserService } from 'app/shared/services/apis/users.service';
declare const Twilio: any;
import Pusher from 'pusher-js';

@Component({
  selector: 'app-call-modal',
  templateUrl: './call-modal.component.html',
  styleUrls: ['./call-modal.component.scss']
})
export class CallModalComponent implements OnInit {
  intervalId: any;
  connection: any;
  callStatus: string = 'connecting';
  private pusherClient: Pusher;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<CallModalComponent>,
    private service$: UserService
  ) { }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }  
    this.service$.acceptCallStatus.next(0);  
  }
  
  ngOnInit() {
    // this.service$.gettwilioincomingtoken().subscribe((res: any) => {
    //   if (res.data) {
    //     console.log('token',res.data);
    //     Twilio.Device.setup(res.data,{'debug':true,'enableRingingState':true});
    //     Twilio.Device.ready((device) =>{
    //       let params = { "To": '+919759922112', "callerId": "+15304571901", "IsRecord": true };
    //       device.connect(params);
    //     });

    //     Twilio.Device.error((error) =>{
    //       console.log(error.message);
    //     });
    //   }
    // });
    
    this.pusherClient = new Pusher('b880e993097db14dac88', { cluster: 'ap2' });
    const channel = this.pusherClient.subscribe('AmitChannel');
    channel.bind('testEvent', (data: any) =>{
      // this is called when the event notification is received...
      console.log('dataEvent',data);
      this.callStatus = data.outgoing.call_status;
      if(this.callStatus == 'in-progress') {
        this.startTimer();
      }
    });
  }

  Cancel() {
    Twilio.Device.disconnectAll();
    this.dialogRef.close();
  }

  accept(){
    console.log('accept');
    this.service$.acceptCallStatus.next(1);
    this.callStatus = 'accepted'
    this.startTimer();
  }

  reject(){
    this.service$.acceptCallStatus.next(2);
    this.callStatus = 'rejected'
    this.dialogRef.close();
  }

  disconnect(){
    this.service$.acceptCallStatus.next(3);
    this.callStatus = 'disconnected'
    this.dialogRef.close();
  }






  expirationCounter: string;
  startTimer() {
    let second = 0;
    let minute = 0;
    let hours = 0;
  
    setInterval(() => {
      second += 1; 
      if(second == 59) {
        minute += 1;
        second = 0;
      } else if (minute == 59) {
        hours += 1;
        minute = 0;
        second = 0;
      }
      this.expirationCounter = this.formatTime(hours) + ":" + this.formatTime(minute) + ":" + this.formatTime(second);
    }, 1000)
  }

  formatTime(value: number) {
    if(value <= 9) {
      return "0"+value;
    } else {
      return value;
    }
  }

}
