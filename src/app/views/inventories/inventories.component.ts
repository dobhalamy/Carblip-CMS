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
import { combineLatest, fromEvent, Observable, of, Subject } from 'rxjs';
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
import { getYearArray } from 'app/shared/helpers/utils';
import { getCookie, setCookie } from 'app/shared/helpers/utils';
import * as commonModels from 'app/shared/models/common.model';
import { TablePagination, Year } from 'app/shared/models/common.model';
import * as inventoriesModels from 'app/shared/models/inventory.model';
import { Inventory } from 'app/shared/models/inventory.model';
import { MDealer } from 'app/shared/models/mdealer.model';
import { Make } from 'app/shared/models/mmake.model';
import { Model } from 'app/shared/models/mmodel.model';
import { InventoryService } from 'app/shared/services/apis/inventories.service';
import { MDealerService } from 'app/shared/services/apis/mdealer.service';
import { MMakeService } from 'app/shared/services/apis/mmake.service';
import { MModelService } from 'app/shared/services/apis/mmodel.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { AppState } from 'app/store/';
import * as actions from 'app/store/inventories/inventories.actions';
import {
  didFetchSelector,
  fetchingSelector,
  filterSelector,
  metaSelector,
} from 'app/store/inventories/inventories.selectors';
import { initialState } from 'app/store/inventories/inventories.states';
import { NgxRolesService } from 'ngx-permissions';

@Component({
  selector: 'app-inventories',
  templateUrl: './inventories.component.html',
  styleUrls: ['./inventories.component.scss'],
  animations: egretAnimations,
})
export class InventoriesComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput: ElementRef;

  private onDestroy$ = new Subject<void>();

  public filter$: Observable<any>;
  public meta$: Observable<any>;
  public fetching$: Observable<any>;

  public filter: inventoriesModels.Filter = initialState.filter;
  public meta: commonModels.Meta = initialState.meta;
  public search = '';

  public tablePagination: TablePagination = {
    length: initialState.meta.total,
    pageIndex: initialState.filter.page,
    pageSize: initialState.filter.per_page,
    previousPageIndex: 0,
  };

  public filterForm: FormGroup;
  public isLogLoading: Boolean = false;

  public dealers: Array<MDealer>;
  public dealerFilterCtrl: FormControl = new FormControl();
  public filteredDealers: Array<MDealer>;

  public years: Array<Year> = getYearArray(-50);
  public yearFilterCtrl: FormControl = new FormControl();
  public filteredYears: Array<Year>;

  public makes: Array<Make>;
  public makeFilterCtrl: FormControl = new FormControl();
  public filteredMakes: Array<Make>;

  public models: Array<Model>;
  public modelFilterCtrl: FormControl = new FormControl();
  public filteredModels: Array<Model>;

  public trims: Array<Inventory>;
  public trimFilterCtrl: FormControl = new FormControl();
  public filteredTrims: Array<Inventory>;

  private isSubmitted = false;

  constructor(
    private store$: Store<AppState>,
    private dialog: MatDialog,
    private rolesService$: NgxRolesService,
    private fb: FormBuilder,
    private service$: InventoryService,
    private dealerService$: MDealerService,
    private makeService$: MMakeService,
    private modelService$: MModelService,
    private changeDetectorRefs: ChangeDetectorRef,
    private snack$: MatSnackBar,
    private router$: Router,
    private loader$: AppLoaderService
  ) {
    this.filter$ = this.store$.select(filterSelector);
    this.meta$ = this.store$.select(metaSelector);
    this.fetching$ = this.store$.select(fetchingSelector);

    this.filterForm = this.fb.group({
      year: [''],
      dealer: [''],
      make: [''],
      model: [''],
      trim: [''],
    });
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
    var per_page_limit = localStorage.getItem('inventory_module_limit');
    var selected_order_dir = localStorage.getItem('inventory_module_order_dir');
    var selected_order_by = localStorage.getItem('inventory_module_order_by');
    var selected_page_no = localStorage.getItem('inventory_module_page_count');
    var search_keyword = localStorage.getItem('inventory_module_search_keyword');

    var selected_filter_model = localStorage.getItem('advance_inventory_filter_model');
    var selected_filter_year = localStorage.getItem('advance_inventory_filter_year');
    var selected_filter_make = localStorage.getItem('advance_inventory_filter_make');
    var selected_filter_dealer = localStorage.getItem('advance_inventory_filter_dealer');
    var advance_inventory_filter_trim = localStorage.getItem('advance_inventory_filter_trim');
    
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
    }

    //Advance filter check
    {
      var data = { };
      this.filter["filter"] = data;

      if(selected_filter_make != undefined && selected_filter_make != null){
        this.filter["filter"]["make"] = Number(selected_filter_make);
        this.filterForm.get('make').setValue(Number(selected_filter_make));
        this.onMakeFilterChange(selected_filter_make);
      }

      if(selected_filter_model != undefined && selected_filter_model != null){
        this.filter["filter"]["model"] = Number(selected_filter_model);
        this.filterForm.get('model').setValue(Number(selected_filter_model));
        this.onModelFilterChange(selected_filter_model);
      }

      if(selected_filter_year != undefined && selected_filter_year != null){
        this.filter["filter"]["year"] = Number(selected_filter_year);
        this.filterForm.get('year').setValue(Number(selected_filter_year));
      }

      if(selected_filter_dealer != undefined && selected_filter_dealer != null){
        this.filter["filter"]["dealer"] = Number(selected_filter_dealer);
        this.filterForm.get('dealer').setValue(Number(selected_filter_dealer));
      }

      if(advance_inventory_filter_trim != undefined && advance_inventory_filter_trim != null){
        this.filter["filter"]["trim"] = Number(advance_inventory_filter_trim);
        this.filterForm.get('trim').setValue(Number(advance_inventory_filter_trim));
      }
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

    combineLatest(
      this.filter$,
      this.dealerService$.getAll(),
      this.makeService$.getAll()
    )
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$)
      )
      .subscribe(([filterData, dealerData, makeData]) => {
        this.initDealerFilter(dealerData);
        this.initMakeFilter(makeData);
        if (!deepEqual(this.filter, filterData)) {
          if(filterData.search != ""){
            localStorage.setItem("inventory_module_search_keyword", filterData.search);
          }else{
            localStorage.removeItem("inventory_module_search_keyword");
          }
          
          this.filter = filterData;
          this.initFilter();
        }
      });

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

    // listen for search field value changes for dealer
    this.dealerFilterCtrl.valueChanges
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.filterDealers();
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

    // listen for search field value changes for make
    this.modelFilterCtrl.valueChanges
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.filterModels();
      });

    // listen for search field value changes for trim
    this.trimFilterCtrl.valueChanges
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.filterTrims();
      });

    // listen for search field value changes for year
    this.yearFilterCtrl.valueChanges
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.filterYears();
      });

    this.initYearFilter();
  }

  initDealerFilter(dealerData) {
    if (!deepEqual(this.dealers, dealerData.data)) {
      this.dealers = dealerData.data;
      this.dealers.unshift({
        id: undefined,
        name: 'None',
      });
      this.filteredDealers = this.dealers.slice(0);
    }
  }

  initMakeFilter(makeData) {
    if (!deepEqual(this.makes, makeData.data)) {
      this.makes = makeData.data;
      this.makes.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      this.makes.unshift({
        id: undefined,
        name: 'None',
      });
      this.filteredMakes = this.makes.slice(0);
    }
  }

  initModelFilter(make) {
    this.filteredModels = [];
    this.filteredTrims = [];
    this.modelService$
      .getAll({
        make: make,
      })
      .subscribe(data => {
        this.models = data.data;
        this.models.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });
        this.models.unshift({
          id: undefined,
          name: 'None',
        });
        this.filteredModels = this.models.slice(0);
      });
  }

  initTrimFilter(model) {
    this.filteredTrims = [];
    this.service$
      .getAll({
        model: model,
      })
      .subscribe(data => {
        this.trims = data.data;
        this.trims.unshift({
          id: undefined,
          desc: 'None',
        });
        this.filteredTrims = this.trims.slice(0);
      });
  }

  initYearFilter() {
    this.years.unshift({
      id: undefined,
      name: 'None',
    });
    this.filteredYears = this.years.slice(0);
  }

  /** Filter dealers
   * @param Dealer item
   * @return
   **/

  filterDealers() {
    if (!this.dealers) {
      return;
    }
    // get the search keyword
    let search = this.dealerFilterCtrl.value;
    if (!search) {
      this.filteredDealers = this.dealers.slice(0);
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the dealers
    this.filteredDealers = this.dealers.filter(
      item => item.name.toLowerCase().indexOf(search) > -1
    );
    this.refreshTable();
  }

  /** Filter makes
   * @param Make item
   * @return
   **/

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
    this.refreshTable();
  }

  /** Filter trims
   * @param Make item
   * @return
   **/

  filterTrims() {
    if (!this.trims) {
      return;
    }
    // get the search keyword
    let search = this.trimFilterCtrl.value;
    if (!search) {
      this.filteredTrims = this.trims.slice(0);
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the makes
    this.filteredTrims = this.trims.filter(
      item => item.desc.toLowerCase().indexOf(search) > -1
    );
    this.refreshTable();
  }

  /** Filter models
   * @param Make item
   * @return
   **/

  filterModels() {
    this.filteredModels = [];
    if (!this.models) {
      return;
    }
    // get the search keyword
    let search = this.modelFilterCtrl.value;
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
    this.refreshTable();
  }

  /** Filter years
   * @param Number item
   * @return
   **/

  filterYears() {
    if (!this.years) {
      return;
    }
    // get the search keyword
    let search = this.yearFilterCtrl.value;
    if (!search) {
      this.filteredYears = this.years.slice(0);
      return;
    } else {
      search = search.toLowerCase();
    }

    // filter the banks
    this.filteredYears = this.years.filter(
      item => item.name.toLowerCase().indexOf(search) > -1
    );
    this.refreshTable();
  }

  initMeta() {
    this.tablePagination.length = this.meta.total;
    this.tablePagination.pageIndex = this.meta.current_page - 1;
    this.tablePagination.pageSize = this.meta.per_page;
  }

  initFilter() {
    this.search = this.filter.search;
    this.filterForm.patchValue({
      year: this.filter.filter.year,
      dealer: this.filter.filter.dealer,
      make: this.filter.filter.make,
      model: this.filter.filter.model,
      trim: this.filter.filter.trim,
    });
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
    localStorage.setItem('inventory_module_limit', event.pageSize);
    localStorage.setItem('inventory_module_page_count', data.page);

    this.updateFilter(data);
  }

  getInventoryFilter() {
    const inventoryFilter: inventoriesModels.InventoryFilter = {};
    if (this.filterForm.value.dealer) {
      inventoryFilter.dealer = this.filterForm.value.dealer;
    }
    if (this.filterForm.value.year) {
      inventoryFilter.year = this.filterForm.value.year;
    }
    if (this.filterForm.value.make) {
      inventoryFilter.make = this.filterForm.value.make;
    }
    if (this.filterForm.value.model) {
      inventoryFilter.model = this.filterForm.value.model;
    }
    if (this.filterForm.value.trim) {
      inventoryFilter.trim = this.filterForm.value.trim;
    }
    return inventoryFilter;
  }

  filterSubmit() {
    this.isSubmitted = true;
    const newFilter = {
      filter: this.getInventoryFilter(),
    };

    //Add advance filter data in local storage
    {
      //year
      if(newFilter.filter.year != undefined){
        localStorage.setItem("advance_inventory_filter_year", String(newFilter.filter.year));
      }else{
        localStorage.removeItem("advance_inventory_filter_year");
      }

      //make
      if(newFilter.filter.make != undefined){
        localStorage.setItem("advance_inventory_filter_make", String(newFilter.filter.make));
      }else{
        localStorage.removeItem("advance_inventory_filter_make");
      }

      //model
      if(newFilter.filter.model != undefined){
        localStorage.setItem("advance_inventory_filter_model", String(newFilter.filter.model));
      }else{
        localStorage.removeItem("advance_inventory_filter_model");
      }

      //contact owner
      if(newFilter.filter.dealer != undefined){
        localStorage.setItem("advance_inventory_filter_dealer", String(newFilter.filter.dealer));
      }else{
        localStorage.removeItem("advance_inventory_filter_dealer");
      }

      //source
      if(newFilter.filter.trim != undefined){
        localStorage.setItem("advance_inventory_filter_trim", String(newFilter.filter.trim));
      }else{
        localStorage.removeItem("advance_inventory_filter_trim");
      }

    }
    this.updateFilter(newFilter);
  }

  onMakeFilterChange(val) {
    this.initModelFilter(val);
  }

  onModelFilterChange(val) {
    this.initTrimFilter(val);
  }

  onResetFilter() {
    this.filterForm.patchValue({
      year: '',
      dealer: '',
      make: '',
      model: '',
      trim: '',
    });
    this.filterSubmit();
  }

  isResetAvailable() {
    return (
      this.isSubmitted &&
      (this.filterForm.value.dealer ||
        this.filterForm.value.year ||
        this.filterForm.value.make ||
        this.filterForm.value.model ||
        this.filterForm.value.trim)
    );
  }

  refreshTable() {
    this.changeDetectorRefs.detectChanges();
  }

  onRefresh() {
    this.loader$.open();
    setCookie('inventory-refresh', '1', 1);
    this.service$
      .fetchData()
      .pipe(
        takeUntil(this.onDestroy$),
        map(result => result),
        catchError(err => {
          return of(err);
        })
      )
      .subscribe(result => {
        this.loader$.close();
        if (result && result.data.message) {
          this.snack$.open(result.data.message, 'OK', {
            duration: 4000,
          });
        }
      });
    return false;
  }

  showRefreshButton() {
    const roles = this.rolesService$.getRoles();
    if (
      roles['admin'] ||
      roles['superadmin'] ||
      roles['administrative'] ||
      roles['manager']
    ) {
      return true;
    } else if ((roles['salesperson'] || roles['concierge']) && getCookie('inventory-refresh')) {
      return true;
    } else {
      return false;
    }
  }
}
