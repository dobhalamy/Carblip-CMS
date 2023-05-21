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
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { environment } from 'environments/environment';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
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

import { Router } from '@angular/router';
import { ROLE_LIST } from 'app/core/constants';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { CmsUser } from 'app/shared/models/cmsuser.model';
import { TablePagination } from 'app/shared/models/common.model';
import * as commonModels from 'app/shared/models/common.model';
import { Location } from 'app/shared/models/location.model';
import {
  Filter as LogFilter,
  Log,
  LogResponse,
} from 'app/shared/models/log.model';
import { Request } from 'app/shared/models/request.model';
import * as requestsModels from 'app/shared/models/request.model';
import { ExportService } from 'app/shared/services/apis/export.service';
import { RequestService } from 'app/shared/services/apis/requests.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import {
  DateTimeService,
  IDateRangeSelection,
} from 'app/shared/services/date-time.service';
import { AppState } from 'app/store/';
import { dataSelector as cmsUserDataSelector } from 'app/store/cmsusers/cmsusers.selectors';
import { dataSelector as locationDataSelector } from 'app/store/locations/locations.selectors';
import * as logActions from 'app/store/requestlogs/requestlogs.actions';
import {
  dataSelector as logDataSelector,
  didFetchSelector as logDidFetchSelector,
  fetchingSelector as logFetchingSelector,
  filterSelector as logFilterSelector,
  metaSelector as logMetaSelector,
} from 'app/store/requestlogs/requestlogs.selectors';
import { initialState as initialLogState } from 'app/store/requestlogs/requestlogs.states';
import * as actions from 'app/store/requests/requests.actions';
import {
  didFetchSelector,
  fetchingSelector,
  filterSelector,
  metaSelector,
  YearsDataSelector,
  YearsDataSelector as yearselector,
} from 'app/store/requests/requests.selectors';
import { initialState } from 'app/store/requests/requests.states';
import { NgxRolesService } from 'ngx-permissions';
import { Brand, Model } from 'app/shared/models/vehicle.model';
import { VModelService } from 'app/shared/services/apis/vmodel.service';
import { VBrandService } from 'app/shared/services/apis/vbrand.service';
import { VehicleService } from 'app/shared/services/apis/vehicle.service';
import * as moment from 'moment-timezone';
import { CmsUserService } from 'app/shared/services/apis/cmsusers.service';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss'],
  animations: egretAnimations,
})
export class RequestsComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput: ElementRef;
  @ViewChild('searchLogInput') searchLogInput: ElementRef;

  private onDestroy$ = new Subject<void>();

  public filter$: Observable<any>;
  public yearFilter$: Observable<any>;
  public meta$: Observable<any>;
  public didFetch$: Observable<any>;
  public fetching$: Observable<any>;

  public logs$: Observable<any>;
  public logFilter$: Observable<any>;
  public logMeta$: Observable<any>;
  public logDidFetch$: Observable<any>;
  public logFetching$: Observable<any>;
  public yearFetching$: Observable<any>;
  public isSubscribedToEmailsMessage : Observable<any>;
  public filter: commonModels.Filter = initialState.filter;
  public meta: commonModels.Meta = initialState.meta;
  public search = '';

  public logFilter: LogFilter = initialLogState.filter;
  public logMeta: commonModels.Meta = initialLogState.meta;
  public logSearch = '';

  public tablePagination: TablePagination = {
    length: initialState.meta.total,
    pageIndex: initialState.filter.page,
    pageSize: initialState.filter.per_page,
    previousPageIndex: 0,
  };

  public logPagination: TablePagination = {
    length: initialLogState.meta.total,
    pageIndex: initialLogState.filter.page,
    pageSize: initialLogState.filter.per_page,
    previousPageIndex: 0,
  };

  public daterrange = {
    begin: null,
    end: null,
  };
  public filterForm: FormGroup;

  public locations: Array<Location>;
  public locationFilterCtrl: FormControl = new FormControl();
  public filteredLocations: Array<Location>;

  public cmsUsers: Array<CmsUser>;
  public cmsUserFilterCtrl: FormControl = new FormControl();
  public filteredCmsUsers: Array<CmsUser>;
  public logs: Array<Log>;
  public isLogLoading: Boolean = false;
  public salespersonId: Number;

  public RequestYears: any;
	public yearFilterCtrl: FormControl = new FormControl();
	public filteredYears: [any];

  public makes: Array<Brand>;
	public makeFilterCtrl: FormControl = new FormControl();
	public filteredMakes: Array<Brand>;

	public models: Array<Model>;
	public modelFilterCtrl: FormControl = new FormControl();
	public filteredModels: Array<Model>;
  public yearFilter: any;

  public sources: any;
	public sourceFilterCtrl: FormControl = new FormControl();
	public filteredSourcess: [any];
  disableAllOptionInContactOwner: boolean = false;
  disableAllOptionInSource: boolean = false;

  constructor(
    private store$: Store<AppState>,
    private dialog: MatDialog,
    private rolesService$: NgxRolesService,
    private fb: FormBuilder,
    private service$: RequestService,
    private exportService$: ExportService,
    private changeDetectorRefs: ChangeDetectorRef,
    private snack$: MatSnackBar,
    private router$: Router,
    private loader$: AppLoaderService,
    private modelService$: VModelService,
    private brandService$: VBrandService,
    private vehicleService$: VehicleService,
    private cmsUserService$: CmsUserService
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
    this.yearFetching$ = this.store$.select(yearselector);

    this.filterForm = this.fb.group({
      location: [''],
      contact_owner: [''],
      year: null,
      make: null,
      model: null,
      source: null,
      referrals: null,
      closedwon: null
    });

    const salespersonObj = ROLE_LIST.find(item => item.name === 'salesperson' || item.name === 'concierge');
    this.salespersonId = salespersonObj.id;
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.store$.dispatch(new actions.ClearDetail());
    this.initData();
  }

  initData() {
    
    //Default date range picker value setting
    var selected_filter_start_date = localStorage.getItem('advance_request_filter_start_date');
    var selected_filter_end_date = localStorage.getItem('advance_request_filter_end_date');

    if(selected_filter_start_date != undefined && selected_filter_start_date != null && selected_filter_end_date != undefined && selected_filter_end_date != null){
      let start_date: any = moment(selected_filter_start_date);
      start_date = start_date._d;
      let end_date: any = moment(selected_filter_end_date);
      end_date = end_date._d;
      this.daterrange = {
        begin: start_date,
        end: end_date,
      };
    }

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
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(data => {
          if (!deepEqual(this.filter, data)) {
            if(data.search != ""){
              localStorage.setItem("requests_module_search_keyword", data.search);
            }else{
              localStorage.removeItem("requests_module_search_keyword");
            }

            this.filter = data;
            this.initFilter();
          }
        })
      )
      .subscribe();

    this.meta$
      .pipe(
        debounceTime(10),
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
            if(data.search != ""){
              localStorage.setItem("requests_log_module_search_keyword", data.search);
            }else{
              localStorage.removeItem("requests_log_module_search_keyword");
            }
            
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
    
    
    this.store$
      .select(locationDataSelector)
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(data => {
          this.locations = data;
          this.filteredLocations = this.locations.slice(0);
        })
      )
      .subscribe();
    
      //srouces for filter dropdown
    this.vehicleService$
      .getAlRequestSources()
      .subscribe(data => {
        this.sources = data.data || [];
        this.filteredSourcess = this.sources.slice(0);
        
      });
    // listen for search field value changes for location
    this.locationFilterCtrl.valueChanges
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.filterLocations();
      }); 

    this.cmsUserService$.getOwnerListByRole(2).subscribe(res=>{
      if(res){
        // this.cmsUsers = res.data.filter(x =>{
        //   if(x.roles){
        //       return x['roles'][0].id === this.salespersonId
        //   }
        // });
        this.cmsUsers = res.data;
        this.filteredCmsUsers = this.cmsUsers.slice(0);
      }
    }, error => {
      console.log("There are some errors. Please Check!", error);
    }); 
 
    this.yearFetching$
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap(RequestYears => {
          if (!deepEqual(this.RequestYears, RequestYears)) {
            this.filteredYears = RequestYears;
          }
          this.RequestYears = RequestYears;
        })
      )
      .subscribe();

    // listen for search field value changes for cms user
    this.cmsUserFilterCtrl.valueChanges
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.filterCmsUsers();
      });

    // listen for search field value changes for year
		this.yearFilterCtrl.valueChanges
      .pipe(
        debounceTime(100),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.filterYears();
      });

      // listen for search field value changes for make
      this.makeFilterCtrl.valueChanges
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.filterMakes();
      });

    // listen for search field value changes for model
    this.modelFilterCtrl.valueChanges
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.filterModels();
      });

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

  filterMakes() {
		if (!this.makes) {
			return;
		}
		// get the search keyword
		let search = this.makeFilterCtrl.value;
		if (!search) {
			this.filteredMakes = this.makes.slice(0);
			return;
		} else {
			search = search.toLowerCase();
		}
		// filter the makes
		this.filteredMakes = this.makes.filter(
			item => item.name.toLowerCase().indexOf(search) > -1
		);
	}

	filterModels() {
		if (!this.models) {
			return;
		}
		// get the search keyword
		let search = this.makeFilterCtrl.value
		if (!search) {
			this.filteredModels = this.models.slice(0);
			return;
		} else {
			search = search.toLowerCase();
		}
		// filter the makes
		this.filteredModels = this.models.filter(
			item => item.name.toLowerCase().indexOf(search) > -1
		);
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

	/** Filter years
		* @param Number item
		* @return
		**/

	filterYears() {
		if (!this.RequestYears) {
			return;
		}
		// get the search keyword
		let search = this.yearFilterCtrl.value;
		if (!search) {
			this.filteredYears = this.RequestYears.slice(0);
			return;
		} else {
			search = search.toString();
		}
    
		// filter the years
		this.filteredYears = this.RequestYears.filter(
			item => item.toString().indexOf(search) > -1
		);
    
	}
  selectedYear(data){
    if(data.value){
      this.initMakeFilter(data.value);
    }
    
  }
  selectedMake(data){
    if(data.value){
      this.initModelFilter();
    }
    
  }
  initMakeFilter(selectedYear) {
		this.makes = [];
		this.models = [];
		this.filteredMakes = [];
		this.filteredModels = [];

		const yearItem = selectedYear;
		if (yearItem) {
			this.vehicleService$
				.getAllBrandsByYear({
					year: selectedYear,
				})
				.subscribe(data => {
					this.makes = data.data || [];
					this.makes.sort((a, b) => {
						return a.name.localeCompare(b.name);
					});
					this.filteredMakes = this.makes.slice(0);
					
				});
		}
	}
  initModelFilter() {
		this.models = [];
		this.filteredModels = [];
		const makeItem =  this.filterForm.controls['make'].value;
		if (makeItem) {
			this.vehicleService$
				.getAllByModelsByBrandYear({
					brand_id: makeItem,
					year: this.filterForm.controls['year'].value,
				})
				.subscribe(data => {
					this.models = data.data || [];
					this.models.sort((a, b) => {
						return a.name.localeCompare(b.name);
					});
					this.filteredModels = this.models.slice(0);
				});
		}
	}

  /** Filter locations
   * @param Location item
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

  /** Filter Cms Users
   * @param CmsUser item
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
    this.filteredCmsUsers = this.cmsUsers.filter(
      item => item.full_name.toLowerCase().indexOf(search) > -1
    );
  }

  loadData() {
    var per_page_limit = localStorage.getItem('requests_module_limit');
    var selected_order_dir = localStorage.getItem('requests_module_order_dir');
    var selected_order_by = localStorage.getItem('requests_module_order_by');
    var selected_page_no = localStorage.getItem('requests_module_page_count');
    var search_keyword = localStorage.getItem('requests_module_search_keyword');

    var selected_filter_model = localStorage.getItem('advance_request_filter_model');
    var selected_filter_year = localStorage.getItem('advance_request_filter_year');
    var selected_filter_make = localStorage.getItem('advance_request_filter_make');
    var selected_filter_contact_owner = localStorage.getItem('advance_request_filter_contact_owner');
    var selected_filter_source = localStorage.getItem('advance_request_filter_source');
    var selected_filter_referrals = localStorage.getItem('advance_request_filter_referrals');
    var selected_filter_closed_won = localStorage.getItem('advance_request_filter_closed_won');
    var selected_filter_start_date = localStorage.getItem('advance_request_filter_start_date');
    var selected_filter_end_date = localStorage.getItem('advance_request_filter_end_date');

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

      this.loadLogs();
    }

    //Advance filter check
    {
      var data = { };
      this.filter["filter"] = data;

      if(selected_filter_model != undefined && selected_filter_model != null){
        this.filter["filter"]["model"] = selected_filter_model;
        this.filterForm.get('model').setValue(Number(selected_filter_model));
      }

      if(selected_filter_year != undefined && selected_filter_year != null){
        this.filter["filter"]["year"] = selected_filter_year;
        this.filterForm.get('year').setValue(Number(selected_filter_year));
      }

      if(selected_filter_make != undefined && selected_filter_make != null){
        this.filter["filter"]["make"] = selected_filter_make;
        this.initMakeFilter(Number(selected_filter_year));
        this.filterForm.get('make').setValue(Number(selected_filter_make));
        this.initModelFilter();
      }

      if(selected_filter_contact_owner != undefined && selected_filter_contact_owner != null && selected_filter_contact_owner != ""){
       if(selected_filter_contact_owner == '0') {
        this.filterForm.get('contact_owner').setValue([selected_filter_contact_owner]);
        this.filter["filter"]["contact_owner"] = selected_filter_contact_owner;
       } else {
        let arr = selected_filter_contact_owner.split(',').map(i=>Number(i))
        this.filterForm.get('contact_owner').setValue(arr);
        this.filter["filter"]["contact_owner"] = selected_filter_contact_owner;
       }
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

      if(selected_filter_referrals != undefined && selected_filter_referrals != null){
        this.filter["filter"]["referrals"] = selected_filter_referrals;
        this.filterForm.patchValue({referrals: [selected_filter_referrals]});
      }

      if(selected_filter_closed_won != undefined && selected_filter_closed_won != null){
        this.filter["filter"]["closed_won"] = selected_filter_closed_won;
        this.filterForm.patchValue({closedwon: selected_filter_closed_won});
      }

      if(selected_filter_start_date != undefined && selected_filter_start_date != null){
        this.filter["filter"]["start_date"] = moment(selected_filter_start_date).format('yyyy/MM/DD');
      }

      if(selected_filter_end_date != undefined && selected_filter_end_date != null){
        this.filter["filter"]["end_date"] = moment(selected_filter_end_date).format('yyyy/MM/DD');
      }
    }

    this.store$.dispatch(new actions.GetList(this.filter));
  }

  loadLogs() {
    var per_page_limit = localStorage.getItem('requests_log_module_limit');
    var selected_page_no = localStorage.getItem('requests_log_module_page_count');
    var log_search_keyword = localStorage.getItem('requests_log_module_search_keyword');

    //check base on previous select item
    {
      if(per_page_limit != undefined && per_page_limit != null){
        this.logFilter.per_page = Number(per_page_limit);
      }else{
        this.logFilter.per_page = 20;
      }

      if(selected_page_no != undefined && selected_page_no != null){
        this.logFilter.page = Number(selected_page_no);
      }else{
        this.logFilter.page = 1;
      }

      if(log_search_keyword != undefined && log_search_keyword != null){
        this.logFilter.search = log_search_keyword;
        this.logSearch = log_search_keyword;
      }else{
        this.logFilter.search = "";
        this.logSearch = "";
        this.updateLogFilter(this.logFilter);
      }
    }
    this.store$.dispatch(new logActions.GetList(this.logFilter));
  }

  initMeta() {
    this.tablePagination.length = this.meta.total;
    this.tablePagination.pageIndex = this.meta.current_page - 1;
    this.tablePagination.pageSize = this.meta.per_page;
  }

  initLogMeta() {
    this.logPagination.length = this.logMeta.total;
    this.logPagination.pageIndex = this.logMeta.current_page - 1;
    this.logPagination.pageSize = this.logMeta.per_page;
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
    localStorage.setItem('requests_module_limit', event.pageSize);
    localStorage.setItem('requests_module_page_count', data.page);
 
    this.updateFilter(data);
  }

  onLogPaginateChange(event) {
    const data = {
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    };
    
    //set value in local storage
    localStorage.setItem('requests_log_module_limit', event.pageSize);
    localStorage.setItem('requests_log_module_page_count', data.page);

    this.updateLogFilter(data);
  }

  updateLogFilter(data) {
    const updated_filter = {
      ...this.logFilter,
      ...data,
    };
    this.store$.dispatch(new logActions.UpdateFilter(updated_filter));
  }

  getRequestFilter() {
    const requestFilter: requestsModels.RequestFilter = {};
    if (this.daterrange.begin) {
      requestFilter.start_date = moment(this.daterrange.begin).format('yyyy/MM/DD');
    }
    if (this.daterrange.end) {
      requestFilter.end_date = moment(this.daterrange.end).format('yyyy/MM/DD');
    }
    if (this.filterForm.value.contact_owner) {
      requestFilter.contact_owner = this.filterForm.value.contact_owner;
    }
    if (this.filterForm.value.year) {
      requestFilter.year = this.filterForm.value.year;
    }
    if (this.filterForm.value.make) {
      requestFilter.make = this.filterForm.value.make;
    }
    if (this.filterForm.value.model) {
      requestFilter.model = this.filterForm.value.model;
    }
    if (this.filterForm.value.source) {
      requestFilter.source = this.filterForm.value.source;
    }
    if (this.filterForm.value.referrals) {
      requestFilter.referrals = this.filterForm.value.referrals;
    }
    if (this.filterForm.value.closedwon) {
      requestFilter.closedwon = this.filterForm.value.closedwon;
    }
    return requestFilter;
  }

  filterSubmit() {
    const newFilter = {
      filter: this.getRequestFilter(),
    };

    //Add advance filter data in local storage
    {
      //year
      if(newFilter.filter.year != undefined){
        localStorage.setItem("advance_request_filter_year", newFilter.filter.year);
      }else{
        localStorage.removeItem("advance_request_filter_year");
      }

      //make
      if(newFilter.filter.make != undefined){
        localStorage.setItem("advance_request_filter_make", newFilter.filter.make);
      }else{
        localStorage.removeItem("advance_request_filter_make");
      }

      //model
      if(newFilter.filter.model != undefined){
        localStorage.setItem("advance_request_filter_model", newFilter.filter.model);
      }else{
        localStorage.removeItem("advance_request_filter_model");
      }

      //contact owner
      if(newFilter.filter.contact_owner != undefined){
        localStorage.setItem("advance_request_filter_contact_owner", String(newFilter.filter.contact_owner));
      }else{
        localStorage.removeItem("advance_request_filter_contact_owner");
      }

      //source
      if(newFilter.filter.source != undefined){
        localStorage.setItem("advance_request_filter_source", newFilter.filter.source);
      }else{
        localStorage.removeItem("advance_request_filter_source");
      }

      //referrals
      if(newFilter.filter.referrals != undefined && newFilter.filter.referrals.length > 0 ){
        localStorage.setItem("advance_request_filter_referrals", newFilter.filter.referrals);
      }else{
        localStorage.removeItem("advance_request_filter_referrals");
      }
     
      //closed won
      if(newFilter.filter.closedwon != undefined && newFilter.filter.closedwon != null){
        localStorage.setItem("advance_request_filter_closed_won", newFilter.filter.closedwon);
      }else{
        localStorage.removeItem("advance_request_filter_closed_won");
      }

      //closed won
      if(newFilter.filter.closedwon != undefined && newFilter.filter.closedwon !== null){
        localStorage.setItem("advance_request_filter_closed_won", newFilter.filter.closedwon);
      }else{
        localStorage.removeItem("advance_request_filter_closed_won");
      }

      //date range start date
      if(newFilter.filter.start_date != undefined){
        localStorage.setItem("advance_request_filter_start_date", newFilter.filter.start_date);
      }else{
        localStorage.removeItem("advance_request_filter_start_date");
      }

      //end date
      if(newFilter.filter.end_date != undefined){
        localStorage.setItem("advance_request_filter_end_date", newFilter.filter.end_date);
      }else{
        localStorage.removeItem("advance_request_filter_end_date");
      }
    }

    this.updateFilter(newFilter);
  }

  onCalendarChange(selectedDateRange: IDateRangeSelection) {
    this.daterrange = DateTimeService.getDateRangeFromSelection(
      selectedDateRange
    );
  }

  refreshTable() {
    this.changeDetectorRefs.detectChanges();
  }

  onExport() {
    const filterParam: requestsModels.ExportFilter = {
      type: 'request',
      search: this.search,
      filter: this.getRequestFilter(),
      order_by: this.filter.order_by,
      order_dir: this.filter.order_dir,
    };
    this.loader$.open();
    this.exportService$
      .postRequest(filterParam)
      .pipe(
        takeUntil(this.onDestroy$),
        map(result => result),
        catchError(err => {
          return of(err);
        })
      )
      .subscribe(result => {
        this.loader$.close();
        if (result && result.data && result.data.token) {
          window.open(
            environment.apiUrl + '/export/download?token=' + result.data.token
          );
        } else {
          this.snack$.open('Something went wrong, Try again.', 'OK', {
            duration: 4000,
          });
        }
      });
    return false;
  }

  setRefCheckBox($event: any) {
    if($event) {
      this.filterForm.patchValue({referrals: ['WithRef']});
    } else {
      this.filterForm.controls['referrals'].patchValue(null);
    }
  }

  setClosedWonCheckBox($event: any) {
    if($event) {
      this.filterForm.patchValue({closedwon: 'closedWon'});
    } else {
      this.filterForm.controls['closedwon'].patchValue(null);
    }
  }

  checkAllContactOwner() {
    this.disableAllOptionInContactOwner = !this.disableAllOptionInContactOwner;
      let arr = this.filterForm.controls['contact_owner'].value;
      if(this.disableAllOptionInContactOwner) {
        arr = ['0']
      }
      this.filterForm.patchValue({contact_owner: arr})
  }

  checkAllSource() {
    this.disableAllOptionInSource = !this.disableAllOptionInSource;
      let arr = this.filterForm.controls['source'].value;
      if(this.disableAllOptionInSource) {
        arr = ['10']
      }
      this.filterForm.patchValue({source: arr})
  }
}
