import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FileUploaderService } from '../../services/file-uploader.service';

@Component({
  selector: 'file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.scss']
})
export class FileUploaderComponent implements OnInit {
  @Output() getUploadDetails = new EventEmitter<{}>();
  @Input() userDetails: any;
  uploadedMedia: Array<any> = [];
  uploadFileUrl: string = '';
  uploadedFiles: Array<any> = [];
  constructor(private mediaService: FileUploaderService) {}

  ngOnInit() {}

  onFileBrowse(event: Event) {
    const target = event.target as HTMLInputElement;
    this.processFiles(target.files);
  }
  processFiles(files) {
    let index = 0;
    for (const file of files) {
      var reader = new FileReader();
      reader.readAsDataURL(file); // read file as data url
      reader.onload = (event: any) => {
        // called once readAsDataURL is completed
        this.uploadedMedia.push({
          FileName: file.name,
          FileSize:
            this.mediaService.getFileSize(file.size) +
            ' ' +
            this.mediaService.getFileSizeUnit(file.size),
          FileType: file.type,
          FileUrl: event.target.result,
          FileProgessSize: 0,
          FileProgress: 0,
          ngUnsubscribe: new Subject<any>(),
        });
        let type = file.name.split('.');
        // console.log('userDetails',this.userDetails);
        // console.log('filetype',file.type);
        const payload = {
          file_type: type[type.length - 1],
          register_id: this.userDetails.id,
          register_email: this.userDetails.email_address
        }

        this.mediaService.getPresignedUrl(payload).subscribe(res=> {
          if(res.error) {
          } else {
            this.uploadFileUrl = res.data.url;
            this.uploadedFiles.push({
              documentname: file.name,
              documentoriginalname: res.data.filename,
              mimetype: type[type.length - 1]
            })
            this.startProgress(file, index);
            index += 1;
            this.getUploadDetails.emit(this.uploadedFiles);
          }
        });
        }
      };
    }

  async startProgress(file, index) {
    let filteredFile = this.uploadedMedia.filter((u, i) => i == index).pop();

    if (filteredFile != null) {
      let fileSize = this.mediaService.getFileSize(file.size);
      let fileSizeInWords = this.mediaService.getFileSizeUnit(file.size);
        this.mediaService
          .uploadMedia(file, this.uploadFileUrl)
          .pipe(takeUntil(filteredFile.ngUnsubscribe))
          .subscribe(
            (res: any) => {
              console.log('fileUpload Data',res);
              if (res.status === 'progress') {
                console.log('file-process','progress');
                let completedPercentage = parseFloat(res.message);
                filteredFile.FileProgessSize = `${(
                  (fileSize * completedPercentage) /
                  100
                ).toFixed(2)} ${fileSizeInWords}`;
                filteredFile.FileProgress = completedPercentage;
              } else if (res.status === 'completed') {
                console.log('file-process','completed');
                filteredFile.Id = res.Id;
                filteredFile.FileProgessSize = fileSize + ' ' + fileSizeInWords;
                filteredFile.FileProgress = 100;
              }
            },
            (error: any) => {
              console.log('file upload error');
              console.log(error);
            }
          );
    }
  }

  fakeWaiter(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  removeImage(idx: number) {
    this.uploadedMedia = this.uploadedMedia.filter((u, index) => index !== idx);
    const removeFile = this.uploadedFiles[idx];
    const payload = {
      register_id: this.userDetails.id,
      register_email: this.userDetails.email_address,
      file_name:removeFile.documentoriginalname
    }
    this.mediaService.removefile(payload).subscribe(res=> {
      if(res.error) {
      } else {
        console.log('result',res.data);
        this.uploadedFiles = this.uploadedFiles.filter((u, index) => index !== idx);
        this.getUploadDetails.emit(this.uploadedFiles);
      }
    });
  }
}