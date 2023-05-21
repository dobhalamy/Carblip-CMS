import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, takeUntil, tap } from 'rxjs/operators';
import { NgxRolesService } from 'ngx-permissions';


import { egretAnimations } from 'app/shared/animations/egret-animations';
import { Vendors } from 'app/shared/models/vendors.model';
import { VendorsEditComponent } from '../edit/edit.component';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AppState } from 'app/store';
import {
  dataSelector,
  didFetchSelector,
  metaSelector,
  fetchingSelector
} from 'app/store/vendors/vendors.selectors';
import * as commonModels from 'app/shared/models/common.model';
import * as actions from 'app/store/vendors/vendors.actions';
import { initialState } from 'app/store/vendors/vendors.states';
import { User } from 'app/shared/models/user.model';

@Component({
  selector: 'app-vendors-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.style.scss'],
  animations: egretAnimations,
})
export class VendorsTableComponent implements OnInit, OnDestroy {
  columnHeaders: string[] = [
    'name',
    'street_address',
    'city',
    'state',
    'zip',
    'website',
    'company_phone',
    'actions'
  ];

  private onDestroy$ = new Subject<void>();
  public vendors: Array<Vendors> = [];

  public meta$: Observable<any>;
  public didFetch$: Observable<any>;
  public fetching$: Observable<any>;

  public vendors$: Observable<any>;
  public meta: commonModels.Meta;

  public offset: number;
  public isAllowUpdate: boolean = false;
  public sortKey:string;
  public sortDirection:string;

  constructor(
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private rolesService$: NgxRolesService,
    private confirmService$: AppConfirmService,
    private store$: Store<AppState>,
  ) {
    this.vendors$ = this.store$.select(dataSelector);
    this.meta$ = this.store$.select(metaSelector);
    this.didFetch$ = this.store$.select(didFetchSelector);
    this.fetching$ = this.store$.select(fetchingSelector);
    this.offset = 1;
    this.sortKey = localStorage.getItem("vendor_module_order_by");
    this.sortDirection = localStorage.getItem("vendor_module_order_dir");    
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.vendors$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(vendors => {
          if (!deepEqual(this.vendors, vendors)) {
            this.vendors = vendors;
            this.refreshTable();
          }
        })
      )
      .subscribe();

    this.meta$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(meta => {
          this.meta = meta;
          this.offset = meta.from;
          this.refreshTable();
        })
      )
      .subscribe();

    this.didFetch$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(didFetch => !didFetch && this.loadData())
      )
      .subscribe();
    this.checkUpdateAccess();
  }

  loadData() {
    this.store$.dispatch(new actions.GetList());
  }

  sortData(event) {
    //set arrow direction in localstorage
    localStorage.setItem("vendor_module_order_by", event.active);
    localStorage.setItem("vendor_module_order_dir", event.direction);

    const updated_filter = {
      order_by: event.active ? event.active : initialState.filter.order_by,
      order_dir: event.direction
        ? event.direction
        : initialState.filter.order_dir,
    };
    this.store$.dispatch(new actions.UpdateFilter(updated_filter));
  }


  checkUpdateAccess() {
    const roles = this.rolesService$.getRoles();
    if (roles['administrative'] || roles['admin'] || roles['superadmin']) {
      this.isAllowUpdate = true;
    }
  }

  onEdit(item: Vendors) {
    const title = 'Edit User';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      VendorsEditComponent,
      {
        width: '720px',
        disableClose: false,
        data: { title: title, payload: item, type: 'edit' },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        // If user press cancel
        return;
      }

      this.store$.dispatch(new actions.UpdateSuccess(res));
    });
  }
  onDelete(item: Vendors) {
    this.confirmService$
      .confirm({
        message: `Are you sure you want to delete Quote?`,
      })
      .subscribe(res => {
        if (res) {
          const payload = {
            id: item.id,
          };
          this.store$.dispatch(new actions.Delete(payload));
        }
      });
  }

  refreshTable() {
    this.changeDetectorRefs.detectChanges();
  }
}
