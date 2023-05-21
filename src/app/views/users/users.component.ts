import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { fromEvent, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  takeUntil,
  tap,
} from 'rxjs/operators';
import * as _ from 'underscore';

import { egretAnimations } from 'app/shared/animations/egret-animations';

import { formatPhoneNumber } from 'app/shared/helpers/utils';
import * as commonModels from 'app/shared/models/common.model';
import { TablePagination } from 'app/shared/models/common.model';
import * as usersModels from 'app/shared/models/user.model';
import { AppState } from 'app/store/';
import * as actions from 'app/store/users/users.actions';
import {
  didFetchSelector,
  fetchingSelector,
  filterSelector,
  metaSelector,
} from 'app/store/users/users.selectors';
import {
  dataSelector as logDataSelector,
  didFetchSelector as logDidFetchSelector,
  fetchingSelector as logFetchingSelector,
  filterSelector as logFilterSelector,
  metaSelector as logMetaSelector,
} from 'app/store/userlogs/userlogs.selectors';
import { initialState } from 'app/store/users/users.states';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { NgxRolesService } from 'ngx-permissions';
import { UsersEditModalComponent } from './table/edit-modal/edit-modal.component';
import { DateTimeService, IDateRangeSelection } from 'app/shared/services/date-time.service';
import { dataSelector as cmsUserDataSelector } from 'app/store/cmsusers/cmsusers.selectors';
import { CmsUser } from 'app/shared/models/cmsuser.model';
import { ROLE_LIST } from 'app/core/constants';
import { UserService } from 'app/shared/services/apis/users.service'
import { initialState as initialLogState } from 'app/store/userlogs/userlogs.states';
import { Log, Filter as LogFilter, } from 'app/shared/models/log.model';
import * as logActions from 'app/store/userlogs/userlogs.actions';
import * as moment from 'moment-timezone';
import { CmsUserService } from 'app/shared/services/apis/cmsusers.service';
import { VehicleService } from 'app/shared/services/apis/vehicle.service';
@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  animations: egretAnimations,
})
export class UsersComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput: ElementRef;
  @ViewChild('searchLogInput') searchLogInput: ElementRef;

  private onDestroy$ = new Subject<void>();

  public filter$: Observable<any>;
  public meta$: Observable<any>;
  public didFetch$: Observable<any>;
  public fetching$: Observable<any>;

  public filter: commonModels.Filter = initialState.filter;
  public meta: commonModels.Meta = initialState.meta;
  public search = '';
  public salespersonId: Number;
  public tablePagination: TablePagination = {
    length: initialState.meta.total,
    pageIndex: initialState.filter.page,
    pageSize: initialState.filter.per_page,
    previousPageIndex: 0,
  };
  public daterrange = {
    begin: null,
    end: null,
  };
  public cmsUsers: Array<CmsUser>;
  public cmsUserFilterCtrl: FormControl = new FormControl();
  public filteredCmsUsers: Array<CmsUser>;
  public filterForm: FormGroup;
  eddate: string | Date
  stdate: string | Date
  
  // daterrange: import("/var/www/html/cms-web/src/app/shared/services/date-time.service").IDateRange;

  public logs$: Observable<any>;
  public logFilter$: Observable<any>;
  public logMeta$: Observable<any>;
  public logDidFetch$: Observable<any>;
  public logFetching$: Observable<any>;
  public yearFetching$: Observable<any>;

  public createdBy: any;
	public createdByFilterCtrl: FormControl = new FormControl();
	public filteredCreatedBy: [any];

  public logFilter: LogFilter = initialLogState.filter;
  public logMeta: commonModels.Meta = initialLogState.meta;
  public logSearch = '';
  public logs: Array<Log>;

  public logPagination: TablePagination = {
    length: initialLogState.meta.total,
    pageIndex: initialLogState.filter.page,
    pageSize: initialLogState.filter.per_page,
    previousPageIndex: 0,
  };
  
  public sources: any;
  public sourceFilterCtrl: FormControl = new FormControl();
  public localData: Array<any>;
  public filteredSourcess: [any];
  disableAllOptionInSource: boolean = false;

  constructor(
    private store$: Store<AppState>,
    private dialog: MatDialog,
    private rolesService$: NgxRolesService,
    private fb: FormBuilder,
    private userService$: UserService,
    private changeDetectorRefs: ChangeDetectorRef,
    private cmsUserService$: CmsUserService,
    private vehicleService$: VehicleService
   ) {
    this.filter$ = this.store$.select(filterSelector);
    this.meta$ = this.store$.select(metaSelector);
    this.didFetch$ = this.store$.select(didFetchSelector);
    this.fetching$ = this.store$.select(fetchingSelector);
    this.logs$ = this.store$.select(logDataSelector);
    this.logFilter$ = this.store$.select(logFilterSelector);
    this.logMeta$ = this.store$.select(logMetaSelector);
    this.logDidFetch$ = this.store$.select(logDidFetchSelector);
    this.logFetching$ = this.store$.select(logFetchingSelector);

    this.filterForm = this.fb.group({
      contact_owner: [''],
      start_date: null,
      end_date: null,
      first_name: null,
      last_name: null,
      phone: null,
      source: null,
      created_by: null,
    });
    const salespersonObj = ROLE_LIST.find(item => item.name === 'salesperson' || item.name === 'concierge');
    this.salespersonId = salespersonObj.id;
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    //Default date range picker value setting
    var selected_filter_start_date = localStorage.getItem('advance_user_filter_start_date');
    var selected_filter_end_date = localStorage.getItem('advance_user_filter_end_date');

    if(selected_filter_start_date != undefined && selected_filter_start_date != null && selected_filter_end_date != undefined && selected_filter_end_date != null){
      let start_date: any = moment(selected_filter_start_date);
      start_date = start_date._d;
      let end_date: any = moment(selected_filter_end_date);
      end_date = end_date._d;
      this.daterrange = {
        begin: start_date,
        end: end_date,
      }
    }

    this.store$.dispatch(new actions.ClearDetail());
    this.initData();
  }
  
  initData() {
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => {
          return event.target.value;
        }),
        filter(res => res.length > 2 || !res.length),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.onFilterChange();
      });

      fromEvent(this.searchLogInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => {
          return event.target.value;
        }),
        filter(res => res.length > 2 || !res.length),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.onLogFilterChange();
      });

    this.filter$
      .pipe(
        takeUntil(this.onDestroy$),
        tap(data => {
          if (!deepEqual(this.filter, data)) {
            if(data.search != ""){
              localStorage.setItem("user_module_search_keyword", data.search);
            }else{
              localStorage.removeItem("user_module_search_keyword");
            }
            
            this.filter = data;
            this.initFilter();
          }
        })
      )
      .subscribe();

    this.meta$
      .pipe(
        takeUntil(this.onDestroy$),
        tap(meta => {
          if (!deepEqual(this.meta, meta)) {
            this.meta = meta;
            this.initMeta();
          }
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

      this.logFilter$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(data => {
          if (!deepEqual(this.logFilter, data)) {
            this.logFilter = data;
            this.search = this.filter.search;
          }
        })
      )
      .subscribe();

    this.logMeta$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(meta => {
          if (!deepEqual(this.logMeta, meta)) {
            this.logMeta = meta;
            this.initLogMeta();
          }
        })
      )
      .subscribe();

    this.logDidFetch$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(didFetch => !didFetch && this.loadLogs())
      )
      .subscribe();

    this.logs$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(logs => {
          if (!deepEqual(this.logs, logs)) {
            this.logs = logs;
            this.refreshTable();
          }
        })
      )
      .subscribe();
    
  
      this.cmsUserService$.getOwnerListByRole(1).subscribe(res=>{
        if(res){
          this.cmsUsers = res.data;
          this.filteredCmsUsers = this.cmsUsers.slice(0);
        }
      }, error => {
        console.log("There are some errors. Please Check!", error);
      });  

          //srouces for filter dropdown
    this.vehicleService$
      .getAlRequestSources()
      .subscribe(data => {
        this.sources = data.data || [];
        this.filteredSourcess = this.sources.slice(0);
        
      });

    //listen for search field value changes for cms user
    this.cmsUserFilterCtrl.valueChanges
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.filterCmsUsers();
      });

    //createdby for filter dropdown
    this.userService$
      .getCreatedByList()
      .subscribe(data => {
        this.createdBy = data.data || [];
        this.filteredCreatedBy = this.createdBy.slice(0);
        
      });

    //listen for search field value changes for source
    this.createdByFilterCtrl.valueChanges
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.filterCreatedByUsers();
      });
  }

  /** Filter Created by Users
   * @param CmsUser item
   * @return
   **/

   filterCreatedByUsers() {
    if (!this.createdBy) {
      return;
    }
    //get the search keyword
    let search = this.cmsUserFilterCtrl.value;
    if (!search) {
      this.filteredCreatedBy = this.createdBy.slice(0);
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the banks
    this.filteredCreatedBy = this.createdBy.filter(
      item => item.full_name.toLowerCase().indexOf(search) > -1
    );
  }

  /** Filter Cms Users
   * @param CmsUser item
   * @return
   **/

  filterCmsUsers() {
    if (!this.cmsUsers) {
      return;
    }
    //get the search keyword
    let search = this.cmsUserFilterCtrl.value;

    if (!search) {
      this.filteredCmsUsers = this.cmsUsers.slice(0);
      return;
    } else {
      search = search.toLowerCase();
    }
    //filter the banks
    this.filteredCmsUsers = this.cmsUsers.filter(
      item => item.full_name.toLowerCase().indexOf(search) > -1
    );


     // listen for search field value changes for source
     this.sourceFilterCtrl.valueChanges
     .pipe(
       debounceTime(10),
       takeUntil(this.onDestroy$)
     )
     .subscribe(() => {
       this.filterSources();
     });
  }

  loadData() {
    var per_page_limit = localStorage.getItem('user_module_limit');
    var selected_order_dir = localStorage.getItem('user_module_order_dir');
    var selected_order_by = localStorage.getItem('user_module_order_by');
    var selected_page_no = localStorage.getItem('user_module_page_count');
    var search_keyword = localStorage.getItem('user_module_search_keyword');
    var selected_filter_first_name = localStorage.getItem('advance_user_filter_first_name');
    var selected_filter_last_name = localStorage.getItem('advance_user_filter_last_name');
    var selected_filter_contact_owner = localStorage.getItem('advance_user_filter_contact_owner');
    var selected_filter_source = localStorage.getItem('advance_user_filter_source');
    var selected_filter_phone = localStorage.getItem('advance_user_filter_phone');
    var selected_filter_created_by = localStorage.getItem('advance_user_filter_created_by');
    var selected_filter_start_date = localStorage.getItem('advance_user_filter_start_date');
    var selected_filter_end_date = localStorage.getItem('advance_user_filter_end_date');

    //check base on previous select item
    {
      if(per_page_limit != undefined && per_page_limit != null){
        this.filter.per_page = Number(per_page_limit);
      }else{
        this.filter.per_page = 20;
      }
    
      if(selected_order_by != undefined && selected_order_by != null && selected_order_by != "" && selected_order_dir != undefined && selected_order_dir != null && selected_order_dir != ""){
        this.filter.order_dir = selected_order_dir;
        this.filter.order_by = selected_order_by;
      }else{
        this.filter.order_dir = "desc";
        this.filter.order_by = "created_at";
      }

      if(selected_page_no != undefined && selected_page_no != null){
        this.filter.page = Number(selected_page_no);
      }else{
        this.filter.page = 1;
      }

      if(search_keyword != undefined && search_keyword != null){
        this.filter.search = search_keyword;
        this.search = search_keyword;
      }else{
        this.filter.search = "";
        this.search="";
      }

      //Advance filter check
      {
        var data = { };
        this.filter["filter"] = data;

        if(selected_filter_first_name != undefined && selected_filter_first_name != null){
          this.filter["filter"]["first_name"] = selected_filter_first_name;
          this.filterForm.get('first_name').setValue(selected_filter_first_name);
        }

        if(selected_filter_last_name != undefined && selected_filter_last_name != null){
          this.filter["filter"]["last_name"] = selected_filter_last_name;
          this.filterForm.get('last_name').setValue(selected_filter_last_name);
        }

        if(selected_filter_contact_owner != undefined && selected_filter_contact_owner != null){
          this.filterForm.get('contact_owner').setValue(selected_filter_contact_owner);
          this.filter["filter"]["contact_owner"] = selected_filter_contact_owner;
        }

        if(selected_filter_source != undefined && selected_filter_source != null && selected_filter_source != ""){
          if(selected_filter_source == '0') {
            this.filterForm.get('source').setValue([selected_filter_source]);
            this.filter["filter"]["source"] = selected_filter_source;
           } else {
            let arr = selected_filter_source.split(',').map(i=>Number(i))
            this.filterForm.get('source').setValue(arr);
            this.filter["filter"]["source"] = selected_filter_source;
           }
        }

        if(selected_filter_phone != undefined && selected_filter_phone != null){
          this.filter["filter"]["phone"] = selected_filter_phone;
          this.filterForm.get('phone').setValue(selected_filter_phone);
        }

        if(selected_filter_created_by != undefined && selected_filter_created_by != null){
          this.filterForm.get('created_by').setValue(Number(selected_filter_created_by));
          this.filter["filter"]["created_by"] = selected_filter_created_by;
        }

        if(selected_filter_start_date != undefined && selected_filter_start_date != null){
          this.filter["filter"]["start_date"] = moment(selected_filter_start_date).format('yyyy/MM/DD');         
        }

        if(selected_filter_end_date != undefined && selected_filter_end_date != null){
          this.filter["filter"]["end_date"] = moment(selected_filter_end_date).format('yyyy/MM/DD');
        }
      }
    }

    this.store$.dispatch(new actions.GetList(this.filter));
  }

  initMeta() {
    this.tablePagination.length = this.meta.total;
    this.tablePagination.pageIndex = this.meta.current_page - 1;
    this.tablePagination.pageSize = this.meta.per_page;
  }

  initFilter() {
    this.search = this.filter.search;
  }

  onFilterChange() {
    let data = {
      search: this.search,
    };
    if (this.search) {
      data = _.extend(data, {
        page: 1,
      });
    }
    this.updateFilter(data);
  }

  
  onLogFilterChange() {
    let data = {
      search: this.logSearch,
    };
    if (this.logSearch) {
      data = _.extend(data, {
        page: 1,
      });
    }
    this.updateLogFilter(data);
  }

  onLogPaginateChange(event) {
    const data = {
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    };
    this.updateLogFilter(data);
  }

  updateLogFilter(data) {
    const updated_filter = {
      ...this.logFilter,
      ...data,
    };
    this.store$.dispatch(new logActions.UpdateFilter(updated_filter));
  }

  initLogMeta() {
    this.logPagination.length = this.logMeta.total;
    this.logPagination.pageIndex = this.logMeta.current_page - 1;
    this.logPagination.pageSize = this.logMeta.per_page;
  }

  loadLogs() {
    this.store$.dispatch(new logActions.GetList(this.logFilter));
  }

  refreshTable() {
    this.changeDetectorRefs.detectChanges();
  }

  filterSources() {
		if (!this.sources) {
			return;
		}
		// get the search keyword
		let search = this.sourceFilterCtrl.value
		if (!search) {
			this.filteredSourcess = this.sources.slice(0);
			return;
		} else {
			search = search.toLowerCase();
		}
		// filter the makes
		this.filteredSourcess = this.sources.filter(
			item => item.toLowerCase().indexOf(search) > -1
		);
	}

  updateFilter(data) {
    const updated_filter = {
      ...this.filter,
      ...data,
    };
    this.store$.dispatch(new actions.UpdateFilter(updated_filter));
  }

  onPaginateChange(event) {
    const data = {
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    };

    //set value in local storage
    localStorage.setItem('user_module_limit', event.pageSize);
    localStorage.setItem('user_module_page_count', data.page);

    this.updateFilter(data);
  }

  getRequestFilter() {
    const requestFilter: usersModels.RequestFilter = {};

    if (this.filterForm.value.contact_owner) {
      requestFilter.contact_owner = this.filterForm.value.contact_owner;
    }
    if (this.filterForm.value.created_by) {
      requestFilter.created_by = this.filterForm.value.created_by;
    }
    if (this.filterForm.value.first_name) {
      requestFilter.first_name = this.filterForm.value.first_name;
    }
    if (this.filterForm.value.last_name) {
      requestFilter.last_name = this.filterForm.value.last_name;
    }
    if (this.filterForm.value.source) {
      requestFilter.source = this.filterForm.value.source;
    }
    if (this.filterForm.value.phone) {
      requestFilter.phone = this.filterForm.value.phone;
    }
    if (this.daterrange.begin) {
      requestFilter.start_date = this.daterrange.begin;
    }
    if (this.daterrange.end) {
      requestFilter.end_date = this.daterrange.end;
    }

    return requestFilter;
  }
  filterSubmit() {
    const newFilter = {
      filter: this.getRequestFilter(),
    };

    //Add advance filter data in local storage
    {
      //first name
      if(newFilter.filter.first_name != undefined){
        localStorage.setItem("advance_user_filter_first_name", newFilter.filter.first_name);
      }else{
        localStorage.removeItem("advance_user_filter_first_name");
      }

      //last name
      if(newFilter.filter.last_name != undefined){
        localStorage.setItem("advance_user_filter_last_name", newFilter.filter.last_name);
      }else{
        localStorage.removeItem("advance_user_filter_last_name");
      }

      //contact owner
      if(newFilter.filter.contact_owner != undefined){
        localStorage.setItem("advance_user_filter_contact_owner", String(newFilter.filter.contact_owner));
      }else{
        localStorage.removeItem("advance_user_filter_contact_owner");
      }

      //sources
      if(newFilter.filter.source != undefined){
        localStorage.setItem("advance_user_filter_source", String(newFilter.filter.source));
      }else{
        localStorage.removeItem("advance_user_filter_source");
      }
      
      //phone number
      if(newFilter.filter.phone != undefined){
        localStorage.setItem("advance_user_filter_phone", String(newFilter.filter.phone));
      }else{
        localStorage.removeItem("advance_user_filter_phone");
      }

      //start date
      if(newFilter.filter.start_date != undefined){
        localStorage.setItem("advance_user_filter_start_date", newFilter.filter.start_date);
      }

      //end date
      if(newFilter.filter.end_date != undefined){
        localStorage.setItem("advance_user_filter_end_date", newFilter.filter.end_date);
      }

      //created by 
      if(newFilter.filter.created_by != undefined){
        localStorage.setItem("advance_user_filter_created_by", String(newFilter.filter.created_by));
      }else{
        localStorage.removeItem("advance_user_filter_created_by");
      }
    }
    this.updateFilter(newFilter);
  }
  onCalendarChange(selectedDateRange: IDateRangeSelection) {
    if(selectedDateRange.start_date == undefined && selectedDateRange.end_date == undefined) {
      localStorage.removeItem('advance_user_filter_start_date');
      localStorage.removeItem('advance_user_filter_end_date');
    }
    this.daterrange = DateTimeService.getDateRangeFromSelection(
      selectedDateRange
    );
  }
  onAddItem() {
    const title = 'Add User';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      UsersEditModalComponent,
      {
        width: '720px',
        disableClose: false,
        data: { title: title, payload: {}, type: 'add' },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        // If user press cancel
        return;
      }
      // const phoneNumber = formatPhoneNumber(res.phone);

      // const payload: User = {
      //   first_name: res.first_name,
      //   last_name: res.last_name,
      //   email_address: res.email_address,
      //   contact_owner_email: res.contact_owner_email,
      //   phone: phoneNumber['number'],
      //   phone_verified: 1,
      //   lease_captured: 0,
      // };

      this.store$.dispatch(new actions.CreateSuccess(res));
    });
  }

  checkAllSource() {
    this.disableAllOptionInSource = !this.disableAllOptionInSource;
      let arr = this.filterForm.controls['source'].value;
      if(this.disableAllOptionInSource) {
        arr = ['10']
      }
      this.filterForm.patchValue({source: arr})
  }

  formatLogMessage(logMessage: string) {
    if(logMessage !== undefined) {
      let logMsgArray = logMessage.split(" ");
      if(logMsgArray[logMsgArray.length - 1] == "on") {
        return '';
      } else {
        return " on"
      }
    }
  }
}