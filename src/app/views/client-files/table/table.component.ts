import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { Observable, Subject } from 'rxjs';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';
import * as commonModels from 'app/shared/models/common.model';
import { ClientFiles } from 'app/shared/models/client-files.model';
import { AppState } from 'app/store/';
import * as actions from 'app/store/client-files/client-files.actions';
import {
  dataSelector,
  didFetchSelector,
  metaSelector,
} from 'app/store/client-files/client-files.selectors';
import { initialState } from 'app/store/client-files/client-files.states';
import { ClientFilesService } from 'app/shared/services/apis/client-files.service';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import * as CryptoJS from 'crypto-js';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-client-files-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})

export class TableComponent implements OnInit {
  dataSource = [];
  columnsToDisplay = [
    'Sr#',
    'First Name',
    'Last Name',
    'Phone',
    'Email Address',
    'File Type',
    'Created At',
    'Actions'
  ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: PeriodicElement | null;

  columnHeaders: string[] = [
    'srNo',
    'first_name',
    'last_name',
    'phone_number',
    'email_address',
    'file_type',
    'created_at',
    'actions'
  ];

  private onDestroy$ = new Subject<void>();

  public clientFiles$: Observable<any>;
  public meta$: Observable<any>;
  public didFetch$: Observable<any>;

  public clientFiles: Array<ClientFiles> = [];
  public meta: commonModels.Meta;
  public offset: number;

  public sortKey:string;
  public sortDirection:string;
  pdfSrc: string = '';

  constructor(
    private store$: Store<AppState>,
    private changeDetectorRefs: ChangeDetectorRef,
    private service$: ClientFilesService,
    private snack$: MatSnackBar,
    private loader$: AppLoaderService,
    private matDialog:MatDialog,
    public _cdr: ChangeDetectorRef
  ) {
    this.clientFiles$ = this.store$.select(dataSelector);
    this.meta$ = this.store$.select(metaSelector);
    this.didFetch$ = this.store$.select(didFetchSelector);
    this.offset = 1;
    this.sortKey = localStorage.getItem("cf_module_order_by");
    this.sortDirection=localStorage.getItem("cf_module_order_dir");
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.clientFiles$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(requests => {
          if (!deepEqual(this.clientFiles, requests)) {
            // this.clientFiles = requests;
            requests = requests.map((item: any, i: number) => {
              item['sr'] = i;
              return item;
            });
            this.dataSource = requests;
            this.refreshTable();
          }
        })
      )
      .subscribe();

    this.meta$.pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(meta => {
          this.meta = meta;
          this.offset = meta.from;
          this.refreshTable();
        })).subscribe();
      this.didFetch$.pipe(debounceTime(10), takeUntil(this.onDestroy$), tap(didFetch => !didFetch && this.loadData())).subscribe();
  }

  loadData() {
    this.store$.dispatch(new actions.GetList());
  }

  sortData(event) {
    //set arrow direction in local storage
    localStorage.setItem("cf_module_order_by", event.active);
    localStorage.setItem("cf_module_order_dir", event.direction);
 
    const updated_filter = {
      order_by: event.active ? event.active : initialState.filter.order_by,
      order_dir: event.direction
        ? event.direction
        : initialState.filter.order_dir,
    };
    this.store$.dispatch(new actions.UpdateFilter(updated_filter));
  }

  refreshTable() {
    this.changeDetectorRefs.detectChanges();
  }

  getCreditApplication(id: string, type: string) {
    this.loader$.open();
    this.service$.getClientApplicationUrl(id).subscribe(res=> {
      if(res) {
        if(res.data.length > 0) {
          if(res.data[0].permission) {
            if(type == 'view') {
              this.openDialog(res.data[0]);
            } else {
              this.downloadFile(res.data[0]);
            }
          } else {
            this.snack$.open(res.data[0].data, 'OK', {
              duration: 4000,
            });  
          }
        } else {
          this.snack$.open('Ooops! file not found.', 'OK', {
            duration: 4000,
          });
        }
        this.loader$.close();
      }
    })
  }

  openDialog(data: any) {
   // Add code
  }
  
  viewPdf(data: any) {
    var bytes  = CryptoJS.AES.decrypt(data.data, data.token);
    var base64 = bytes.toString(CryptoJS.enc.Utf8);
    const byteArray = new Uint8Array(
      atob(base64)
        .split("")
        .map(char => char.charCodeAt(0))
    );
    const file = new Blob([byteArray], { type: data.mimetype });
    const fileURL = URL.createObjectURL(file);
    this.pdfSrc = fileURL;
  }

  downloadFile(data: any) {
    var encryptedBase64  = CryptoJS.AES.decrypt(data.data, data.token);
    var finalBase64 = encryptedBase64.toString(CryptoJS.enc.Utf8);
    this.downloadPdf(finalBase64, data.documentname, data.mimetype);
  }

  downloadPdf(base64String: string, fileName: string, fileInfo: any) {
    const source = `data:${fileInfo.mime_type};base64,${base64String}`;
    const link = document.createElement("a");
    link.href = source;
    link.download = fileName;
    link.click();
  }

  loadTable(element: any, expanded: any) {
    this.clientFiles = [];
    if(element.total_application > 1 && expanded != null) {
      this.getClientFilesByEmail(element.email_address);
    }
  }

  getClientFilesByEmail(email: string) {
    this.service$.getClientApplicationsByEmail(email).subscribe(res=> {
      if(res) {
        this.clientFiles = res.data.length > 0 ? res.data : [];
        this._cdr.detectChanges();
      }
    })
  }
}
export interface PeriodicElement {
  first_name: string;
  last_name: string;
  sr: number;
  email_address: string;
  phone: string;
  file_type: string;
  created_at: string;
  totalApplications: number;
}