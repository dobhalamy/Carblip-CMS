import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatPaginator,
  MatSort,
  MatTableDataSource,
} from '@angular/material';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, takeUntil, tap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgxRolesService } from 'ngx-permissions';


import { VendorContact, Vendors, VendorsState } from 'app/shared/models/vendors.model';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { VendorsService } from 'app/shared/services/apis/vendors.service';
import { AppState } from 'app/store/';
import * as actions from 'app/store/vendors/vendors.actions';
import { VendorsEditComponent } from '../edit/edit.component';
import { VendorContactModalComponent } from 'app/shared/components/vendor-contact-modal/vendor-contact-modal.component';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { STATE_LIST } from 'app/core/constants';
import { State, TablePagination } from 'app/shared/models/common.model';
import { User } from 'app/shared/models/user.model';

@Component({
  selector: 'app-vendors-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  animations: egretAnimations,
})
export class VendorsDetailComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  columnHeaders: string[] = [
    'srNo',
    'name',
    'email',
    'phone',
    'created_at',
    'updated_at',
    'actions',
  ];
  dataSource: any;
  private onDestroy$ = new Subject<void>();

  public vendorId: string;
  public isReady: boolean;
  public vendor: Vendors;
  public vendorContacts: Array<VendorContact> = [];
  public stateList: Array<State> = STATE_LIST;
  public state;
  public param: any = {
    vendor_id: null,
    order_by: 'created_at',
    order_dir: 'desc',
    page: 1,
    per_page: 10,
  };
  public tablePagination: TablePagination = {
    length: 0,
    pageIndex: 0,
    pageSize: 20,
    previousPageIndex: 0,
  };
  public totalContacts;
  public isAllowUpdate: boolean = false;
  constructor(
    private store$: Store<AppState>,
    private route$: ActivatedRoute,
    private loader$: AppLoaderService,
    private service$: VendorsService,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private confirmService$: AppConfirmService,
    private rolesService$: NgxRolesService,

  ) { }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.route$.paramMap.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.vendorId = params.get('id');
      this.param.vendor_id = this.vendorId
      this.initData();
    });
    this.dataSource = new MatTableDataSource();
    this.checkUpdateAccess();
  }

  onPaginateChange(event) {
    this.param.page = event.pageIndex + 1;
    this.param.per_page = event.pageSize;
    this.initData();
  }

  initData() {
    setTimeout(() => {
      this.loader$.open();
    }, 10);

    combineLatest(
      this.service$.getById(this.vendorId),
      this.service$.getListContacts(this.param)
    )
      .pipe(
        takeUntil(this.onDestroy$),
        map(result => result),
        catchError(err => {
          return of(err);
        })
      )
      .subscribe(([result, contacts]) => {
        this.loader$.close();
        this.vendor = result.data;
        this.state = this.filteredState(result.data.state)[0].value;
        this.vendorContacts = contacts ? contacts['data'] : [];
        this.initTable();
        this.isReady = true;
        this.changeDetectorRefs.detectChanges();
      });
  }

  filteredState(key) {
    return this.stateList.filter(vendor => vendor.value == key);
  }
  initTable() {
    this.dataSource.data = this.vendorContacts;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  checkUpdateAccess() {
    const roles = this.rolesService$.getRoles();
    if (roles['administrative'] || roles['admin'] || roles['superadmin']) {
      this.isAllowUpdate = true;
    }
  }

  onAddContact() {
    const title = 'Add New Contact';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      VendorContactModalComponent,
      {
        width: '768px',
        disableClose: true,
        data: {
          title: title,
          payload: {
            vendorId: this.vendorId,
          },
          type: 'add',
        },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        // If user press cancel
        return;
      }
      this.store$.dispatch(new actions.ClearDetail());
      this.initData();
      // this.getContactList(this.param);
    });
  }

  onEditVendor() {
    const title = 'Edit Vendor';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      VendorsEditComponent,
      {
        width: '720px',
        disableClose: false,
        data: { title: title, payload: this.vendor, type: 'edit' },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        // If user press cancel
        return;
      }
      this.vendor = res;
      this.state = this.filteredState(this.vendor.state)[0].value;
      this.changeDetectorRefs.detectChanges();
      this.store$.dispatch(new actions.UpdateSuccess(res));
    });
  }

  onEdit(item: VendorContact, index: number) {
    const title = 'Edit Contact';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      VendorContactModalComponent,
      {
        width: '768px',
        disableClose: true,
        data: {
          title: title,
          payload: {
            vendorId: this.vendorId,
            data: item,
          },
          type: 'edit',
        },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        // If user press cancel
        return;
      }
      this.store$.dispatch(new actions.ClearDetail());
      this.initData();
    });
  }

  onDelete(item: VendorContact, index: number) {
    this.confirmService$
      .confirm({
        message: `Are you sure you want to delete Dealer Contact?`,
      })
      .subscribe(res => {
        if (res) {
          this.loader$.open();
          this.service$
            .deleteContact(item.id.toString())
            .pipe(
              takeUntil(this.onDestroy$),
              map(result => result),
              catchError(err => {
                this.loader$.close();
                throw err;
              })
            )
            .subscribe(res1 => {
              this.loader$.close();
              this.store$.dispatch(new actions.ClearDetail());
              if (res1) {
                this.vendorContacts.splice(index, 1);
                this.initData();
              }
            });
        }
      });
  }
}
