import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MatPaginator,
  MatSort,
  MatTableDataSource,
} from '@angular/material';
import { WHOLESALEQUOTE } from 'app/core/errors';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, takeUntil, tap } from 'rxjs/operators';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { getBoolColor } from 'app/shared/helpers/utils';
import { Request } from 'app/shared/models/request.model';
import { User } from 'app/shared/models/user.model';
import { Profile } from 'app/shared/models/user.model';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { AppState } from 'app/store/';
import { AddError } from 'app/store/error/error.actions';
import { dataSelector as profileDataSelector } from 'app/store/auth/authentication.selector';
import {
  didFetchSelector,
} from 'app/store/users/users.selectors';
import { initialState as initialLogState } from 'app/store/users/users.states';
import { initialState as initialReqState } from 'app/store/requests/requests.states';
import { NgxRolesService } from 'ngx-permissions';
import { WholesaleQuote } from 'app/shared/models/wholesale-quote.model';
import { WholesaleQuoteService } from 'app/shared/services/apis/wholesale-quote.service';
import * as wholesaleactions from 'app/store/wholesale-quote/wholesale-quote.actions';
import { TablePagination } from 'app/shared/models/common.model';

@Component({
  selector: 'app-wholesale-table',
  templateUrl: './wholesale-table.component.html',
  animations: egretAnimations,
})
export class WholesaleTableComponent implements OnInit, OnDestroy {
  @ViewChild('TableWholesalePaginator') TableWholesalePaginator: MatPaginator;
  @ViewChild('TableWholesaleSort') TableWholesaleSort: MatSort;

  columnHeadersWholesale: string[] = [
    'id',
    'wholesale_stock_no',
    'client_name',
    'year',
    'make',
    'model',
    'created_at',
    'updated_at',
    'actions',
  ];

  public dataSource: any;
  public dataRequestSource: TablePagination = {
    length: initialReqState.meta.total,
    pageIndex: initialReqState.filter.page,
    pageSize: initialReqState.filter.per_page,
    previousPageIndex: 0,
  };
  public dataSourceWholesale: any;
  private onDestroy$ = new Subject<void>();

  public getBoolColor = getBoolColor;

  public userId: string;
  public isReady: boolean;
  public user: User;
  public quotes: Array<Request>;
  public wholesaleQuotes: Array<WholesaleQuote> = [];
  public didFetch$: Observable<any>;
  offset = 1;
  public userProfile: Profile;
  public quotePagination: TablePagination = {
    length: initialLogState.meta.total,
    pageIndex: initialLogState.filter.page,
    pageSize: initialLogState.filter.per_page,
    previousPageIndex: 0,
  };
  public showDatalastPage: boolean = true;
  public QupteParam: any = {
		order_by: 'created_at',
		order_dir: 'desc',
		page: 1,
		per_page: 10,
	};

  constructor(
    private store$: Store<AppState>,
    private route$: ActivatedRoute,
    private changeDetectorRefs: ChangeDetectorRef,
    private loader$: AppLoaderService,
    private confirmService$: AppConfirmService,
    private rolesService$: NgxRolesService,
    private wholesaleService$: WholesaleQuoteService,
    private router$: Router,
  ) {
    this.didFetch$ = this.store$.select(didFetchSelector);
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.isReady = false;
    this.route$.paramMap.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.userId = params.get('id');
      this.initData();
    });

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
    this.loader$.close();
    this.dataSourceWholesale = new MatTableDataSource();
  }
  
  onWholesalePaginateChange(event) {
    this.showDatalastPage = !this.TableWholesalePaginator.hasNextPage();
		this.QupteParam.page = event.pageIndex + 1;
		this.QupteParam.per_page = event.pageSize;
		/* if not use then comment this line */
		this.logsWholesaleQuotesData(this.QupteParam);
		/* if not use then comment this line */
	} 
  sortData(event) {
    let orderby = event.active ? event.active : this.QupteParam.order_by;
    if(event.active){
      if(event.active == 'source'){
        orderby = 'source_utm';
      }
    }
    this.QupteParam.order_by = orderby;
		this.QupteParam.order_dir = event.direction ? event.direction : this.QupteParam.order_dir,
		/* if not use then comment this line */
		this.logsWholesaleQuotesData(this.QupteParam);
  }
  // alluser_wholesale
  logsWholesaleQuotesData(event) {
    setTimeout(() => {
      this.loader$.open();
    }, 10);

    combineLatest(
      this.wholesaleService$.getListByUserid(this.userId,event)
    )
    .pipe(
      takeUntil(this.onDestroy$),
      map(result => result),
      catchError(err => {
        return of(err);
      })
    )
    .subscribe(([logResonse]) => {
      setTimeout(() => {
        this.loader$.close();
      }, 15);
      this.quotes = logResonse ? logResonse.data : [];
      
      this.initQuotesMeta(logResonse.meta);
      this.isReady = true;
      this.changeDetectorRefs.detectChanges();
    });
  }
  initQuotesMeta(meta) {
    this.quotePagination.length = meta.total;
    this.quotePagination.pageIndex = meta.current_page - 1;
    this.quotePagination.pageSize = meta.per_page;

    this.dataSourceWholesale.data = this.quotes;
    this.dataSourceWholesale.length = meta.total;
    this.dataSourceWholesale.pageIndex = meta.current_page - 1;
    this.dataSourceWholesale.pageSize = meta.per_page;
  }

  initData() {
    
    combineLatest(
      this.wholesaleService$.getListByUserid(this.userId,this.QupteParam)
    )
      .pipe(
        takeUntil(this.onDestroy$),
        map(result => result),
        catchError(err => {
          return of(err);
        })
      )
      .subscribe(([quotesResponse]) => {
        this.wholesaleQuotes = quotesResponse ? quotesResponse.data : [];
        this.quotes = quotesResponse ? quotesResponse.data : [];
        this.initQuotesMeta(quotesResponse.meta);
        this.isReady = true;
        this.changeDetectorRefs.detectChanges();
      });
  }

  initTable() {
    this.dataSourceWholesale.data = this.wholesaleQuotes;
  }

  showDeleteButton(item: Request) {
    const roles = this.rolesService$.getRoles();
    if (roles['admin'] || roles['superadmin']) {
      return true;
    } else {
      return false;
    }
  }

  onWholesaleQuoteDelete(item: any, index: number) {
    this.confirmService$
      .confirm({
        message: `Are you sure you want to delete request?`,
      })
      .subscribe(res => {
        if (res) {
          // this.loader$.open();
          this.wholesaleService$
            .delete(item.id)
            .pipe(
              takeUntil(this.onDestroy$),
              map(result => result),
              catchError(err => {
                return of(err);
              })
            )
            .subscribe(res1 => {
              this.loader$.close();
              this.store$.dispatch(new wholesaleactions.ClearDetail());
              if (res1.error) {
                this.store$.dispatch(
                  new AddError({
                    type: WHOLESALEQUOTE.TYPE,
                    message: WHOLESALEQUOTE.DELETE_ERROR,
                  })
                );
              } else {
                // this.wholesaleQuotes.splice(index, 1);
                this.initData();
              }
            });
        }
      });
  }

  onAddWholesaleQuote() {
    this.router$.navigate(['/wholesalequote/' + this.userId + '/add'], {});
  }

}

