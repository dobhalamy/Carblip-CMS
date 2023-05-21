import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { egretAnimations } from 'app/shared/animations/egret-animations';
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

import { formatPhoneNumber } from 'app/shared/helpers/utils';
import { TablePagination } from 'app/shared/models/common.model';
import * as commonModels from 'app/shared/models/common.model';
import { MDealer } from 'app/shared/models/mdealer.model';
import { MDealerService } from 'app/shared/services/apis/mdealer.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { AppState } from 'app/store/';
import * as actions from 'app/store/mdealers/mdealers.actions';
import {
  didFetchSelector,
  fetchingSelector,
  filterSelector,
  metaSelector,
} from 'app/store/mdealers/mdealers.selectors';
import { initialState } from 'app/store/mdealers/mdealers.states';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { NgxRolesService } from 'ngx-permissions';

@Component({
  selector: 'app-mdealers',
  templateUrl: './mdealers.component.html',
  styleUrls: ['./mdealers.component.scss'],
  animations: egretAnimations,
})
export class MDealersComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput: ElementRef;

  private onDestroy$ = new Subject<void>();

  public filter$: Observable<any>;
  public meta$: Observable<any>;
  public didFetch$: Observable<any>;
  public fetching$: Observable<any>;

  public filter: commonModels.Filter = initialState.filter;
  public meta: commonModels.Meta = initialState.meta;
  public search = '';

  public tablePagination: TablePagination = {
    length: initialState.meta.total,
    pageIndex: initialState.filter.page,
    pageSize: initialState.filter.per_page,
    previousPageIndex: 0,
  };

  constructor(
    private store$: Store<AppState>,
    private dialog: MatDialog,
    private loader$: AppLoaderService,
    private mDealerService$: MDealerService,
    private rolesService$: NgxRolesService,
    private snack$: MatSnackBar
  ) {
    this.filter$ = this.store$.select(filterSelector);
    this.meta$ = this.store$.select(metaSelector);
    this.didFetch$ = this.store$.select(didFetchSelector);
    this.fetching$ = this.store$.select(fetchingSelector);
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
    var per_page_limit = localStorage.getItem('m_portal_dealers_module_limit');
    var selected_order_dir = localStorage.getItem('m_portal_dealers_module_order_dir');
    var selected_order_by = localStorage.getItem('m_portal_dealers_module_order_by');
    var selected_page_no = localStorage.getItem('m_portal_dealers_module_page_count');
    var search_keyword = localStorage.getItem('m_portal_dealers_module_search_keyword');

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

    this.filter$
      .pipe(
        takeUntil(this.onDestroy$),
        tap(data => {
          if (!deepEqual(this.filter, data)) {
            if(data.search != ""){
              localStorage.setItem("m_portal_dealers_module_search_keyword", data.search);
            }else{
              localStorage.removeItem("m_portal_dealers_module_search_keyword");
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
    localStorage.setItem('m_portal_dealers_module_limit', event.pageSize);
    localStorage.setItem('m_portal_dealers_module_page_count', data.page);

    this.updateFilter(data);
  }

  onRefresh() {
    this.loader$.open();
    this.mDealerService$
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
    if (roles['admin'] || roles['superadmin']) {
      return true;
    } else {
      return false;
    }
  }
}
