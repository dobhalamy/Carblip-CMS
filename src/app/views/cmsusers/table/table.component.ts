import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { Observable, Subject } from 'rxjs';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';

import { ROLE_LIST } from 'app/core/constants';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { CmsUser, UpdateCmsUser } from 'app/shared/models/cmsuser.model';
import * as commonModels from 'app/shared/models/common.model';
import { Profile } from 'app/shared/models/user.model';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { AppState } from 'app/store/';
import { dataSelector as profileDataSelector } from 'app/store/auth/authentication.selector';
import * as actions from 'app/store/cmsusers/cmsusers.actions';
import {
  dataSelector,
  didFetchSelector,
  metaSelector,
} from 'app/store/cmsusers/cmsusers.selectors';
import { initialState } from 'app/store/cmsusers/cmsusers.states';
import { CmsUsersEditModalComponent } from './edit-modal/edit-modal.component';
import { CmsUserService } from 'app/shared/services/apis/cmsusers.service';

@Component({
  selector: 'app-cmsusers-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.style.scss'],
  animations: egretAnimations,
})
export class CmsUsersTableComponent implements OnInit, OnDestroy {
  columnHeaders: string[] = [
    'srNo',
    'first_name',
    'last_name',
    'email',
    'role',
    'location',
    'roundrobin',
    'is_active',
    'actions',
  ];

  private onDestroy$ = new Subject<void>();

  public cmsusers$: Observable<any>;
  public meta$: Observable<any>;
  public didFetch$: Observable<any>;

  public cmsusers: Array<CmsUser> = [];
  public meta: commonModels.Meta;
  public offset: number;
  public userProfile: Profile;
  public edit_delete_permission: boolean;
  public sortKey:string;
  public sortDirection:string;

  constructor(
    private store$: Store<AppState>,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private confirmService$: AppConfirmService,
    private service$: CmsUserService
  ) {
    this.cmsusers$ = this.store$.select(dataSelector);
    this.meta$ = this.store$.select(metaSelector);
    this.didFetch$ = this.store$.select(didFetchSelector);
    this.offset = 0;
    this.sortKey = localStorage.getItem("cms_users_module_order_by");
    this.sortDirection=localStorage.getItem("cms_users_module_order_dir");
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.store$
      .select(profileDataSelector)
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap((profile: Profile) => {
          this.userProfile = profile;
          this.setPermission(this.userProfile.roles[0]);
        })
      )
      .subscribe();

    this.cmsusers$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(users => {
          if (!deepEqual(this.cmsusers, users)) {
            this.cmsusers = users;
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

  /** Handler when Edit icon in table row is clicked
   ** This function get cms user item as parameter, show modal to edit content,
   ** buid logic after modal is closed.
   * @param CmsUser item
   * @return
   **/

  sortData(event) {
    //set arrow direction in local storage
    localStorage.setItem("cms_users_module_order_by", event.active);
    localStorage.setItem("cms_users_module_order_dir", event.direction);

    const updated_filter = {
      order_by: event.active ? event.active : initialState.filter.order_by,
      order_dir: event.direction
        ? event.direction
        : initialState.filter.order_dir,
    };
    this.store$.dispatch(new actions.UpdateFilter(updated_filter));
  }

  /** Get Role Friendly Name from Role List
   * @param string name
   * @return string roleName
   **/

  getRoleName(name: string) {
    const obj = ROLE_LIST.find(item => item.name === name);
    return obj.label;
  }

  /** Handler when Edit icon in table row is clicked
   ** This function get cms user item as parameter, show modal to edit content,
   ** buid logic after modal is closed.
   * @param CmsUser item
   * @return
   **/

  onEdit(item: CmsUser) {
    const title = 'Edit CarBlip Team Member';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      CmsUsersEditModalComponent,
      {
        width: '720px',
        disableClose: false,
        data: { title: title, payload: item, type: 'edit' },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        // If user press cancel
        this.service$.isRoundRobinAllow = false;
        return;
      }
      this.service$.isRoundRobinAllow = false;
      this.store$.dispatch(new actions.UpdateSuccess(res));
    });
  }

  /** Handler when Delete icon in table row is clicked
   ** This function gets cms user item as parameter, calll delete action with select row id.
   * @param CmsUser item
   * @return
   **/

  onDelete(item: CmsUser) {
    this.confirmService$
      .confirm({
        message: `Are you sure you want to delete the user '${item.first_name
          }'?`,
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

  /** Check if action buttons need to be shown
   * @param CmsUser item
   * @return
   **/

  showAction(item: CmsUser) {
    if (this.userProfile && item.roles) {
      const userRole = this.userProfile.roles[0].id;
      const itemRole = item.roles[0].id;
      return itemRole > userRole;
    } else {
      return false;
    }
  }

  showRRCheckbox(item) {
    return (
      item && item.roles && (item.roles[0].id === 4 || item.roles[0].id === 5)
    );
  }

  showToggle(item) {
    return (
      item && item.roles && item.roles[0].id != 1
    );
  }

  onRRApply(item) {
    let alertMsg = 'Are you sure you want to add this user to RoundRobin rule?';
    if (item.roundrobin) {
      alertMsg =
        'Are you sure you want to remove this user to RoundRobin rule?';
    }
    this.confirmService$
      .confirm({
        message: alertMsg,
      })
      .subscribe(res => {
        if (res) { 
          if(!item.roundrobin) {
            this.service$.isRoundRobinAllow = true; 
            this.onEdit(item);
          } else {
            this.service$.isRoundRobinAllow = false;
            const payload = {
              id: item.id,
              status: !item.roundrobin,
            };
            this.store$.dispatch(new actions.UpdateRR(payload));
          }
        }
      });
    return false;
  }

  toggleIsUserActive(e, item: CmsUser) {
    const is_active = item.is_active
    if (is_active) {
      e.source.checked = true;
      this.confirmService$
        .confirm({
          message: `Are you sure you want to deactivate the user '${item.first_name
            }'?`,
        })
        .subscribe(res => {
          if (res) {
            this.toggleUser(item);
          }
        });
    } else {
      e.source.checked = false;
      this.toggleUser(item);
    }
  }

  toggleUser(item: CmsUser) {
    const is_active = !item.is_active
    const payload = {
      id: item.id,
      data: {
        is_active: is_active,
      },
    };

    this.store$.dispatch(new actions.Toggle(payload));
  }

  refreshTable() {
    this.changeDetectorRefs.detectChanges();
  }

  setPermission(role) {
    const { id } = role || { id: null }
    if (id == 1 || id == 2 || id == 4) {
      this.edit_delete_permission = true;
    }
    else {
      this.edit_delete_permission = false;
    }
  }
}
