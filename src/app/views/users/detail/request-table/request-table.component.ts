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
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, takeUntil, tap } from 'rxjs/operators';

import { REQUEST } from 'app/core/errors';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { Log } from 'app/shared/models/log.model';
import { Request } from 'app/shared/models/request.model';
import { User } from 'app/shared/models/user.model';
import { Profile } from 'app/shared/models/user.model';
import { RequestService } from 'app/shared/services/apis/requests.service';
import { VehicleService } from 'app/shared/services/apis/vehicle.service';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { AppState } from 'app/store/';
import { AddError } from 'app/store/error/error.actions';
import * as requestActions from 'app/store/requests/requests.actions';
import { dataSelector as profileDataSelector } from 'app/store/auth/authentication.selector';
import {
  didFetchSelector,
} from 'app/store/users/users.selectors';
import { initialState as initialReqState } from 'app/store/requests/requests.states';
import { NgxRolesService } from 'ngx-permissions';
import { UsersRequestModalComponent } from '../request-modal/request-modal.component';
import { WholesaleQuote } from 'app/shared/models/wholesale-quote.model';
import { TablePagination } from 'app/shared/models/common.model';

@Component({
  selector: 'app-request-table',
  templateUrl: './request-table.component.html',
  animations: egretAnimations,
})
export class RequestTableComponent implements OnInit, OnDestroy {
 
  @ViewChild('TableRequestPaginator') TableRequestPaginator: MatPaginator;
  @ViewChild('TableRequestSort') TableRequestSort: MatSort;

  columnHeaders: string[] = [
    'srNo',
    'year',
    'brand',
    'model',
    'trim',
    'contact_owner',
    'referral_code',
    'source',
    'created_at',
    'actions',
  ];
  

  public dataSource: any;
  public dataRequestSource: TablePagination = {
    length: initialReqState.meta.total,
    pageIndex: initialReqState.filter.page,
    pageSize: initialReqState.filter.per_page,
    previousPageIndex: 0,
  };
  private onDestroy$ = new Subject<void>();

  public userId: string;
  public isReady: boolean;
  public user: User;
  public logs: Array<Log>;
  public requests: Array<Request>;
  public quotes: Array<Request>;
  public wholesaleQuotes: Array<WholesaleQuote> = [];
  public didFetch$: Observable<any>;
  offset = 1;
  public userProfile: Profile;
 
  public showDatalastPage: boolean = true;
  public RequestParam: any = {
		order_by: 'created_at',
		order_dir: 'desc',
		page: 1,
		per_page: 10,
	};
  

  constructor(
    private store$: Store<AppState>,
    private route$: ActivatedRoute,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private loader$: AppLoaderService,
    private confirmService$: AppConfirmService,
    private vehicleService$: VehicleService,
    private rolesService$: NgxRolesService,
    private requestService$: RequestService,
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
    this.dataSource = new MatTableDataSource();
  }


  onRequestPaginateChange(event) {
    this.showDatalastPage = !this.TableRequestPaginator.hasNextPage();
		this.RequestParam.page = event.pageIndex + 1;
		this.RequestParam.per_page = event.pageSize;
		/* if not use then comment this line */
		this.logRequestData(this.RequestParam);
		/* if not use then comment this line */
	} 
  // alluser_requests
  logRequestData(event) {
    setTimeout(() => {
      this.loader$.open();
    }, 10);

    combineLatest(
      this.vehicleService$.getListByUserid(this.userId,event)
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
      this.requests = logResonse ? logResonse.data : [];
      
      this.initRequestMeta(logResonse.meta);
      this.isReady = true;
      this.changeDetectorRefs.detectChanges();
    });
  }

  initData() {
    combineLatest(
      this.vehicleService$.getListByUserid(this.userId,this.RequestParam),
    )
      .pipe(
        takeUntil(this.onDestroy$),
        map(result => result),
        catchError(err => {
          return of(err);
        })
      )
      .subscribe(([requestResponse]) => {
        this.requests = requestResponse ? requestResponse.data : [];

        this.initRequestMeta(requestResponse.meta);
        this.isReady = true;
        this.changeDetectorRefs.detectChanges();
      });
  }
  
  initRequestMeta(meta) {
    this.dataRequestSource.length = meta.total;
    this.dataRequestSource.pageIndex = meta.current_page - 1;
    this.dataRequestSource.pageSize = meta.per_page;
    
    

    this.dataSource.data = this.requests;
    this.dataSource.length = meta.total;
    this.dataSource.pageIndex = meta.current_page - 1;
    this.dataSource.pageSize = meta.per_page;
  }
  sortData(event) {
    let orderby = event.active ? event.active : this.RequestParam.order_by;
    if(event.active){
      if(event.active == 'source'){
        orderby = 'source_utm';
      }
    }
    this.RequestParam.order_by = orderby;
		this.RequestParam.order_dir = event.direction ? event.direction : this.RequestParam.order_dir,
		/* if not use then comment this line */
		this.logRequestData(this.RequestParam);
  }
  initTable() {
    this.dataSource.paginator = this.TableRequestPaginator;
    this.dataSource.sort = this.TableRequestSort;
  }

  showDeleteButton(item: Request) {
    const roles = this.rolesService$.getRoles();
    if (roles['admin'] || roles['superadmin']) {
      return true;
    } else {
      return false;
    }
  }

  onDelete(item: Request, index: number) {
    this.confirmService$
      .confirm({
        message: `Are you sure you want to delete request?`,
      })
      .subscribe(res => {
        if (res) {
          this.loader$.open();
          this.requestService$
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
              this.store$.dispatch(new requestActions.ClearDetail());
              if (res1.error) {
                this.store$.dispatch(
                  new AddError({
                    type: REQUEST.TYPE,
                    message: REQUEST.DELETE_ERROR,
                  })
                );
              } else {
                this.requests.splice(index, 1);
                this.initTable();
              }
            });
        }
      });
  }

  onAddRequest() {
    const title = 'Add New Request';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      UsersRequestModalComponent,
      {
        width: '720px',
        disableClose: true,
        data: {
          title: title,
          payload: {
            userId: this.userId,
          },
          type: 'add',
        },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        // If user press cancel
        return;
      }
      this.store$.dispatch(new requestActions.ClearDetail());
      this.initData();
    });
  }

  indirectShowDeleteButton() {
    const roles = this.rolesService$.getRoles();
    if (roles['admin'] || roles['superadmin']) {
      return true;
    } else {
      return false;
    }
  }

  indirectShowEditButton() {
    const roles = this.rolesService$.getRoles();
    if (!roles['salesperson'] || !roles['concierge'] || this.user.contact_owner_email == this.userProfile.email) {
      return true;
    }
    else {
      return false;
    }
  }

}

