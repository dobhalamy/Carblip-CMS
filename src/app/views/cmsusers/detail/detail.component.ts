import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, takeUntil, tap } from 'rxjs/operators';

import { ROLE_LIST } from 'app/core/constants';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { getBoolColor, getUserFullName } from 'app/shared/helpers/utils';
import { formatPhoneNumber } from 'app/shared/helpers/utils';
import { CmsUser } from 'app/shared/models/cmsuser.model';
import * as commonModels from 'app/shared/models/common.model';
import { Log, LogResponse } from 'app/shared/models/log.model';
import { CmsUserService } from 'app/shared/services/apis/cmsusers.service';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { AppState } from 'app/store/';
import * as actions from 'app/store/cmsusers/cmsusers.actions';
import {
  dataSelector,
  didFetchSelector,
  metaSelector,
} from 'app/store/cmsusers/cmsusers.selectors';
import { initialState as initialLogState } from 'app/store/cmsusers/cmsusers.states';
import { NgxRolesService } from 'ngx-permissions';
import { CmsUsersEditModalComponent } from '../table/edit-modal/edit-modal.component';
import { TablePagination } from 'app/shared/models/common.model';

@Component({
  selector: 'app-cmsuser-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.style.scss'],
  animations: egretAnimations,
})
export class CmsUsersDetailComponent implements OnInit, OnDestroy {
  private onDestroy$ = new Subject<void>();

  public cmsuserId: string;
  public isReady: boolean;
  public cmsuser: CmsUser;
  public logs: Array<Log>;
  public logPagination: TablePagination = {
    length: initialLogState.meta.total,
    pageIndex: initialLogState.filter.page,
    pageSize: initialLogState.filter.per_page,
    previousPageIndex: 0,
  };

  constructor(
    private store$: Store<AppState>,
    private route$: ActivatedRoute,
    private router$: Router,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private loader$: AppLoaderService,
    private confirmService$: AppConfirmService,
    private service$: CmsUserService,
    private rolesService$: NgxRolesService,

  ) { }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.isReady = false;
    this.route$.paramMap.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.cmsuserId = params.get('id');
      this.initData();
    });
  }

  initData() {
    setTimeout(() => {
      this.loader$.open();
    }, 10);

    combineLatest(
      this.service$.getById(this.cmsuserId),
      this.service$.getLogsById(this.cmsuserId)
    )
      .pipe(
        takeUntil(this.onDestroy$),
        map(result => result),
        catchError(err => {
          return of(err);
        })
      )
      .subscribe(([result, logResonse]) => {
        this.loader$.close();
        this.cmsuser = result.data;
        this.logs = logResonse.data;
        this.initLogMeta(logResonse.meta);
        this.isReady = true;
        this.changeDetectorRefs.detectChanges();
      });
  }

  initLogMeta(meta) {
    this.logPagination.length = meta.total;
    this.logPagination.pageIndex = meta.current_page - 1;
    this.logPagination.pageSize = meta.per_page;
  }

  toggleRR(item) { }

  /** Get Role Friendly Name from Role List
   * @param string name
   * @return string roleName
   **/

  getRoleName(name: string) {
    const obj = ROLE_LIST.find(item => item.name === name);
    return obj.label;
  }

  indirectShowDeleteButton() {
    const roles = this.rolesService$.getRoles();
    if (roles['admin'] || roles['superadmin']) {
      return true;
    } else {
      return false;
    }
  }

  indirectShowEditButton() {
    const roles = this.rolesService$.getRoles();
    if (roles['admin'] || roles['superadmin']) {
      return true;
    }
    else {
      return false;
    }
  }

  indirectDeleteDialogBox() {
    this.confirmService$
      .confirm({
        message: `Are you sure you want to delete the user '${this.cmsuser.first_name
          }'?`,
      })
      .subscribe(res => {
        if (res) {
          const payload = {
            id: this.cmsuser.id,
          };
          this.store$.dispatch(new actions.Delete(payload));
          this.router$.navigate(['/cmsusers']);
        }
      });
  }

  indirectEditDialogBox() {
    const title = 'Edit CarBlip Team Member';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      CmsUsersEditModalComponent,
      {
        width: '720px',
        disableClose: false,
        data: { title: title, payload: this.cmsuser, type: 'edit' },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        // If user press cancel
        return;
      }

      this.store$.dispatch(new actions.UpdateSuccess(res));
      this.initData();
    });
  }
}
