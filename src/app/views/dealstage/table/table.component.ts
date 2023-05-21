import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

import { egretAnimations } from 'app/shared/animations/egret-animations';
import * as commonModels from 'app/shared/models/common.model';
import { DealStage } from 'app/shared/models/deal.model';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { AppState } from 'app/store/';
import * as actions from 'app/store/dealstage/dealstage.actions';
import {
  dataSelector,
  didFetchSelector,
  metaSelector,
} from 'app/store/dealstage/dealstage.selectors';
import { initialState } from 'app/store/dealstage/dealstage.states';
import { NgxRolesService } from 'ngx-permissions';

@Component({
  selector: 'app-dealstage-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.style.scss'],
  animations: egretAnimations,
})
export class DealstageTableComponent implements OnInit, OnDestroy {
  columnHeaders: string[] = ['srNo', 'name'];

  private onDestroy$ = new Subject<void>();

  public dealstages$: Observable<any>;
  public meta$: Observable<any>;
  public didFetch$: Observable<any>;

  public dealstages: Array<DealStage> = [];
  public meta: commonModels.Meta;
  public offset: number;

  constructor(
    private store$: Store<AppState>,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private confirmService$: AppConfirmService,
    private rolesService$: NgxRolesService
  ) {
    this.dealstages$ = this.store$.select(dataSelector);
    this.meta$ = this.store$.select(metaSelector);
    this.didFetch$ = this.store$.select(didFetchSelector);
    this.offset = 0;
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.dealstages$
      .pipe(
        takeUntil(this.onDestroy$),
        tap(dealstages => {
          if (!deepEqual(this.dealstages, dealstages)) {
            this.dealstages = dealstages;
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
  }

  sortData(event) {
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
}
