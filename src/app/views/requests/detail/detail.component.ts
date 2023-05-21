import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatPaginator,
  MatSort,
  MatTableDataSource,
} from '@angular/material';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, takeUntil, tap } from 'rxjs/operators';

import { QUOTE } from 'app/core/errors';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { formatPhoneNumber } from 'app/shared/helpers/utils';
import { getBoolColor, getUserFullName } from 'app/shared/helpers/utils';
import * as commonModels from 'app/shared/models/common.model';
import { Log, LogResponse } from 'app/shared/models/log.model';
import { Quote } from 'app/shared/models/quote.model';
import { Request } from 'app/shared/models/request.model';
import { QuoteService } from 'app/shared/services/apis/quotes.service';
import { RequestService } from 'app/shared/services/apis/requests.service';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { AppState } from 'app/store/';
import { AddError } from 'app/store/error/error.actions';
import * as quoteActions from 'app/store/quotes/quotes.actions';
import * as actions from 'app/store/requests/requests.actions';
import {
  dataSelector,
  didFetchSelector,
  metaSelector,
} from 'app/store/requests/requests.selectors';
import { initialState } from 'app/store/requests/requests.states';
import { NgxRolesService } from 'ngx-permissions';

@Component({
  selector: 'app-requests-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.style.scss'],
  animations: egretAnimations,
})
export class RequestsDetailComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  private onDestroy$ = new Subject<void>();

  public requestId: string;
  public isReady: boolean;
  public request: Request;
  public logs: Array<Log>;

  public getBoolColor = getBoolColor;

  columnHeaders: string[] = [
    'stock_no',
    'first_name',
    'last_name',
    'year',
    'make',
    'model',
    'drive_off',
    'created_at',
    'updated_at',
    'actions',
  ];

  dataSource: any;

  public quotes: Array<Quote>;
  
  public quoteIds: number[] = [];
  public quoteLogs: any = [];
  public logMeta: any = [];

  constructor(
    private store$: Store<AppState>,
    private route$: ActivatedRoute,
    private router$: Router,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private loader$: AppLoaderService,
    private confirmService$: AppConfirmService,
    private service$: RequestService,
    private quoteService$: QuoteService,
    private rolesService$: NgxRolesService
  ) {}

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.isReady = false;
    setTimeout(() => {
      this.loader$.open();
    }, 10);
    this.route$.paramMap.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.requestId = params.get('id');
      this.initData();
    });

    this.dataSource = new MatTableDataSource();
  }

  initData() {
    combineLatest(
      this.service$.getById(this.requestId),
      this.service$.getLogsById(this.requestId)
    )
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        map(result => result),
        catchError(err => {
          return of(err);
        })
      )
      .subscribe(([result, logResonse]) => {   
        this.loader$.close();
        this.request = result.data;
        this.quotes = this.request ? this.request['quotes'] : [];
        if(this.quotes.length > 0) {
          this.quoteIds = this.quotes.map(quote => quote.id);
          this.getRequestDetailQuotesLogs(1, 20);
        }
        this.initTable();
        this.logs = logResonse.data;
        this.isReady = true;
        this.changeDetectorRefs.detectChanges();
      });
  }

  initTable() {
    this.dataSource.data = this.quotes;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onAddQuote() {
    this.router$.navigate(['/quotes/' + this.requestId + '/add'], {});
  }

  onDelete(item: Quote, index: number) {
    this.confirmService$
      .confirm({
        message: `Are you sure you want to delete Quote?`,
      })
      .subscribe(res => {
        if (res) {
          this.loader$.open();
          this.quoteService$
            .delete(item.id.toString())
            .pipe(
              takeUntil(this.onDestroy$),
              map(result => result),
              catchError(err => {
                this.loader$.close();
                throw err;
              })
            )
            .subscribe(res1 => {
              this.loader$.close();
              this.store$.dispatch(new quoteActions.ClearDetail());
              if (res1) {
                this.quotes.splice(index, 1);
                this.initTable();
              }
            });
        }
      });
  }

  getRequestDetailQuotesLogs(page: number, per_page: number) {
    const payload = {
      page: page,
      per_page: per_page,
      targetIds: this.quoteIds
    }
    this.service$.getQuoteLogsByIds(payload).subscribe((res: any) => {
      if(res.error) {

      } else {
        this.quoteLogs = res.data;
        this.logMeta = res.meta;
        this.changeDetectorRefs.detectChanges();
        this.loader$.close();
      }
    })
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

  onLogPaginateChange($event: any) {
    this.loader$.open();
    this.getRequestDetailQuotesLogs($event.pageIndex+1, $event.pageSize);
  }
}
