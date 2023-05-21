import { Component, OnInit, ChangeDetectorRef, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatPaginator } from '@angular/material';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, takeUntil, tap } from 'rxjs/operators';
import { DatePipe, Location, TitleCasePipe } from '@angular/common';
import { diff } from 'deep-diff';
import { AppState } from 'app/store';
import { PurchaseOrderService } from 'app/shared/services/apis/purchase-order.service';
import { PurchaseOrder, PurchaseOrderState } from 'app/shared/models/purchase-order.model';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TablePagination } from 'app/shared/models/common.model';
import * as actions from 'app/store/purchase-order/purchase-order.actions';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { initialState as initialLogState } from 'app/store/purchase-order-logs/purchase-order-logs.states';
import { Filter as LogFilter } from 'app/shared/models/log.model';
import * as commonModels from 'app/shared/models/common.model';
import { Quote } from 'app/shared/models/quote.model';
import { QuoteService } from 'app/shared/services/apis/quotes.service';
import { VendorsService } from 'app/shared/services/apis/vendors.service';
import { NgxRolesService } from 'ngx-permissions';
import { Profile } from 'app/shared/models/user.model';
import { CmsUserService } from 'app/shared/services/apis/cmsusers.service';
import { VendorsEditComponent } from 'app/views/vendors/edit/edit.component';
import { VendorContactModalComponent } from 'app/shared/components/vendor-contact-modal/vendor-contact-modal.component';
import { dataSelector as profileDataSelector } from 'app/store/auth/authentication.selector';

@Component({
  selector: 'app-purchase-order-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  animations: egretAnimations,
})
export class PurchaseOrderEditComponent implements OnInit {
  private onDestroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  public itemForm: FormGroup;
  public quoteFilterCtrl: FormControl = new FormControl();
  public filteredQuote: Array<Quote>;
  public quoteList: Array<Quote>;

  public vendorFilterCtrl: FormControl = new FormControl();
  public filteredVendor: Array<PurchaseOrderState> = [];
  public vendorList: Array<PurchaseOrderState>;

  public vendorContactFilterCtrl: FormControl = new FormControl();
  public filteredVendorContact: Array<PurchaseOrderState> = [];
  public vendorContactList: Array<PurchaseOrderState>;

  public requestApprovalFilterCtrl: FormControl = new FormControl();
  public filteredRequestApproval: Array<Profile> = [];
  public requestApprovalList: Array<Profile>;

  public type: string;
  public isActive: boolean;
  public saveButtonLabel;
  public saving: Boolean = false;
  public orderId;
  public isEdit: Boolean = false;
  public purchaseOder: PurchaseOrder;
  public showHistory = [];
  public orderLogParam: any = {
    order_by: 'created_at',
    order_dir: 'desc',
    page: 1,
    per_page: 10,
  };
  public allData;
  public isReady: boolean;
  public userProfile: any;
  public logPagination: TablePagination = {
    length: initialLogState.meta.total,
    pageIndex: initialLogState.filter.page,
    pageSize: initialLogState.filter.per_page,
    previousPageIndex: 0,
  };
  public logFilter: LogFilter = initialLogState.filter;
  public logMeta: commonModels.Meta = initialLogState.meta;
  public quotes: Array<Quote> = [];
  public quotes$: Observable<any>;
  public meta$: Observable<any>;
  public didFetch$: Observable<any>;
  public offset: number;
  public meta: commonModels.Meta;
  public quoteId: string;
  public vendorId: string;
  public vendorContactId: string;
  public requestApprovalId: string;
  public isAllowUpdate: boolean = false;
  public addHistoryData;
  public showDatalastPage:boolean=true;
  constructor(
    private changeDetectorRefs: ChangeDetectorRef,
    private fb: FormBuilder,
    private store$: Store<AppState>,
    private purchaseOrderService$: PurchaseOrderService,
    private route$: ActivatedRoute,
    private location$: Location,
    public titleCasePipe: TitleCasePipe,
    private authService$: AuthService,
    private quoteService$: QuoteService,
    private vendorService$: VendorsService,
    public datepipe: DatePipe,
    public loader$: AppLoaderService,
    private router$: Router,
    private rolesService$: NgxRolesService,
    private cmsService$: CmsUserService,
    private dialog: MatDialog,

  ) {
  }

  ngOnInit() {
    this.store$
			.select(profileDataSelector)
			.pipe(
				takeUntil(this.onDestroy$),
				tap((profile: Profile) => {
					this.userProfile = profile;
				})
			)
			.subscribe();
    this.isReady = false;
    this.route$.paramMap.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      if (params.get('id')) {
        this.orderId = params.get('id');
        this.isEdit = true;
        this.getHistoryList(this.orderLogParam);
      }
      this.initData();
      this.showEditDeleteButton();


    });
    //start listen for search field value changes
    this.quoteFilterCtrl.valueChanges
      .pipe(
        debounceTime(500),
        takeUntil(this.onDestroy$))
      .subscribe(() => {
        this.filterQuote();
      });

    this.vendorFilterCtrl.valueChanges
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(() => {
        this.filterVendor();
      });

    this.vendorContactFilterCtrl.valueChanges
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(() => {
        this.filterVendorContact();
      });

    this.requestApprovalFilterCtrl.valueChanges
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(() => {
        this.filterRequestApproval();
      });
    //end  of search event
  }
 
  onBackClick() {
    this.location$.back();
  }

  onLogPaginateChange(event) {
    this.showDatalastPage=!this.paginator.hasNextPage();
    this.orderLogParam.page = event.pageIndex + 1;
    this.orderLogParam.per_page = event.pageSize;
    this.getHistoryList(this.orderLogParam);
  }

  initData() {
    if (this.isEdit) {
      setTimeout(() => {
        this.loader$.open();
      }, 10);
      combineLatest(this.purchaseOrderService$.getById(this.orderId))
        .pipe(
          takeUntil(this.onDestroy$),
          map(result => result),
          catchError(err => {
            return of(err);
          })
        )
        .subscribe(([result]) => {
          this.purchaseOder = result.data;
          const convertedDate = this.datepipe.transform(`${this.purchaseOder.created_at}`, 'dd/MM/yy ,h:mm a');
          const splitDateTime = convertedDate.split(',');
          // this.addHistoryData=`Version 1 ${this.userProfile.full_name} created purchase-order ${this.purchaseOder.id} on ${splitDateTime[0]} at ${splitDateTime[1]}`;
          this.buildItemForm(this.purchaseOder);
          this.allData = this.itemForm.value;
          this.loader$.close();
          this.isReady = true;
        });
    } else {
      this.loader$.close();
      this.buildItemForm(null);
      this.allData = this.itemForm.value;
      this.isReady = true;
    }
  }

  refreshTable() {
    this.changeDetectorRefs.detectChanges();
  }
  showEditDeleteButton() {
    const roles = this.rolesService$.getRoles();
    if (roles['administrative'] || roles['admin'] || roles['superadmin']) {
      this.isAllowUpdate = true;
    }
  }
  filterQuote(newId = null) {
    this.quoteList = [];
    let search = this.quoteFilterCtrl.value || '';
    const quoteParam = {
      order_by: 'first_name',
      order_dir: 'asc',
      page: 1,
      per_page: 30,
      search,
    };

    this.quoteService$.getList(quoteParam).subscribe(({ data }) => {
      this.quoteList = data;
      this.filteredQuote = this.quoteList.slice(0);
      this.onQuoteFilterChange(newId);
    });
  }

  onQuoteFilterChange(val) {
    if (val) {
      this.itemForm.patchValue({
        quote: val,
        // dealer_contact_id: 0,
      });
    }
    this.quoteId = this.itemForm.value.quote_id;
    // this.filterQuote();
    this.refreshData();
  }

  onVendorFilterChange(val) {
    if (val) {
      this.itemForm.patchValue({
        vendor_id: val,
        vendor_contact_id: 0,
      });
    }
    this.vendorId = this.itemForm.value.vendor_id;
    this.filterVendorContact();
    this.refreshData();
  }

  onVendorContactFilterChange(val) {
    if (val) {
      this.itemForm.patchValue({
        vendor_contact_id: val,
      });
    }
    this.vendorContactId = this.itemForm.value.vendor_contact_id;
    this.refreshData();
  }
  onRequestApprovalFilterChange(val) {
    if (val) {
      this.itemForm.patchValue({
        request_approval_from: val,
      });
    }
    this.requestApprovalId = this.itemForm.value.request_approval_from;
    this.refreshData();
  }
  filterVendor(newId = null) {
    this.vendorList = [];
    let search = this.vendorFilterCtrl.value || '';
    const quoteParam = {
      order_by: 'name',
      order_dir: 'asc',
      page: 1,
      per_page: 30,
      search,
    };

    this.vendorService$.getList(quoteParam).subscribe(({ data }) => {
      this.vendorList = data;
      this.filteredVendor = this.vendorList.slice(0);
      this.onVendorFilterChange(newId);
    });
  }

  filterVendorContact(newId = null) {
    this.vendorContactList = [];
    let search = this.vendorContactFilterCtrl.value || '';
    const quoteParam = {
      vendor_id: this.itemForm.value.vendor_id,
      order_by: 'name',
      order_dir: 'asc',
      page: 1,
      per_page: 30,
      search,
    };

    this.vendorService$.getListContacts(quoteParam).subscribe(({ data }) => {
      this.vendorContactList = data;
      this.filteredVendorContact = this.vendorContactList.slice(0);
      this.onVendorContactFilterChange(newId);
    });
  }
  filterRequestApproval(newId = null) {
    this.requestApprovalList = [];
    let search = this.requestApprovalFilterCtrl.value || '';
    const quoteParam = {
      order_by: 'first_name',
      order_dir: 'asc',
      page: 1,
      per_page: 30,
      search,
    };

    this.cmsService$.getList(quoteParam).subscribe(({ data }) => {
      ///// Filter data based on role to show/////
      let filteredRoleData = data;
      this.requestApprovalList = filteredRoleData.filter(role => (role.roles[0]['name'] == 'superadmin' || role.roles[0]['name'] == 'admin' || role.roles[0]['name'] == 'administrative'));
      this.filteredRequestApproval = this.requestApprovalList.slice(0);
      this.onRequestApprovalFilterChange(newId);
    });
  }
  getTitle() {
    if (this.isEdit) {
      return `Purchase order ${this.purchaseOder.id} Edit`;
    } else {
      return `Add Purchase order`;
    }
  }
  buildItemForm(item: any) {
    let formFields = {};
    if (this.isEdit) {
      this.vendorId = item.vendor_contact;
      formFields = {
        purchase_order_number: [item.id || ''],
        quote_id: [item.quote_id || ''],
        vendor_id: [item.vendor_id || ''],
        vendor_contact_id: [item.vendor_contact_id || ''],
        description: [item.description || '', Validators.required],
        amount: [Number(item.amount).toFixed(2) || ''],
        request_approval_from: [item.request_approval_from || ''],
        category: [item.category || ''],
        payment_date: [item.payment_date || ''],
        approved: [item.approved || '',],
      };
    }
    else {
      formFields = {
        purchase_order_number: [''],
        quote_id: [''],
        vendor_id: [''],
        vendor_contact_id: [''],
        description: ['', Validators.required],
        amount: [''],
        request_approval_from: [''],
        category: [''],
        payment_date: [''],
        approved: ['',],
      };
    }

    this.itemForm = this.fb.group(formFields);
    this.filterQuote();
    this.filterVendor();
    // this.filterVendorContact();
    this.filterRequestApproval();
  }
  /*  */
  transformKey(item) {
    item = item.replace(/_/g, ' ');
    return this.titleCasePipe.transform(item);
  }
  
  generateLogMsg(item) {
    if (item.kind == 'A') {
      if (item.item.kind == 'A') { }
      else if (item.item.kind == 'E') { }
      else if (item.item.kind == 'D') { }
      else if (item.kind == 'E') {
        if (item.lhs == "" || item.lhs == null) {
          if (item.path[0] == 'approved') {
            return `${'Approve added'}`;
          }
          else if (item.path[0] == 'quote_id') {
            let quoteName = this.filteredQuote.filter(i => i.id == item.rhs);
            if (quoteName.length > 0) {
              return `Quote added to ${quoteName[0].first_name}`;
            }
          }
          else if (item.path[0] == 'vendor_contact_id') {
            let vendorContactName = this.filteredVendorContact.filter(i => i.id == item.rhs);
            if (vendorContactName.length > 0) {
              return `Vendor Contact added to ${vendorContactName[0].name}`;
            }
          }
          else {
            return `${this.transformKey(item.path[0])} added to ${item.rhs}`;
          }
        }
        else {
          if (item.rhs == "") {
            return `${this.transformKey(item.path[0])} removed`;
          }
          else if (item.path[0] == 'quote_id') {
            let quoteName = this.filteredQuote.filter(i => i.id == item.rhs);
            if (quoteName.length > 0) {
              return `Quote updated to ${quoteName[0].first_name}`;
            }
          }
          else if (item.path[0] == 'vendor_id') {
            let vendorName = this.filteredVendor.filter(i => i.id == item.rhs);
            if (vendorName.length > 0) {
              return `Vendor updated to ${vendorName[0].name}`;
            }
          }
          else if (item.path[0] == 'vendor_contact_id') {
            let vendorContactName = this.filteredVendorContact.filter(i => i.id == item.rhs);
            if (vendorContactName.length > 0) {
              return `Vendor Contact updated to ${vendorContactName[0].name}`;
            }
          }
          else if (item.path[0] == 'request_approval_from') {
            let approverName = this.filteredRequestApproval.filter(i => i.id == item.rhs);
            if (approverName.length > 0) {
              return `Request approval updated to ${approverName[0].first_name}`;
            }
          }
          else if (item.path[0] == 'approved') {
            return `updated to approved`;
          }
          else {
            if (typeof (item.rhs) == 'object') {
              let convertedDate = this.datepipe.transform(`${item.rhs}`, 'yyyy-MM-dd');
              return `${this.transformKey(item.path[0])} updated to ${convertedDate}`;
            }
            else {
              return `${this.transformKey(item.path[0])} updated to ${item.rhs}`;
            }
          }
        }
      }
      else if (item.kind == 'D') {
        return `${this.transformKey(item.path[0])} deleted`;
      }
      else {
        return `${this.transformKey(item.path[0])} added to ${item.rhs}`;
      }
    }
    else if (item.kind == 'E') {
      if (item.lhs == "" || item.lhs == null) {
        if (item.path[0] == 'approved') {
          return `${'Approve added'}`;
        }
        else if (item.path[0] == 'quote_id') {
          let quoteName = this.filteredQuote.filter(i => i.id == item.rhs);
          if (quoteName.length > 0) {
            return `Quote added to ${quoteName[0].first_name}`;
          }
        }
        else if (item.path[0] == 'vendor_contact_id') {
          let vendorContactName = this.filteredVendorContact.filter(i => i.id == item.rhs);
          if (vendorContactName.length > 0) {
            return `Vendor Contact added to ${vendorContactName[0].name}`;
          }
        }
        else {
          return `${this.transformKey(item.path[0])} added to ${item.rhs}`;
        }
      }
      else {
        if (item.rhs == "") {
          return `${this.transformKey(item.path[0])} removed`;
        }
        else if (item.path[0] == 'quote_id') {
          let quoteName = this.filteredQuote.filter(i => i.id == item.rhs);
          if (quoteName.length > 0) {
            return `Quote updated to ${quoteName[0].first_name}`;
          }
        }
        else if (item.path[0] == 'vendor_id') {
          let vendorName = this.filteredVendor.filter(i => i.id == item.rhs);
          if (vendorName.length > 0) {
            return `Vendor updated to ${vendorName[0].name}`;
          }
        }
        else if (item.path[0] == 'vendor_contact_id') {
          let vendorContactName = this.filteredVendorContact.filter(i => i.id == item.rhs);
          if (vendorContactName.length > 0) {
            return `Vendor Contact updated to ${vendorContactName[0].name}`;
          }
        }
        else if (item.path[0] == 'request_approval_from') {
          let approverName = this.filteredRequestApproval.filter(i => i.id == item.rhs);
          if (approverName.length > 0) {
            return `Request approval updated to ${approverName[0].first_name}`;
          }
        }
        else if (item.path[0] == 'approved') {
          return `updated to approved`;
        }
        else {
          if (typeof (item.rhs) == 'object') {
            let convertedDate = this.datepipe.transform(`${item.rhs}`, 'yyyy-MM-dd');
            return `${this.transformKey(item.path[0])} updated to ${convertedDate}`;
          }
          else {
            return `${this.transformKey(item.path[0])} updated to ${item.rhs}`;
          }
        }
      }
    }
    else if (item.kind == 'D') { return `${this.transformKey(item.path[0])} deleted`; }
    else {
      return `${this.transformKey(item.path[0])} added to ${item.rhs}`;
    }
  }

  getHistoryList(quotePage) {
    quotePage = this.orderLogParam;
    combineLatest(
      this.purchaseOrderService$.getHistory(this.orderId, quotePage),
    )
      .pipe(
        takeUntil(this.onDestroy$),
        map(result => result),
        catchError(err => {
          return of(err);
        })
      )
      .subscribe(([result]) => {
        this.loader$.close();
        this.showHistory = result.data;
        this.initLogMeta(result.meta);
        this.refreshData();
      });
  }

  saveHistoryLog(temp, quote) {
    let editedData = diff(temp, quote);
    if (editedData !== undefined) {
      const copyObj = {
        target_id: null,
        target_type: 'App\\Model\\PurchaseOrder',
        content: '',
        action: 'updated',
        cms_user_id: '',
        cms_user_name: '',
        category: 'cms'
      };
      copyObj.target_id = this.purchaseOder.id;
      copyObj.cms_user_id = this.userProfile.id;
      copyObj.cms_user_name = this.userProfile.full_name;
      let logMsgArray = [];
      editedData.forEach(item => {
        logMsgArray.push(this.generateLogMsg(item));
      });
      copyObj.content = logMsgArray.join(', ');
      //Need to call create History APi
      this.createHistory(copyObj);
    }
  }

  createHistory(payload) {
    this.loader$.open();
    this.purchaseOrderService$
      .createHistory(payload)
      .pipe(
        takeUntil(this.onDestroy$),
        map(result => result),
        catchError(err => {
          return of(err);
        })
      )
      .subscribe(res => {
        this.saving = false;
        if (res) {
          // const { data } = res;
          res.created_at = (new Date()).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
          this.showHistory.unshift(res);
          this.logPagination.length += 1;
          this.refreshData();
          this.loader$.close();
        }
      });
    this.refreshData();
  }
  initLogMeta(meta) {
    this.logPagination.length = meta.total;
    this.logPagination.pageIndex = meta.current_page - 1;
    this.logPagination.pageSize = meta.per_page;
  }
  addNewVendor() {
    const title = 'Add Vendor';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      VendorsEditComponent,
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
      this.filterVendor(res.id);
    });
  }

  addNewVendorContact() {
    const title = 'Add New Vendor Contact';
    const dialogRef: MatDialogRef<any> = this.dialog.open(
      VendorContactModalComponent,
      {
        width: '768px',
        disableClose: true,
        data: {
          title: title,
          payload: {
            vendorId: this.itemForm.value.vendor_id,
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
      this.filterVendorContact(res.id);
    });
  }
  updateOrder(order: PurchaseOrder, callback) {
    if (this.itemForm.valid) {
      this.saving = true;
      this.loader$.open();
      const orderId = this.orderId;
      this.purchaseOrderService$
        .update(orderId, order)
        .pipe(
          takeUntil(this.onDestroy$),
          map(result => result),
          catchError(err => {
            return of(err);
          })
        )
        .subscribe(res => {
          this.saving = false;
          if (res) {
            this.loader$.close();
            const temp: PurchaseOrder = {
              // ...this.allData,
              quote_id: this.allData.quote_id,
              vendor_id: this.allData.vendor_id,
              vendor_contact_id: this.allData.vendor_contact_id,
              description: this.allData.description,
              amount: this.allData.amount,
              request_approval_from: this.allData.request_approval_from,
              category: this.allData.category,
              payment_date: this.allData.payment_date,
              approved: this.allData.approved
            }
            this.saveHistoryLog(temp, order);
            this.allData = this.itemForm.value;
            this.itemForm.markAsPristine();
            this.store$.dispatch(new actions.GetList());
            if (callback) {
              callback();
            }
            this.refreshData();
          }
        });
    }
  }

  createOrder(order: PurchaseOrder, callback) {
    if (this.itemForm.valid) {
      this.saving = true;
      this.loader$.open();
      this.purchaseOrderService$
        .create(order)
        .pipe(
          takeUntil(this.onDestroy$),
          map(result => result),
          catchError(err => {
            return of(err);
          })
        )
        .subscribe(res => {
          this.saving = false;
          this.loader$.close();
          if (res) {
            this.createHistoryLogs(res.data.id);
            this.itemForm.markAsPristine();
            this.router$.navigate(['/purchaseorder']);
          }
        });
    }
  }
  submit(callback?: Function) {
    if (this.itemForm.valid) {
      this.saving = true;
      const payload: PurchaseOrder = {
        // purchase_order_number: this.itemForm.value.purchase_order_number,
        quote_id: this.itemForm.value.quote_id,
        vendor_id: this.itemForm.value.vendor_id,
        vendor_contact_id: this.itemForm.value.vendor_contact_id,
        description: this.itemForm.value.description,
        amount: this.itemForm.value.amount,
        request_approval_from: this.itemForm.value.request_approval_from,
        category: this.itemForm.value.category,
        payment_date: this.itemForm.value.payment_date,
        approved: this.itemForm.value.approved
      };
      if (this.isEdit) {
        this.updateOrder(payload, callback);
      }
      else {
        this.createOrder(payload, callback)
      }
    }
  }

  createHistoryLogs(orderId: number) {
    const copyObj = {
      target_id: orderId,
      target_type: 'App\\Model\\PurchaseOrder',
      content: 'created purchase-order',
      action: 'created',
      cms_user_id: this.userProfile.id,
      cms_user_name: this.userProfile.full_name,
      category: 'cms'
    };
    this.purchaseOrderService$.createHistory(copyObj)
    .subscribe(res => {})
}

  formatHistory(content: string) {
    if(content.includes("Payment Date updated to")) {
      const msg = content.split(" ");
      const date = msg[msg.length-1].split("-");
      const formattedDate = date[1] +"/"+ date[2] +"/"+ date[0]; 
      content = content.replace(msg[msg.length-1], formattedDate);
      return content;
    } else {
      return content;
    }
  }

  clearPaymentDate() {
     this.itemForm.patchValue({payment_date: ""});
  }

  refreshData() {
    this.changeDetectorRefs.detectChanges();
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
