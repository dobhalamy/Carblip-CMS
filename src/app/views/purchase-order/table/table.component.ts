import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, takeUntil, tap } from 'rxjs/operators';
import { NgxRolesService } from 'ngx-permissions';
import * as deepEqual from 'deep-equal';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { PurchaseOrder } from 'app/shared/models/purchase-order.model';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AppState } from 'app/store/';
import * as commonModels from 'app/shared/models/common.model';
import { dataSelector, didFetchSelector, metaSelector, fetchingSelector } from 'app/store/purchase-order/purchase-order.selectors';
import * as actions from 'app/store/purchase-order/purchase-order.actions';
import { initialState } from 'app/store/purchase-order/purchase-order.states';

@Component({
  selector: 'app-purchase-order-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  animations: egretAnimations,
})
export class PurchaseOrderTableComponent implements OnInit {
  columnHeaders: string[] = [
    'purchase_order_number',
    'stock_no',
    'description',
    'amount',
    'request_approval_name',
    'payment_date',
    'vendor_name',
    'category',
    'actions'
  ];
  private onDestroy$ = new Subject<void>();
  public purchaseOrders: Array<PurchaseOrder> = [];

  public meta$: Observable<any>;
  public didFetch$: Observable<any>;
  public fetching$: Observable<any>;

  public purchaseOrder$: Observable<any>;
  public offset: number;
  public meta: commonModels.Meta;
  public isAllowUpdate: boolean = false;
  public sortKey:string;
  public sortDirection:string;

  constructor(
    private store$: Store<AppState>,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private rolesService$: NgxRolesService,
    private confirmService$: AppConfirmService,
  ) {
    this.purchaseOrder$ = this.store$.select(dataSelector);
    this.meta$ = this.store$.select(metaSelector);
    this.didFetch$ = this.store$.select(didFetchSelector);
    this.fetching$ = this.store$.select(fetchingSelector);
    this.offset = 1;
    this.sortKey = localStorage.getItem("purchase_order_module_order_by");
    this.sortDirection=localStorage.getItem("purchase_order_module_order_dir");
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.purchaseOrder$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(purchaseOrder => {
          if (!deepEqual(this.purchaseOrders, purchaseOrder)) {
            this.purchaseOrders = purchaseOrder;
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
    this.showEditDeleteButton();
  }
  loadData() {
    this.store$.dispatch(new actions.GetList());
  }

  sortData(event) {
    //set arrow direction in localstorage
    localStorage.setItem("purchase_order_module_order_by", event.active);
    localStorage.setItem("purchase_order_module_order_dir", event.direction);

    const updated_filter = {
      order_by: event.active ? event.active : initialState.filter.order_by,
      order_dir: event.direction
        ? event.direction
        : initialState.filter.order_dir,
    };
    this.store$.dispatch(new actions.UpdateFilter(updated_filter));
  }

  showEditDeleteButton() {
    const roles = this.rolesService$.getRoles();
    if (roles['administrative'] || roles['admin'] || roles['superadmin']) {
      this.isAllowUpdate = true;
    }
  }

  onDelete(item: PurchaseOrder) {
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
