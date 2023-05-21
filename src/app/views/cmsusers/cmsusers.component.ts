import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { fromEvent, Observable, Subject } from 'rxjs';
import {
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
import { CmsUser, UpdateCmsUser } from 'app/shared/models/cmsuser.model';
import { TablePagination } from 'app/shared/models/common.model';
import * as commonModels from 'app/shared/models/common.model';
import {
  Filter as LogFilter,
  Log,
  LogResponse,
} from 'app/shared/models/log.model';
import { AppState } from 'app/store/';
import * as logActions from 'app/store/cmsuserlogs/cmsuserlogs.actions';
import {
  dataSelector as logDataSelector,
  didFetchSelector as logDidFetchSelector,
  fetchingSelector as logFetchingSelector,
  filterSelector as logFilterSelector,
  metaSelector as logMetaSelector,
} from 'app/store/cmsuserlogs/cmsuserlogs.selectors';
import { initialState as initialLogState } from 'app/store/cmsuserlogs/cmsuserlogs.states';
import * as actions from 'app/store/cmsusers/cmsusers.actions';
import {
  didFetchSelector,
  fetchingSelector,
  filterSelector,
  metaSelector,
} from 'app/store/cmsusers/cmsusers.selectors';
import { initialState } from 'app/store/cmsusers/cmsusers.states';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { CmsUsersEditModalComponent } from './table/edit-modal/edit-modal.component';
import { ROLE_LIST } from 'app/core/constants';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as cmsusersModels from 'app/shared/models/cmsuser.model';

@Component({
  selector: 'app-cmsusers',
  templateUrl: './cmsusers.component.html',
  styleUrls: ['./cmsusers.component.scss'],
  animations: egretAnimations,
})
export class CmsUsersComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput: ElementRef;
  @ViewChild('searchLogInput') searchLogInput: ElementRef;

  private onDestroy$ = new Subject<void>();

  public filter$: Observable<any>;
  public meta$: Observable<any>;
  public didFetch$: Observable<any>;
  public fetching$: Observable<any>;

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
        this.search = "";
      }

      this.loadLogs();
    }

    this.store$.dispatch(new actions.GetList(this.filter));
  }

  loadLogs() {
    var per_page_log_limit = localStorage.getItem('cms_users_log_module_limit');
    var selected_page_log_no = localStorage.getItem('cms_users_log_module_page_count');
    var search_log_keyword = localStorage.getItem('cms_users_log_module_search_keyword');

    //check base on previous select item
    {

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
    localStorage.setItem('cms_users_module_limit', event.pageSize);
    localStorage.setItem('cms_users_module_page_count', data.page);

    this.updateFilter(data);
  }

  onAddItem() {
    const title = 'Add CarBlip Team Member';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      CmsUsersEditModalComponent,
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

      this.store$.dispatch(new actions.CreateSuccess(res));
    });
  }

  refreshTable() {
    this.changeDetectorRefs.detectChanges();
  }

  filterSubmit() {
    const newFilter = {
      filter: this.getRequestFilter(),
    };
    newFilter.filter.roles = newFilter.filter.roles == undefined ? '0' : newFilter.filter.roles.toString();
    newFilter.filter.isroundrobin = newFilter.filter.isroundrobin ? '1' : '0';
    newFilter.filter.isactive = newFilter.filter.isactive ? '1' : '0';
    newFilter.filter.isinactive = newFilter.filter.isinactive ? '1' : '0';
    this.updateFilter(newFilter);
    this.refreshTable();  
  }

  getRequestFilter() {
    const requestFilter: cmsusersModels.RequestFilter = {};

    if (this.filterForm.value.roles) {
      requestFilter.roles = this.filterForm.value.roles;
    }
    if (this.filterForm.value.isactive) {
      requestFilter.isactive = this.filterForm.value.isactive;
    }
    if (this.filterForm.value.isinactive) {
      requestFilter.isinactive = this.filterForm.value.isinactive;
    }
    if (this.filterForm.value.isroundrobin) {
      requestFilter.isroundrobin = this.filterForm.value.isroundrobin;
    }
    return requestFilter;
  }

  checkAllSource() {
    this.disableAllOptionInSource = !this.disableAllOptionInSource;
      let arr = this.filterForm.controls['roles'].value;
      if(this.disableAllOptionInSource) {
        arr = [0]
      }
      this.filterForm.patchValue({roles: arr});
  }
}
