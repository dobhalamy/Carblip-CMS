import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { Observable, Subject } from 'rxjs';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';

import { egretAnimations } from 'app/shared/animations/egret-animations';
import * as commonModels from 'app/shared/models/common.model';
import { Inventory } from 'app/shared/models/inventory.model';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { AppState } from 'app/store/';
import * as actions from 'app/store/inventories/inventories.actions';
import {
  dataSelector,
  didFetchSelector,
  filterSelector,
  metaSelector,
} from 'app/store/inventories/inventories.selectors';
import { initialState } from 'app/store/inventories/inventories.states';
import { NgxRolesService } from 'ngx-permissions';

@Component({
  selector: 'app-inventories-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.style.scss'],
  animations: egretAnimations,
})
export class InventoriesTableComponent implements OnInit, OnDestroy {
  columnHeaders: string[] = [
    'srNo',
    'dealer',
    'stock_no',
    'year',
    'make',
    'model',
    'desc',
    'exterior_color',
    'interior_color',
    // 'option',
    'model_number',
    'invoice',
    'actions',
  ];

  private onDestroy$ = new Subject<void>();

  public inventories$: Observable<any>;
  public meta$: Observable<any>;
  public filter$: Observable<any>;
  public didFetch$: Observable<any>;

  public inventories: Array<Inventory> = [];
  public meta: commonModels.Meta;
  public offset: number;

  public sortKey:string;
  public sortDirection:string;

  constructor(
    private store$: Store<AppState>,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private confirmService$: AppConfirmService,
    private rolesService$: NgxRolesService,
  ) {
    this.inventories$ = this.store$.select(dataSelector);
    this.meta$ = this.store$.select(metaSelector);
    this.filter$ = this.store$.select(filterSelector);
    this.didFetch$ = this.store$.select(didFetchSelector);
    this.offset = 0;
    this.sortKey = localStorage.getItem("inventory_module_order_by");
    this.sortDirection=localStorage.getItem("inventory_module_order_dir");
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.inventories$
      .pipe(
        takeUntil(this.onDestroy$),
        tap(inventories => {
          if (!deepEqual(this.inventories, inventories)) {
            this.inventories = inventories;
            this.refreshTable();
          }
        })
      )
      .subscribe();

    this.meta$
      .pipe(
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
  }

  loadData() {
    this.store$.dispatch(new actions.GetList());
  }

  sortData(event) {
    //set arrow direction in localstorage
    localStorage.setItem("inventory_module_order_by", event.active);
    localStorage.setItem("inventory_module_order_dir", event.direction);

    const updated_filter = {
      order_by: event.active ? event.active : initialState.filter.order_by,
      order_dir: event.direction
        ? event.direction
        : initialState.filter.order_dir,
    };
    this.store$.dispatch(new actions.UpdateFilter(updated_filter));
  }

  getActiveColor(is_active: number) {
    switch (is_active) {
      case 0:
        return 'warn';
      case 1:
      default:
        return 'accent';
    }
  }

  refreshTable() {
    this.changeDetectorRefs.detectChanges();
  }

  showEditButton(item: Request) {
    const roles = this.rolesService$.getRoles();
    if (roles['admin'] || roles['superadmin']) {
      return true;
    } else {
      return false;
    }
  }

  showDeleteButton(item: Request) {
    const roles = this.rolesService$.getRoles();
    if (roles['admin'] || roles['superadmin']) {
      return true;
    } else {
      return false;
    }
  }
}
