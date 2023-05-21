import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
	FormBuilder,
	FormControl,
	FormGroup,
	Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import { dataSelector as locationDataSelector } from 'app/store/locations/locations.selectors';
import { CustomValidators } from 'ng2-validation';
import { NgxRolesService } from 'ngx-permissions';
import { of, Subject } from 'rxjs';
import { catchError, map, takeUntil, tap } from 'rxjs/operators';

import { ROLE_LIST } from 'app/core/constants';
import { formatPhoneNumber } from 'app/shared/helpers/utils';
import { CmsUser, UpdateCmsUser } from 'app/shared/models/cmsuser.model';
import { Role } from 'app/shared/models/cmsuser.model';
import { Location } from 'app/shared/models/location.model';
import { Profile } from 'app/shared/models/user.model';
import { CmsUserService } from 'app/shared/services/apis/cmsusers.service';
import { AppState } from 'app/store';
import { dataSelector as profileDataSelector } from 'app/store/auth/authentication.selector';
import { GetList as locationsGetList } from 'app/store/locations/locations.actions';
import * as logActions from 'app/store/cmsuserlogs/cmsuserlogs.actions';
import { initialState as initialLogState } from 'app/store/cmsuserlogs/cmsuserlogs.states';
import * as actions from 'app/store/cmsusers/cmsusers.actions';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';

@Component({
	selector: 'app-cmsusers-table-edit-modal',
	templateUrl: './edit-modal.component.html',
	styleUrls: ['./edit-modal.component.scss'],
})

/**
	** Component for Add/Edit Cms User
	**/
export class CmsUsersEditModalComponent implements OnInit, OnDestroy {
	private onDestroy$ = new Subject<void>();

	public itemForm: FormGroup;
	public isActive: boolean;
	public type: string;
	public roles: Array<any> = [];
	public locations: Array<Location>;
	public locationFilterCtrl: FormControl = new FormControl();
	public filteredLocations: Array<Location>;
	public userProfile: Profile;
	public saving: Boolean = false;
	public saveButtonLabel;
	public showPromocodeAdd: boolean = false;
	public showPromocodeDisable: boolean = false;
	public showPromocodeEdit: boolean = false;

	rrweekdays=[
		{ "id" : 0, "value": 'Sun', status: false },
		{ "id" : 1, "value": 'Mon', status: false },
		{ "id" : 2, "value": 'Tue', status: false },
		{ "id" : 3, "value": 'Wed', status: false },
		{ "id" : 4, "value": 'Thu', status: false },
		{ "id" : 5, "value": 'Fri', status: false },
		{ "id" : 6, "value": 'Sat', status: false }
	  ];
	  typeOfLimit = [
		  { "id" : 'D', "value": 'Day' },
		  { "id" : 'W', "value": 'Week' },
		  { "id" : 'M', "value": 'Month' },
		];
		listOfSources: [] = [];
	showRRSection: boolean = false;
	totalAssigned: number = 0;
	defaultUserEmail: any = '';
	defaultUser: boolean = false;
	constructor(
		@Inject(MAT_DIALOG_DATA) public data: any,
		public dialogRef: MatDialogRef<CmsUsersEditModalComponent>,
		private fb: FormBuilder,
		private store$: Store<AppState>,
		private rolesService$: NgxRolesService,
		private service$: CmsUserService,
		private confirmService$: AppConfirmService,
	) { }
	ngOnInit() {
		this.type = this.data.type;
		if(this.service$.isRoundRobinAllow) {
			this.showRRSection = true;
		} else {
			this.showRRSection = false;
		}
		if (this.type === 'edit') {
			this.saveButtonLabel = 'SAVE';
		} else {
			this.saveButtonLabel = 'CREATE';
		}

		this.store$
			.select(profileDataSelector)
			.pipe(
				takeUntil(this.onDestroy$),
				tap((profile: Profile) => {
					this.userProfile = profile;
					const userRoleId = this.userProfile.roles[0].id;
					this.roles = ROLE_LIST.filter(item => item.id >= userRoleId);
				})
			)
			.subscribe();

		this.store$
			.select(locationDataSelector)
			.pipe(
				takeUntil(this.onDestroy$),
				tap(data => {
					this.locations = data;
					this.filteredLocations = this.locations.slice(0);
					if(this.data.payload.roundrobin) { this.showRRSection = true }
					this.buildItemForm(this.data.payload);
				})
			)
			.subscribe();

		// listen for search field value changes
		this.locationFilterCtrl.valueChanges
			.pipe(takeUntil(this.onDestroy$))
			.subscribe(() => {
				this.filterLocations();
			});
	}

	/** Filter locations
		* @param CmsUser item
		* @return
		**/

	filterLocations() {
		if (!this.locations) {
			return;
		}
		// get the search keyword
		let search = this.locationFilterCtrl.value;
		if (!search) {
			this.filteredLocations = this.locations.slice(0);
			return;
		} else {
			search = search.toLowerCase();
		}
		// filter the banks
		this.filteredLocations = this.locations.filter(
			item => item.name.toLowerCase().indexOf(search) > -1
		);
	}
	onRoleChange(value) {
		(value == 'salesperson' || value == 'concierge' || value == 'manager') ? this.itemForm.get('promo_code').enable() : this.itemForm.get('promo_code').disable();
	}

	/** Build form validation from input
		** This funciton is genreate from group object which is used to validation form elements,
		** set default values to form elements. We use custom validatior for password and password_confirm.
		* @param CmsUser item
		* @return
		**/

	buildItemForm(item: CmsUser) {
		let role = null,
			location = null;
		if (item.roles) {
			role = item.roles[0].name;
			this.showPromocodeEdit = (role == 'salesperson' || role == 'manager' || role == 'concierge') ? true : false;
		}
		if (item.location) {
			location = item.location.id;
		}

		/** If user role is manager, and modal is for `add` type,
			* Set default location and role
			*/

		const roles = this.rolesService$.getRoles();
		// this.showPromocodeAdd=(roles.salesperson || roles.manager) ? true :false;
		this.showPromocodeAdd = true;
		if (roles.manager && this.type !== 'edit') {
			location = this.userProfile.location.id;
			role = 'salesperson'; // Default role id for salesperson
		}

		let password = new FormControl('', [
			Validators.required,
			Validators.minLength(6),
		]);
		if (this.type === 'edit') {
			password = new FormControl('', [Validators.minLength(6)]);
		}
		const confirmPassword = new FormControl('', [
			CustomValidators.equalTo(password),
			Validators.minLength(6),
		]);
		this.getAllsource();
		const formFields = {
			first_name: [item.first_name || '', Validators.required],
			last_name: [item.last_name || ''],
			email: [item.email || '', Validators.required],
			role: [role || '', Validators.required],
			location: [location || '', Validators.required],
			promo_code: [item.promo_code || ''],
			password: password,
			confirmPassword: confirmPassword,
			limit: [''],
			source: [''],
			typeoflimit: [''],
			days: [''],
			isDefault: ['']
		};
		this.itemForm = this.fb.group(formFields);
    this.itemForm.get('role').valueChanges
      .subscribe((roleValue) => {
        if (roleValue == 'salesperson' || roleValue == 'manager' || roleValue == 'concierge') {
          this.itemForm.get('promo_code').enable();
        } else {
          this.itemForm.get('promo_code').disable();
        }
      });

      if (  this.itemForm.value.role == 'salesperson' ||   this.itemForm.value.role == 'manager' || this.itemForm.value.role == 'concierge') {
        this.itemForm.get('promo_code').enable();
      } else {
        this.itemForm.get('promo_code').disable();
      }
	 if(this.showRRSection) {
		this.itemForm.get('limit').setValidators(Validators.required);
		this.itemForm.get('source').setValidators(Validators.required);
		this.itemForm.get('typeoflimit').setValidators(Validators.required);
		this.itemForm.get('days').setValidators(Validators.required);

		this.service$.getrrSchedule(item.email).subscribe((res:any)=>{
			if(res.data.length) {
				let data = res.data[0];	
				this.totalAssigned = data.totalassigned;	
				this.itemForm.patchValue(
					{
						limit:data.limit, 
						source: data.source, 
						typeoflimit: data.typeoflimit,
						days: data.days,
						isDefault: data.isDefault
					})
					this.defaultUser = data.isDefault == 0 ? false : true;
					if(data.days !== null) {
						data.days.map(v=> { this.getDays(v); })
						this.str = data.days.join();
					}
			}else{
			}
		  });
	 }
	}

	getDays(id:any) {
		this.rrweekdays.map(val => { if(val.id == id) { val.status = true }})
	}

	/** Submit user input
		* @param
		* @return
		**/

	submit() {
		const formsValue = this.itemForm.getRawValue();
		const roleSelected = this.roles.find(
			item => item.name === formsValue.role
		);

		if (this.itemForm.valid) {
			if (formsValue.promo_code && formsValue.promo_code.length > 0) {
				formsValue.promo_code = formsValue.promo_code.trim();
			}
			let payload: UpdateCmsUser = {
				first_name: formsValue.first_name,
				last_name: formsValue.last_name,
				email: formsValue.email,
				role_id: roleSelected.id,
				location_id: formsValue.location,
				promo_code: (formsValue.promo_code).toString().toUpperCase()
			};

			let rrPayload = {
				email: formsValue.email,
				limit: formsValue.limit,
				source: formsValue.source,
				typeoflimit: formsValue.typeoflimit,
				days: formsValue.days
			}

			if (formsValue.password) {
				payload = {
					...payload,
					password: formsValue.password,
					password_confirmation: formsValue.password_confirmation,
				};
			}

			this.saving = true;
			if (this.type === 'edit') {
				const cmsUserId = this.data.payload.id;
				if(this.showRRSection) {
					const payloadUpdateRR = {
						id: cmsUserId,
						status: true,
					  };
					this.store$.dispatch(new actions.UpdateRR(payloadUpdateRR));
					setTimeout(() => {
						this.service$.updateRRSchedule(rrPayload).pipe(
							takeUntil(this.onDestroy$),
							map(result => result),
							catchError(err => {
								return of(err);
							})
						).subscribe(res => {
							if (!res.error) {
								if(this.itemForm.controls['isDefault'].value == 1 && this.defaultUserEmail !== '') {
									this.service$.makeAsDefaultUser(this.defaultUserEmail).pipe(
										takeUntil(this.onDestroy$),
										map(result => result),
										catchError(err => {
											return of(err);
										})
									)
									.subscribe(res => {
										if (!res.error) {
										}
									});
								}
								this.service$
								.update(cmsUserId, payload)
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
						});
					}, 1000);
					
				} else {
					this.service$
					.update(cmsUserId, payload)
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
			} else {
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

	ngOnDestroy() {
		this.onDestroy$.next();
		this.onDestroy$.complete();
	}

	/** get all Source
	* @param
	* @return
	**/
	getAllsource(){
		this.service$.getsource().subscribe((res:any)=>{
			if(res.statusCode == 200 && res.data) {
				this.listOfSources = res.data;
			}
		});
	}

	str = ''
	selectDays($event: any) {
		if($event.checked) {
			let val = $event.source.value;
			this.str = val + ',' + this.str;
		} else {
			let isFound = this.str.search($event.source.value);
			if(isFound !== -1) {
				this.str = this.str.replace($event.source.value,'');
			}	
		}
		let days = this.str.split(',').map( item => {
			if(item !== ''){
				return parseInt(item, 10);
			}
		});
		days = days.filter(day => { return day!=undefined })
		this.itemForm.patchValue({days: days});
	}
	
	onSetAsDefault() {
		if (!this.defaultUser) {
		let alertMsg = 'Are you sure you want to make this user as a default?';
		if(this.itemForm.controls['isDefault'].value == 1) {
			alertMsg = 'Are you sure you want to remove default user?';
		}
		this.confirmService$.confirm({ message: alertMsg}).subscribe(res => {
			if (res) {
				if(this.itemForm.controls['isDefault'].value == 0 || this.itemForm.controls['isDefault'].value == "") {
					this.defaultUserEmail = this.itemForm.controls['email'].value;
					this.itemForm.patchValue({isDefault: 1});	
				} else {
					this.defaultUserEmail = '';
					this.itemForm.patchValue({isDefault: 0});
				}
			} else {
				
			}
		  });
		return false;
	  }
	}
}
