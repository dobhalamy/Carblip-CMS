import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { Observable, Subject } from 'rxjs';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';

import { egretAnimations } from 'app/shared/animations/egret-animations';
import { getBoolColor } from 'app/shared/helpers/utils';
import { formatPhoneNumber } from 'app/shared/helpers/utils';
import * as commonModels from 'app/shared/models/common.model';
import { Request } from 'app/shared/models/request.model';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { AppState } from 'app/store/';
import * as actions from 'app/store/requests/requests.actions';
import {
  dataSelector,
  didFetchSelector,
  metaSelector,
} from 'app/store/requests/requests.selectors';
import { initialState } from 'app/store/requests/requests.states';
import { NgxRolesService } from 'ngx-permissions';

@Component({
  selector: 'app-requests-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.style.scss'],
  animations: egretAnimations,
})
export class RequestsTableComponent implements OnInit, OnDestroy {
  columnHeaders: string[] = [
    'srNo',
    'first_name',
    'last_name',
    'year',
    'brand',
    'model',
    'trim',
    'contact_owner',
    'referral_code',
    'source',
    'closed_won',
    'trade_in',
    'contract_date',
    'created_at',
    'actions',
  ];

  private onDestroy$ = new Subject<void>();

  public requests$: Observable<any>;
  public meta$: Observable<any>;
  public didFetch$: Observable<any>;

  public requests: Array<Request> = [];
  public meta: commonModels.Meta;
  public offset: number;
  public sortKey:string;
  public sortDirection:string;

  constructor(
    private store$: Store<AppState>,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private confirmService$: AppConfirmService,
    private rolesService$: NgxRolesService
  ) {
    this.requests$ = this.store$.select(dataSelector);
    this.meta$ = this.store$.select(metaSelector);
    this.didFetch$ = this.store$.select(didFetchSelector);
    this.offset = 1;
    this.sortKey = localStorage.getItem("requests_module_order_by");
    this.sortDirection=localStorage.getItem("requests_module_order_dir");
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.requests$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(requests => {
          if (!deepEqual(this.requests, requests)) {
            this.requests = requests;
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
  }

  sortData(event) {
    //set arrow direction in localstorage
    localStorage.setItem("requests_module_order_by", event.active);
    localStorage.setItem("requests_module_order_dir", event.direction);

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

  onDelete(item: Request) {
    this.confirmService$
      .confirm({
        message: `Are you sure you want to delete request?`,
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

  showEditButton(item: Request) {
    const roles = this.rolesService$.getRoles();
    if (roles['administrative']) {
      return false;
    } else {
      return true;
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

  checkRequestQuotesHasContractDate(quotes: any) {
    let index = quotes.findIndex(x=> x.contract_date !== null);
    if(index !== -1) {
      return true;
    }
  }
}
