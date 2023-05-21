import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { Observable, Subject } from 'rxjs';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';

import { egretAnimations } from 'app/shared/animations/egret-animations';
import { formatPhoneNumber } from 'app/shared/helpers/utils';
import * as commonModels from 'app/shared/models/common.model';
import { User } from 'app/shared/models/user.model';
import { Profile } from 'app/shared/models/user.model';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { AppState } from 'app/store/';
import * as actions from 'app/store/users/users.actions';
import {
  dataSelector,
  didFetchSelector,
  metaSelector,
} from 'app/store/users/users.selectors';
import { initialState } from 'app/store/users/users.states';
import { NgxRolesService } from 'ngx-permissions';
import { UsersEditModalComponent } from './edit-modal/edit-modal.component';
import { dataSelector as profileDataSelector } from 'app/store/auth/authentication.selector';

@Component({
  selector: 'app-users-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.style.scss'],
  animations: egretAnimations,
})
export class UsersTableComponent implements OnInit, OnDestroy {
  columnHeaders: string[] = [
    'srNo',
    'first_name',
    'last_name',
    'phone',
    'email_address',
    'contact_owner',
    // 'phone_preferred_contact',
    // 'phone_preferred_type',
    'source',
    'created_at',
    'updated_at',
    'is_active',
    'actions',
  ];

  private onDestroy$ = new Subject<void>();

  public users$: Observable<any>;
  public meta$: Observable<any>;
  public didFetch$: Observable<any>;

  public users: Array<User> = [];
  public meta: commonModels.Meta;
  public offset: number;
  public userProfile: Profile;

  public sortKey:string;
  public sortDirection:string;

  constructor(
    private store$: Store<AppState>,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private confirmService$: AppConfirmService,
    private rolesService$: NgxRolesService
  ) {
    this.users$ = this.store$.select(dataSelector);
    this.meta$ = this.store$.select(metaSelector);
    this.didFetch$ = this.store$.select(didFetchSelector);
    this.offset = 1;

    this.sortKey = localStorage.getItem("user_module_order_by");
    this.sortDirection=localStorage.getItem("user_module_order_dir");
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
        })
      )
      .subscribe();

    this.users$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(users => {
          if (!deepEqual(this.users, users)) {
            this.users = users;
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
    localStorage.setItem("user_module_order_by", event.active);
    localStorage.setItem("user_module_order_dir", event.direction);

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

  onEdit(item: User) {
    const title = 'Edit User';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      UsersEditModalComponent,
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

  onDelete(item: User) {
    this.confirmService$
      .confirm({
        message: `Are you sure you wish to delete this user '${item.first_name
          }'? This is permanent and cannot be undone.`,
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

  showEditButton(item: User) {
    const roles = this.rolesService$.getRoles();
    // if (!roles['salesperson'] || item.contact_owner_email == this.userProfile.email) {
    //   return true;
    // }
    // else {
    //   return false;
    // }
    return true;
  }

  showDeleteButton(item: User) {
    const roles = this.rolesService$.getRoles();
    if (roles['superadmin'] || roles['admin']) {
      return true;
    } else {
      return false;
    }
  }

  toggleIsUserActive(e, item: User) {
    const is_active = item.is_active;
    if (is_active) {
      e.source.checked = true;
      this.confirmService$
        .confirm({
          message: `Are you sure you want to deactivate user '${item.first_name
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

  toggleUser(item: User) {
    const is_active = !item.is_active;
    const payload = {
      id: item.id,
      data: {
        is_active: is_active,
      },
    };

    this.store$.dispatch(new actions.Toggle(payload));
  }

}
