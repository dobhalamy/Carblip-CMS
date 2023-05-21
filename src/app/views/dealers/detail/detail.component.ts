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
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, takeUntil, tap } from 'rxjs/operators';

import { egretAnimations } from 'app/shared/animations/egret-animations';
import { DealerContactModalComponent } from 'app/shared/components/dealer-contact-modal/dealer-contact-modal.component';
import { DealersModalComponent } from 'app/shared/components/dealer-modal/dealer-modal.component';
import { formatPhoneNumber } from 'app/shared/helpers/utils';
import { getBoolColor, getUserFullName } from 'app/shared/helpers/utils';
import * as commonModels from 'app/shared/models/common.model';
import {
  Dealer,
  DealerContact,
  DealerResponse,
} from 'app/shared/models/dealer.model';
import { Log, LogResponse } from 'app/shared/models/log.model';
import { DealerService } from 'app/shared/services/apis/dealer.service';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { AppState } from 'app/store/';
import * as actions from 'app/store/dealers/dealers.actions';
import {
  dataSelector,
  didFetchSelector,
  metaSelector,
} from 'app/store/dealers/dealers.selectors';
import { initialState } from 'app/store/dealers/dealers.states';
import { NgxRolesService } from 'ngx-permissions';

@Component({
  selector: 'app-dealers-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.style.scss'],
  animations: egretAnimations,
})
export class DealersDetailComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  private onDestroy$ = new Subject<void>();

  public dealerId: string;
  public isReady: boolean;
  public dealer: Dealer;

  public getBoolColor = getBoolColor;

  columnHeaders: string[] = [
    'srNo',
    'name',
    'title',
    'email',
    'phone',
    'created_at',
    'updated_at',
    'actions',
  ];

  dataSource: any;

  public contacts: Array<DealerContact>;

  constructor(
    private store$: Store<AppState>,
    private route$: ActivatedRoute,
    private changeDetectorRefs: ChangeDetectorRef,
    private dialog: MatDialog,
    private loader$: AppLoaderService,
    private confirmService$: AppConfirmService,
    private service$: DealerService
  ) {}

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.isReady = false;
    this.route$.paramMap.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      this.dealerId = params.get('id');
      this.initData();
    });

    this.dataSource = new MatTableDataSource();
  }

  initData() {
    setTimeout(() => {
      this.loader$.open();
    }, 10);

    combineLatest(this.service$.getById(this.dealerId))
      .pipe(
        takeUntil(this.onDestroy$),
        map(result => result),
        catchError(err => {
          return of(err);
        })
      )
      .subscribe(([result]) => {
        this.loader$.close();
        this.dealer = result.data;
        this.contacts = this.dealer ? this.dealer['contacts'] : [];
        this.initTable();
        this.isReady = true;
        this.changeDetectorRefs.detectChanges();
      });
  }

  initTable() {
    this.dataSource.data = this.contacts;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onAddContact() {
    const title = 'Add New Contact';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      DealerContactModalComponent,
      {
        width: '768px',
        disableClose: true,
        data: {
          title: title,
          payload: {
            dealerId: this.dealerId,
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
      this.store$.dispatch(new actions.ClearDetail());
      this.initData();
    });
  }

  onEditDealer() {
    const title = 'Edit Dealer';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      DealersModalComponent,
      {
        width: '720px',
        disableClose: false,
        data: { title: title, payload: this.dealer, type: 'edit' },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        // If user press cancel
        return;
      }
      this.dealer = res;
      this.changeDetectorRefs.detectChanges();
      this.store$.dispatch(new actions.UpdateSuccess(res));
    });
  }

  onEdit(item: DealerContact, index: number) {
    const title = 'Edit Contact';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      DealerContactModalComponent,
      {
        width: '768px',
        disableClose: true,
        data: {
          title: title,
          payload: {
            dealerId: this.dealerId,
            data: item,
          },
          type: 'edit',
        },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        // If user press cancel
        return;
      }
      this.store$.dispatch(new actions.ClearDetail());
      this.initData();
    });
  }

  onDelete(item: DealerContact, index: number) {
    this.confirmService$
      .confirm({
        message: `Are you sure you want to delete Dealer Contact?`,
      })
      .subscribe(res => {
        if (res) {
          this.loader$.open();
          this.service$
            .deleteContact(item.id.toString())
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
              this.store$.dispatch(new actions.ClearDetail());
              if (res1) {
                this.contacts.splice(index, 1);
                this.initTable();
              }
            });
        }
      });
  }
}
