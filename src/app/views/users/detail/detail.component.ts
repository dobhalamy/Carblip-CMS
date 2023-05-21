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

import { egretAnimations } from 'app/shared/animations/egret-animations';
import { getBoolColor } from 'app/shared/helpers/utils';
import { Log } from 'app/shared/models/log.model';
import { Request } from 'app/shared/models/request.model';
import { User } from 'app/shared/models/user.model';
import { Profile } from 'app/shared/models/user.model';
import { RequestService } from 'app/shared/services/apis/requests.service';
import { UserService } from 'app/shared/services/apis/users.service';
import { VehicleService } from 'app/shared/services/apis/vehicle.service';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { AppState } from 'app/store/';
import * as actions from 'app/store/users/users.actions';
import { dataSelector as profileDataSelector } from 'app/store/auth/authentication.selector';
import {
  dataSelector,
  didFetchSelector,
  metaSelector,
} from 'app/store/users/users.selectors';
import { initialState as initialLogState } from 'app/store/users/users.states';
import { initialState as initialReqState } from 'app/store/requests/requests.states';
import { NgxRolesService } from 'ngx-permissions';
import { UsersRequestModalComponent } from './request-modal/request-modal.component';
import { WholesaleQuote } from 'app/shared/models/wholesale-quote.model';
import { WholesaleQuoteService } from 'app/shared/services/apis/wholesale-quote.service';
import * as wholesaleactions from 'app/store/wholesale-quote/wholesale-quote.actions';
import { UsersEditModalComponent } from '../table/edit-modal/edit-modal.component';
import { TablePagination } from 'app/shared/models/common.model';

@Component({
  selector: 'app-users-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.style.scss'],
  animations: egretAnimations,
})
export class UsersDetailComponent implements OnInit, OnDestroy {
  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

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

  private onDestroy$ = new Subject<void>();

  public getBoolColor = getBoolColor;

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
  public logPagination: TablePagination = {
    length: initialLogState.meta.total,
    pageIndex: initialLogState.filter.page,
    pageSize: initialLogState.filter.per_page,
    previousPageIndex: 0,
  };
 
  public showDatalastPage: boolean = true;
  public LogParam: any = {
		order_by: 'created_at',
		order_dir: 'desc',
		page: 1,
		per_page: 10,
	};
  showEmailSection: boolean = false;

  constructor(
    private store$: Store<AppState>,
    private route$: ActivatedRoute,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private loader$: AppLoaderService,
    private confirmService$: AppConfirmService,
    private service$: UserService,
    private vehicleService$: VehicleService,
    private rolesService$: NgxRolesService,
    private requestService$: RequestService,
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
  }
  
  onLogPaginateChange(event) {
		this.showDatalastPage = !this.paginator.hasNextPage();
		this.LogParam.page = event.pageIndex + 1;
		this.LogParam.per_page = event.pageSize;
    console.log('test');
		/* if not use then comment this line */
		this.logPaginationData(this.LogParam);
		/* if not use then comment this line */
	} 


  logPaginationData(event) {
    setTimeout(() => {
      this.loader$.open();
    }, 10);

    combineLatest(
      this.service$.getLogsByUserId(this.userId,event)
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
      this.initLogMeta(logResonse.meta);

      this.logs = logResonse.data;
      this.isReady = true;
      this.changeDetectorRefs.detectChanges();
    });
  }
  
  

  initData() {
    setTimeout(() => {
      this.loader$.open();
    }, 10);

    combineLatest(
      this.service$.getById(this.userId),
      this.service$.getLogsById(this.userId),
    )
      .pipe(
        takeUntil(this.onDestroy$),
        map(result => result),
        catchError(err => {
          return of(err);
        })
      )
      .subscribe(([result, logResonse]) => {
        setTimeout(() => {
          this.loader$.close();
        }, 15);
        this.user = result.data;
        this.logs = logResonse.data;
        this.initLogMeta(logResonse.meta);

        this.checkIsZimbraUser();
        this.isReady = true;
        this.changeDetectorRefs.detectChanges();
      });
  }

  initLogMeta(meta) {
    this.logPagination.length = meta.total;
    this.logPagination.pageIndex = meta.current_page - 1;
    this.logPagination.pageSize = meta.per_page;
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
    // if (!roles['salesperson'] || this.user.contact_owner_email == this.userProfile.email) {
    //   return true;
    // }
    // else {
    //   return false;
    // }
    return true;
  }

  indirectDeleteDialogBox() {
    this.confirmService$
      .confirm({
        message: `Are you sure you wish to delete this user '${this.user.first_name
          }'? This is permanent and cannot be undone.`,
      })
      .subscribe(res => {
        if (res) {
          const payload = {
            id: this.user.id,
          };
          this.store$.dispatch(new actions.Delete(payload));
          this.router$.navigate(['/users'])
        }
      });
  }

  indirectEditDialogBox() {
    const title = 'Edit User';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      UsersEditModalComponent,
      {
        width: '720px',
        disableClose: false,
        data: { title: title, payload: this.user, type: 'edit' },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        // If user press cancel
        return;
      }

      this.store$.dispatch(new actions.UpdateSuccess(res));
      this.initData();
    });
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


  checkIsZimbraUser() {
    if(this.userProfile.email.includes('email.carblip.com') && this.user.email_address.includes('email.carblip.com')) {
      this.showEmailSection = true;
    } else {
      this.showEmailSection = false;
    }
  }

}

