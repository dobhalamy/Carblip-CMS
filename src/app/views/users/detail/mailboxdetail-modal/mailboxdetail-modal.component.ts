import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from 'app/shared/services/apis/users.service';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-mailboxdetail-modal',
  templateUrl: './mailboxdetail-modal.component.html',
  styleUrls: ['./mailboxdetail-modal.component.scss']
})
export class MailboxdetailModalComponent implements OnInit {
  type: any;
  mail: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<MailboxdetailModalComponent>,
    private userService$: UserService
  ) { }

  ngOnInit() {
    this.mail = this.data.payload;
  }

  getFileName(fileName: string) {
    let name = fileName.split('/');
    return name[name.length-1]
  }

  downloadPdf(base64String, fileName,fileInfo: any) {
    const source = `data:${fileInfo.mime_type};base64,${base64String}`;
    const link = document.createElement("a");
    link.href = source;
    link.download = fileName
    link.click();
  }

  onClickDownloadPdf(mailId: number){
    let id = Number(mailId)
    this.userService$.getAttachment(id).subscribe(res => {
      if(res.error) {

      } else {
        const fileInfo = res.data;
        const bytes  = CryptoJS.AES.decrypt(fileInfo.payload, fileInfo.token);
        const payloadBase64 = bytes.toString(CryptoJS.enc.Utf8);
        this.downloadPdf(payloadBase64, fileInfo.documentOriginalName, fileInfo);
      }
    })

  }
}
