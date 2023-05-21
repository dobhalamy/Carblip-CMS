import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import { NgxRolesService } from 'ngx-permissions';
import { combineLatest, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, takeUntil, tap } from 'rxjs/operators';

import { ROLE_LIST } from 'app/core/constants';
import { formatPhoneNumber } from 'app/shared/helpers/utils';
import { CmsUser } from 'app/shared/models/cmsuser.model';
import { Profile } from 'app/shared/models/user.model';
import { UpdateUser, User } from 'app/shared/models/user.model';
import { CmsUserService } from 'app/shared/services/apis/cmsusers.service';
import { UserService } from 'app/shared/services/apis/users.service';
import { AppState } from 'app/store';
import {
  dataSelector as authDataSelector,
  didFetchSelector as authDidFetchSelector,
} from 'app/store/auth/authentication.selector';
import { GetList as cmsUsersGetList } from 'app/store/cmsusers/cmsusers.actions';
import { didFetchSelector as cmsUserDidFetch } from 'app/store/cmsusers/cmsusers.selectors';
import { initialState as cmsUserInitialState } from 'app/store/cmsusers/cmsusers.states';

import * as logActions from 'app/store/userlogs/userlogs.actions';
import { initialState as initialLogState } from 'app/store/userlogs/userlogs.states';

@Component({
  selector: 'app-users-table-edit-modal',
  templateUrl: './edit-modal.component.html',
  styleUrls: ['./edit-modal.component.scss'],
})
export class UsersEditModalComponent implements OnInit, OnDestroy {
  private onDestroy$ = new Subject<void>();

  public itemForm: FormGroup;
  public isActive: boolean;
  public type: string;
  public cmsUsers: Array<CmsUser> = [];
  public cmsUserFilterCtrl: FormControl = new FormControl();
  public filteredCmsUsers: Array<CmsUser> = [];
  public userProfile: Profile;
  public salespersonId: Number;
  public saving: Boolean = false;
  public saveButtonLabel;
  public contactOnwerIds: Array<Number>;
  public showCarsdirectFields:Boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<UsersEditModalComponent>,
    private changeDetectorRefs: ChangeDetectorRef,
    private fb: FormBuilder,
    private store$: Store<AppState>,
    private rolesService$: NgxRolesService,
    private service$: UserService,
    private cmsUserServicer$: CmsUserService
  ) {
    const contactOwnerRoles = ROLE_LIST.filter(
      item => item.name === 'salesperson' || item.name === 'concierge' || item.name === 'manager'
    );
    this.contactOnwerIds = contactOwnerRoles.map(item => item.id);
  }
  ngOnInit() {
    this.type = this.data.type;
    if (this.type === 'edit') {
      this.showCarsdirectFields=true;
      this.isActive = this.data.payload.is_active;
      this.saveButtonLabel = 'SAVE';
    } else {
      this.showCarsdirectFields=false;
      this.saveButtonLabel = 'CREATE';
      this.isActive = true;
    }
    this.buildItemForm(this.data.payload);

    this.store$
      .select(cmsUserDidFetch)
      .pipe(
        takeUntil(this.onDestroy$),
        tap(
          didFetch =>
            !didFetch &&
            this.store$.dispatch(
              new cmsUsersGetList(cmsUserInitialState.filter)
            )
        )
      )
      .subscribe();

    this.store$
      .select(authDataSelector)
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$)
      )
      .subscribe(profile => {
        if (profile) {
          this.userProfile = profile;
          this.buildItemForm(this.data.payload);
        }
      });

    // listen for search field value changes
    this.cmsUserFilterCtrl.valueChanges
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(() => {
        this.filterCmsUsers();
      });

    this.initCmsUsers();
  }

  initCmsUsers() {
    this.store$.select(authDataSelector).pipe(
      debounceTime(10),
      takeUntil(this.onDestroy$)).subscribe(profile => {
        if (profile) {
          let search = this.cmsUserFilterCtrl.value || '';
          this.userProfile = profile;
          if(this.userProfile.roles[0].id == 5 || this.userProfile.roles[0].id == 6) {
            this.contactOnwerIds = [this.userProfile.roles[0].id]
            search = this.userProfile.email
          }
          this.cmsUsers = [];
          // get the search keyword
          
          const cmsUserParam = {
            roles: this.contactOnwerIds,
            search,
          };
      
          this.cmsUserServicer$
            .getListByFilter(cmsUserParam)
            .subscribe(({ data }) => {
              this.cmsUsers = data;
              this.cmsUsers = this.cmsUsers.filter((cmsUser:any) => {
                return cmsUser.is_active == 1
              })
              this.filteredCmsUsers = this.cmsUsers.slice(0);
              if(this.userProfile.roles[0].id == 5 || this.userProfile.roles[0].id == 6) {
                if (this.type !== 'edit')  {
                  this.itemForm.get('contact_owner_email').setValue(this.userProfile.email); 
                }
              } else if (this.userProfile.roles[0].id == 4) {
                if (this.type !== 'edit')  {
                  this.itemForm.get('contact_owner_email').setValue(this.userProfile.email); 
                }
                let profile : any = this.userProfile;
                this.cmsUsers = this.cmsUsers.filter((cmsUser:any) => {
                  return cmsUser.location_id == profile.location_id
                })
                this.filteredCmsUsers = this.cmsUsers.slice(0);
              }
              this.refreshData();
            });
          }
      });
    // filter the makes
    }

  /** Filter Cms Users
   * @param
   * @return
   **/

  filterCmsUsers() {
    if (!this.cmsUsers) {
      return;
    }
    // get the search keyword
    let search = this.cmsUserFilterCtrl.value;
    if (!search) {
      this.filteredCmsUsers = this.cmsUsers.slice(0);
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the banks
    this.filteredCmsUsers = this.cmsUsers.filter(item => {
      const fullname = item.full_name;
      return fullname.toLowerCase().indexOf(search) > -1;
    });
  }

  buildItemForm(item: User) {
    const phoneNumber = formatPhoneNumber(item.phone);
    const formFields = {
      first_name: [item.first_name || '', Validators.required],
      last_name: [item.last_name || ''],
      phone: [phoneNumber['nationalNumber'], Validators.required],
      email_address: [item.email_address || '', Validators.required],
      contact_owner_email: [
        item.contact_owner_email || '',
        Validators.required,
      ],
      phone_preferred_contact: [item.phone_preferred_contact || ''],
      phone_preferred_time: [item.phone_preferred_time || ''],
      phone_preferred_type: [item.phone_preferred_type || ''],
      street_address: [item.street_address || ''],
      city: [item.city || ''],
      state: [item.state || ''],
      zip: [item.zip || ''],

    };
    this.itemForm = this.fb.group(formFields);
  }

  getFullName(item: CmsUser) {
    return item.full_name;
  }

  submit() {
    if (this.itemForm.valid) {
      this.saving = true;

      const phoneNumber = formatPhoneNumber(this.itemForm.value.phone);

      const payload: User = {
        first_name: this.itemForm.value.first_name,
        last_name: this.itemForm.value.last_name,
        phone: phoneNumber['number'],
        email_address: this.itemForm.value.email_address,
        contact_owner_email: this.itemForm.value.contact_owner_email,
        phone_preferred_contact:this.itemForm.value.phone_preferred_contact,
        phone_preferred_time: this.itemForm.value.phone_preferred_time,
        phone_preferred_type: this.itemForm.value.phone_preferred_type,
        street_address: this.itemForm.value.street_address,
        city: this.itemForm.value.city,
        state:this.itemForm.value.state,
        zip: this.itemForm.value.zip,
      };

      if (this.type === 'edit') {
        const userId = this.data.payload.id;

        this.service$
          .update(userId, payload)
          .pipe(
            takeUntil(this.onDestroy$),
            map(result => result),
            catchError(err => {
              return of(err);
            })
          )
          .subscribe(res => {
            this.saving = false;
            if (!res.error) {
              const { data } = res;
              this.dialogRef.close(data);
            }
          });
      } else {
        payload.source = 3;
        this.service$
          .create(payload)
          .pipe(
            takeUntil(this.onDestroy$),
            map(result => result),
            catchError(err => {
              return of(err);
            })
          )
          .subscribe(res => {
            this.saving = false;
            if (!res.error) {
              const { data } = res;
              this.dialogRef.close(data);
            }
          });
      }
      this.store$.dispatch(new logActions.GetList(initialLogState.filter));
    }
  }

  isSalsPerson() {
    const roles = this.rolesService$.getRoles();
    return roles['salesperson'];
  }

  refreshData() {
    this.changeDetectorRefs.detectChanges();
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
