import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder,FormControl,FormGroup,Validators, } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { MatSnackBar } from '@angular/material';
import { UserService } from 'app/shared/services/apis/users.service';
import { MailboxTableComponent } from '../mailbox-table/mailbox-table.component';

@Component({
  selector: 'app-mailbox-modal',
  templateUrl: './mailbox-modal.component.html',
  styleUrls: ['./mailbox-modal.component.scss']
})

export class MailboxModalComponent implements OnInit {
  public emailForm:FormGroup;
  public Editor = ClassicEditor;
  cc:boolean = false;
  bcc:boolean = false;
  registerUserInfo: any;
  tableRefresh = true;
  fileAttachment =[];
  fileData: File;
  fileUploadInfo: { url: string, filename: string};
  filename: string = '';
  
  constructor
  (
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb:FormBuilder,
    public dialogRef: MatDialogRef<MailboxModalComponent>,
    private matDialog:MatDialog,
    private service$: UserService,
    private loader$: AppLoaderService,
    private snack$: MatSnackBar,

  ) { }

  ngOnInit() {
    this.initform();
    this.registerUserInfo = this.data.userdetails;
  }

  initform(){
  this.emailForm = this.fb.group({
    to: this.data.userdetails.email_address,
    thread_id: [null],
    addCc: [null],
    addBcc: [null],
    subject: ['',Validators.required],
    message:['',Validators.required],
    emailAttachments: [''],
    name:"test",
    register_id: this.data.userdetails.id
  })
  }

  onFileSelected(event: any) { 
    if(event.target.files.length > 0) {
      this.fileData = event.target.files[0];
      let filename = event.target.files[0].name.split('.');
      this.filename = filename;
      let fileType = filename[filename.length-1];
      this.emailForm.patchValue({emailAttachments: event.target.files[0].name})
      this.service$.getUploadPresignedUrl(fileType).subscribe(res=> {
        if(res.error) {
        } else {
          // this.fileUploadInfo = res.data;
          this.fileAttachment = res.data.filename;
        }
      })
      
    }
  }

  fileUploadDetails($event: any) {
    // this.emailForm.patchValue({emailAttachments: $event.documentoriginalname})
    this.fileAttachment = $event;
  }

  showCC() {
    this.cc = !this.cc
    if(this.cc) {
      this.emailForm.controls['addCc'].setValidators([Validators.required, Validators.email]);
    } else {
      this.emailForm.controls['addCc'].clearValidators();
    }
    this.emailForm.get("addCc").updateValueAndValidity();
  }

  showBCC() {
    this.bcc = !this.bcc;
    if(this.bcc) {
      this.emailForm.controls['addBcc'].setValidators([Validators.required, Validators.email]);
    } else {
      this.emailForm.controls['addBcc'].clearValidators();
    }
    this.emailForm.get("addBcc").updateValueAndValidity();
  }

  sendMail() {
    let data = this.emailForm.value
    data.attach = this.fileAttachment;
    if(this.emailForm.valid) {
      this.loader$.open();
      if(this.fileData !== undefined) {
        this.service$.uploadFileOnPresignedUrl(this.fileUploadInfo.url, this.fileData).subscribe(res=> {
          if(res.error) {
            console.log("Something is wrong....");
          }
        })
      } 
      setTimeout(()=> {
        this.service$.sendMail(data).subscribe((res: any) => {
          if(res) {
            setTimeout(()=> {
              this.matDialog.closeAll();
              this.loader$.close();
              this.snack$.open(res.data, 'OK', {
                duration: 3000,
              });
            },3000)
          }
        }) 
      }, 2000)   
    } else {
      this.snack$.open("Please check all the fields")
    }
  }
}
