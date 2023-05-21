import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UserService } from 'app/shared/services/apis/users.service';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar, MAT_DIALOG_DATA } from '@angular/material';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-mail-thread',
  templateUrl: './mail-thread.component.html',
  styleUrls: ['./mail-thread.component.scss']
})
export class MailThreadComponent implements OnInit, OnChanges {
  @Output() navClose = new EventEmitter<string>();
  @Input() mailId: number = 0;
  @Input() sendTo: string = '';
  @Input() userInfo: any ;
  replyToMessageForm: FormGroup
  public Editor = ClassicEditor;
  panelOpenState = false;
  zimbraMails: any = [];
  showEditor: boolean = false;
  inboxMsg: any;
  hideMessage: boolean = false;
  threadItem: any = null;
  fileAttachment =[];
  registerUserInfo: any;
  panelState: number = 0;
  
  constructor
    (
      private service$: UserService,
      private _cdr: ChangeDetectorRef,
      private fb: FormBuilder,
      private snack$: MatSnackBar,
    ) { }

  ngOnChanges(changes: SimpleChanges): void {
  }

  ngOnInit() { 
    this.initForm();
    this.getThreads(this.mailId); 
  }

  initForm() {
    this.replyToMessageForm = this.fb.group({
      message: ['']
    })
  }

  close() {
    this.showEditor = false;
    this.navClose.emit("");
  }

  formatMessageText(message: string) {
    if (message !== undefined) {
      message = new String(message).replace(/(<([^>]+)>)/gi, "");
      return message.substring(0, 15);
    } else {
      return "";
    }
  }

  getThreads(id: number) {
    this.service$.getzimbraMails(id).subscribe((res) => {
      if (res.err) {
      } else {
        this.zimbraMails = res.data;
        this.zimbraMails = this.zimbraMails.map(mail=> {
          mail['display'] = true;
          return mail;
        })
        this._cdr.detectChanges();
      }
    })
  }

  openEditor() {
    this.showEditor = !this.showEditor
  }

  fileUploadDetails($event: any) {
    // this.emailForm.patchValue({emailAttachments: $event.documentoriginalname})
    this.fileAttachment = $event;
  }

  onSend() {
    if(this.threadItem !== null) {
      console.log(this.mailId);
      // payload.attach = this.fileAttachment;
      const payload = {
        to: this.sendTo,
        thread_id: this.threadItem.cid,
        addCc: null,
        addBcc: null,
        subject: this.threadItem.subject,
        message: this.replyToMessageForm.value.message,
        emailAttachments:null,
        name:'test',
        attach:this.fileAttachment,
        register_id: this.userInfo.id
      }
        this.service$.sendMail(payload).subscribe((res: any) => {
          if(res){
            this.showEditor = false;
            this._cdr.detectChanges();
              this.snack$.open(res.data, 'OK', {
                duration: 3000,
              });
              this.getThreads(this.mailId)
          }
        })
    }

  }


  onCancel() {
    this.showEditor = !this.showEditor
  }

  showinboxmsg(item:any, index: number) {
    this.panelOpenState = true
    this.threadItem = item;
    this.service$.getMessageDetails(item.id).subscribe(res=> {
      if(res.data != null){
        console.log('inboxmessage',res);
        this.zimbraMails[index]['threads'] = res.data;
        this.zimbraMails[index]['display'] = false;
        this._cdr.detectChanges();
          if(item.status == 0) {
            this.zimbraMails[index].status = 1;
            this.service$.changeMsgstatus(item.id).subscribe(res=>{
            })
          }
      }
    })
  }

  closePanel() {
    this.panelOpenState = true; 
    this.showEditor = false;
    this.threadItem = null;
  }


  onClickDownloadPdf(mailId: number,fileindex:number){
    const payload = {
      mailid: Number(mailId),
      fileindex: Number(fileindex),
    }
    // let id = Number(mailId)
    this.service$.getAttachment(payload).subscribe(res => {
      if(res.error) {

      } else {
        const fileInfo = res.data;
        const bytes  = CryptoJS.AES.decrypt(fileInfo.payload, fileInfo.token);
        const payloadBase64 = bytes.toString(CryptoJS.enc.Utf8);
        this.downloadPdf(payloadBase64, fileInfo.documentOriginalName, fileInfo);
      }
    })
  }

  downloadPdf(base64String, fileName,fileInfo: any) {
    const source = `data:${fileInfo.mime_type};base64,${base64String}`;
    const link = document.createElement("a");
    link.href = source;
    link.download = fileName
    link.click();
  }

}
