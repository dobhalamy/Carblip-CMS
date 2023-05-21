import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator, MatSnackBar } from '@angular/material';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, takeUntil, tap } from 'rxjs/operators';
import { diff } from 'deep-diff';
import { DatePipe } from '@angular/common';
import { TitleCasePipe } from '@angular/common';
import { ROLE_LIST, STATE_LIST } from 'app/core/constants';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { DealerContactModalComponent } from 'app/shared/components/dealer-contact-modal/dealer-contact-modal.component';
import { DealersModalComponent } from 'app/shared/components/dealer-modal/dealer-modal.component';
import { getYearArrayFrom } from 'app/shared/helpers/utils';
import { CmsUser } from 'app/shared/models/cmsuser.model';
import { State, Year } from 'app/shared/models/common.model';
import * as commonModels from 'app/shared/models/common.model';
import { Dealer, DealerContact } from 'app/shared/models/dealer.model';
import { NewWholesaleQuote, WholesaleQuote } from 'app/shared/models/wholesale-quote.model';
import { Request } from 'app/shared/models/request.model';
import { Brand, Model } from 'app/shared/models/vehicle.model';
import { CmsUserService } from 'app/shared/services/apis/cmsusers.service';
import { DealerService } from 'app/shared/services/apis/dealer.service';
import { ExportService } from 'app/shared/services/apis/export.service';
import { WholesaleQuoteService } from 'app/shared/services/apis/wholesale-quote.service';
import { RequestService } from 'app/shared/services/apis/requests.service';
import { VBrandService } from 'app/shared/services/apis/vbrand.service';
import { VModelService } from 'app/shared/services/apis/vmodel.service';
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { AppState } from 'app/store/';
import * as actions from 'app/store/wholesale-quote/wholesale-quote.actions';
import { didFetchSelector, fetchingSelector } from 'app/store/wholesale-quote/wholesale-quote.selectors';
import { environment } from 'environments/environment';
import { TablePagination } from 'app/shared/models/common.model';
import { initialState as initialLogState } from 'app/store/wholesale-quotelogs/wholesale-quotelog.states';
import { Filter as LogFilter, } from 'app/shared/models/log.model';
import { PurchaseOrder } from 'app/shared/models/purchase-order.model';
import { PurchaseOrderService } from 'app/shared/services/apis/purchase-order.service';
import { PurchaseOrderModalComponent } from 'app/shared/components/purchase-order-modal/purchase-order-modal.component';
import { VendorsService } from 'app/shared/services/apis/vendors.service';
import { Quote } from 'app/shared/models/quote.model';
import { UserService } from 'app/shared/services/apis/users.service';
import { dataSelector as profileDataSelector } from 'app/store/auth/authentication.selector';
import { Profile } from 'app/shared/models/user.model';

@Component({
	selector: 'app-wholesale-quote-edit',
	templateUrl: './edit.component.html',
	styleUrls: ['./edit.style.scss'],
	animations: egretAnimations,
})
export class WholesaleQuoteEditComponent implements OnInit, OnDestroy {
	@ViewChild(MatPaginator) paginator: MatPaginator;
	private onDestroy$ = new Subject<void>();

	public isEdit: Boolean = false;

	public wholesalequoteId: any = '';
	public registerUserId: string;
	public isReady: boolean;
	public wholesalequote: WholesaleQuote;
	public itemForm: FormGroup;
	public saving: Boolean = false;
	public showExtraExpense: Boolean = false;

	public request: Request;
	public loadingMake: Boolean = false;
	public loadingModel: Boolean = false;
	public loadingWsMake: Boolean = false;
	public loadingWsModel: Boolean = false;

	public dealerId: string;

	public dealers: Array<Dealer>;

	public dealerFilterCtrl: FormControl = new FormControl();

	public filteredDealers: Array<Dealer>;

	public dealerContacts: Array<DealerContact>;
	public dealerContactFilterCtrl: FormControl = new FormControl();
	public filteredDealerContacts: Array<DealerContact>;

	public wholesaleUsers: Array<CmsUser>;
	public wholesaleUserFilterCtrl: FormControl = new FormControl();
	public filteredwholesaleUsers: Array<CmsUser>;

	public newcarUsers: Array<CmsUser>;
	public newcarUserFilterCtrl: FormControl = new FormControl();
	public filterednewcarUsers: Array<CmsUser>;

	public purchaseOrder: Array<PurchaseOrder>;
	public purchaseOrderFilterCtrl: FormControl = new FormControl();
	public filteredPurchaseOrder: Array<PurchaseOrder>;
	public purchaseOrderId: number;
	public purchaseOrderTotal = 0;

	public quotes: Array<Quote>;
	public quoteFilterCtrl: FormControl = new FormControl();
	public filteredQuotes: Array<Quote>;

	public states: Array<State> = STATE_LIST;
	public stateFilterCtrl: FormControl = new FormControl();
	public filteredStates: Array<State>;

	public years: Array<Year> = getYearArrayFrom(2011);
	public yearFilterCtrl: FormControl = new FormControl();
	public filteredYears: Array<Year>;

	public makes: Array<Brand>;
	public makeFilterCtrl: FormControl = new FormControl();
	public filteredMakes: Array<Brand>;

	public models: Array<Model>;
	public modelFilterCtrl: FormControl = new FormControl();
	public filteredModels: Array<Model>;

	public contactOnwerIds: Array<Number>;

	public dealerContactInfo: DealerContact;

	public onClose: Subject<boolean>;

	public showHistory = [];
	public userProfile: any = {};
	public didFetch$: Observable<any>;
	public fetching$: Observable<any>;
	public allData;
	public oldPurchaseOrderIds;
	public logFilter: LogFilter = initialLogState.filter;
	public logMeta: commonModels.Meta = initialLogState.meta;
	public logPagination: TablePagination = {
		length: initialLogState.meta.total,
		pageIndex: initialLogState.filter.page,
		pageSize: initialLogState.filter.per_page,
		previousPageIndex: 0,
	};
	public wholesalequoteLogParam: any = {
		order_by: 'created_at',
		order_dir: 'desc',
		page: 1,
		per_page: 10,
	};

	public purchaseOrderInfo: any = {}
	public vendorInfo;
	public fetchPurchaseOrder;
	public disablePurchaseOrderId = null;
	public addHistoryData;
	public showDatalastPage: boolean = true;
	public allowanceFrom;
	public userData: any;
	public newCarAllowancePreviosValue: number;
	public newCarAllowanceQuoteId: number;
	public newCarAllowanceQuoteIds = [];
	public allowanceChargedClient = [];

	constructor(
		private store$: Store<AppState>,
		private route$: ActivatedRoute,
		private authService$: AuthService,
		private changeDetectorRefs: ChangeDetectorRef,
		private dialog: MatDialog,
		private loader$: AppLoaderService,
		private confirmService$: AppConfirmService,
		private service$: WholesaleQuoteService,
		private brandService$: VBrandService,
		private modelService$: VModelService,
		private dealerServicer$: DealerService,
		private cmsUserServicer$: CmsUserService,
		private exportService$: ExportService,
		private requestService$: RequestService,
		private fb: FormBuilder,
		private location$: Location,
		private snack$: MatSnackBar,
		public datepipe: DatePipe,
		public titleCasePipe: TitleCasePipe,
		private purchaseOrderServicer$: PurchaseOrderService,
		private vendorService$: VendorsService,
		private router: Router,
		private userService$: UserService

	) {
		const contactOwnerRoles = ROLE_LIST.filter(
			item => item.name === 'salesperson' || item.name === 'concierge' || item.name === 'manager'
		);
		this.contactOnwerIds = contactOwnerRoles.map(item => item.id);
		this.didFetch$ = this.store$.select(didFetchSelector);
		this.fetching$ = this.store$.select(fetchingSelector);
	}

	public canDeactivate() {
		return !this.itemForm.dirty;
	}

	ngOnDestroy() {
		this.onDestroy$.next();
		this.onDestroy$.complete();
		return false;
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

		this.onClose = new Subject();
		this.isReady = false;
		this.wholesalequote = {};
		this.route$.paramMap.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
			setTimeout(() => {
				// this.loader$.open();
			}, 10);

			if (params.get('id')) {
				this.wholesalequoteId = params.get('id');
				this.isEdit = true;
				this.getHistoryList(this.wholesalequoteLogParam);
			}

			this.registerUserId = params.get('registerUserId');
			if (this.registerUserId) {
				this.getUserById();
				this.initData();
				this.filterQuotes();
			} else {
				this.initData();
			}
		});

		// listen for search field value changes for wholesaleUser
		this.wholesaleUserFilterCtrl.valueChanges
			.pipe(
				debounceTime(500),
				takeUntil(this.onDestroy$)
			)
			.subscribe(() => {
				this.filterwholesaleUsers();
			});

		// listen for search field value changes for newcarUser
		this.newcarUserFilterCtrl.valueChanges
			.pipe(
				debounceTime(500),
				takeUntil(this.onDestroy$)
			)
			.subscribe(() => {
				this.filternewcarUsers();
			});

		// listen for search field value changes for dealer
		this.dealerFilterCtrl.valueChanges
			.pipe(
				debounceTime(500),
				takeUntil(this.onDestroy$)
			)
			.subscribe(() => {
				this.filterDealers();
			});

		// listen for search field value changes for dealer contact
		this.dealerContactFilterCtrl.valueChanges
			.pipe(
				debounceTime(500),
				takeUntil(this.onDestroy$)
			)
			.subscribe(() => {
				this.filterDealerContacts();
			});

		// listen for search field value changes for state
		this.stateFilterCtrl.valueChanges
			.pipe(
				debounceTime(10),
				takeUntil(this.onDestroy$)
			)
			.subscribe(() => {
				this.filterStates();
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
	}

	initLogMeta(meta) {
		this.logPagination.length = meta.total;
		this.logPagination.pageIndex = meta.current_page - 1;
		this.logPagination.pageSize = meta.per_page;
	}

	onLogPaginateChange(event) {
		this.showDatalastPage = !this.paginator.hasNextPage();
		this.wholesalequoteLogParam.page = event.pageIndex + 1;
		this.wholesalequoteLogParam.per_page = event.pageSize;
		/* if not use then comment this line */
		this.getHistoryList(this.wholesalequoteLogParam);
		/* if not use then comment this line */
	}

	getHistoryList(quotePage) {
		combineLatest(this.service$.getHistory(this.wholesalequoteId, quotePage),)
			.pipe(
				takeUntil(this.onDestroy$),
				map(result => result),
				catchError(err => { return of(err); })
			)
			.subscribe(([result]) => {
				this.loader$.close();
				this.showHistory = result.data;
				this.initLogMeta(result.meta);
				this.refreshData();
			});
	}

	initData() {
		if (this.isEdit) {
			combineLatest(this.service$.getById(this.wholesalequoteId))
				.pipe(
					takeUntil(this.onDestroy$),
					map(result => result),
					catchError(err => {
						return of(err);
					})
				)
				.subscribe(([result]) => {
					this.wholesalequote = result.data;
					const convertedDate = this.datepipe.transform(`${this.wholesalequote.created_at}`, 'dd/MM/yy ,h:mm a');
					const splitDateTime = convertedDate.split(',');
					// this.addHistoryData = `Version 1 ${this.userProfile.full_name} created quote ${this.wholesalequote.id} on ${splitDateTime[0]} at ${splitDateTime[1]}`;
					this.buildItemForm(this.wholesalequote);
					this.allData = this.itemForm.value;
					this.purchaseOrderTotal = this.getTotalPurchaseOrderCost();
					this.loader$.close();
					this.isReady = true;
				});
		} else {
			this.buildItemForm(null);
			this.allData = this.itemForm.value;
			this.loader$.close();
			this.isReady = true;
		}
	}

	onwholesaleUserFilterChange() {
		this.refreshData();
	}

	onnewcarUserFilterChange() {
		this.refreshData();
	}

	onQuoteFilterChange(val) {
		this.allowanceChargedClient = [];
		this.newCarAllowanceQuoteIds = [];
		let sumOfallowanceChargedClient = 0;
		this.itemForm.get('newCarAllowance').value.map( (value,i) => {
			if(value.quote_id !== '') {
				this.newCarAllowanceQuoteIds.push(value.quote_id);
				let quote = this.quotes.find(
					item => item.id === value.quote_id
				);
				this.allowanceFrom = quote;
				this.allowanceChargedClient.push(quote);	
			}
		});

		if(this.allowanceChargedClient.length > 0) {
			this.allowanceChargedClient.forEach( quote=> {
				sumOfallowanceChargedClient = sumOfallowanceChargedClient + Number(quote.allowance_chargedclient);
			})
		}
		
		if ((val != null || val != undefined) && this.itemForm != undefined) {
			const temp = this.filteredQuotes.filter((item) => {
				return this.itemForm.value['quote_id'] == item.id
			})
			this.filteredQuotes.map(item => temp.includes(item) ? item['selected'] = true : item['selected'] = false);
		}
		if (val) {
			this.itemForm.patchValue({
				quote_id: val,
			});
		}
		// this.allowanceFrom = this.quotes.find(
		// 	item => item.id === this.itemForm.value.quote_id
		// );
		if(this.allowanceFrom !== undefined) {
			this.allowanceFrom['allowance_chargedclientUpdate'] = sumOfallowanceChargedClient;
		}
		
		this.refreshData();
	}

	filterwholesaleUsers() {
		this.wholesaleUsers = [];
		// get the search keyword
		const search = this.wholesaleUserFilterCtrl.value || '';
		const cmsUserParam = {
			roles: this.contactOnwerIds,
			search,
		};

		this.cmsUserServicer$
			.getListByFilter(cmsUserParam)
			.subscribe(({ data }) => {
				this.wholesaleUsers = data;
				this.filteredwholesaleUsers = this.wholesaleUsers.slice(0);
				this.onwholesaleUserFilterChange();
			});
		// filter the makes
	}


	filternewcarUsers() {
		this.newcarUsers = [];
		// get the search keyword
		const search = this.newcarUserFilterCtrl.value || '';
		const cmsUserParam = {
			register_user_id: this.registerUserId,
			search,
		};

		this.cmsUserServicer$
			.getListByFilter(cmsUserParam)
			.subscribe(({ data }) => {
				this.newcarUsers = data;
				this.filterednewcarUsers = this.newcarUsers.slice(0);
				this.onnewcarUserFilterChange();
			});
		// filter the makes
	}

	filterQuotes(newId = null) {
		this.quotes = [];
		// get the search keyword
		const search = this.quoteFilterCtrl.value || '';
		const quoteParam = {
			order_by: 'id',
			order_dir: 'desc',
			page: 1,
			per_page: 30,
			search,
			user_id: this.registerUserId,
			wholesale_quote_id: this.wholesalequoteId

		};
		this.service$.getQuotesByRegisterUser(quoteParam)
			.subscribe(({ data }) => {
				this.quotes = data;
				this.filteredQuotes = this.quotes.slice(0);
				this.onQuoteFilterChange(newId);
			});
	}

	onDealerFilterChange(val) {
		if (val) {
			this.itemForm.patchValue({
				dealer_id: val,
				dealer_contact_id: 0,
			});
		}
		this.dealerId = this.itemForm.value.dealer_id;
		this.filterDealerContacts();
		this.refreshData();
	}

	/** Filter Dealers
		* @return
		**/

	filterDealers(newId = null) {
		this.dealers = [];
		// get the search keyword
		const search = this.dealerFilterCtrl.value || '';

		const dealerParam = {
			order_by: 'name',
			order_dir: 'asc',
			page: 1,
			per_page: 30,
			search,
		};

		this.dealerServicer$.getList(dealerParam).subscribe(({ data }) => {
			this.dealers = data;
			this.filteredDealers = this.dealers.slice(0);
			this.onDealerFilterChange(newId);
		});
		// filter the makes
	}

	onDealerContactFilterChange(val) {
		if (val) {
			this.itemForm.patchValue({
				dealer_contact_id: val,
			});
		}
		this.dealerContactInfo = this.dealerContacts.find(
			item => item.id === this.itemForm.value.dealer_contact_id
		);
		this.refreshData();
	}

	filterDealerContacts(newId = null) {
		this.dealerContacts = [];
		const search = this.dealerContactFilterCtrl.value || '';
		const contactParam = {
			dealer_id: this.itemForm.value.dealer_id,
			order_by: 'created_at',
			order_dir: 'desc',
			page: 1,
			per_page: 30,
			search,
		};

		this.dealerServicer$.getListContacts(contactParam).subscribe(({ data }) => {
			this.dealerContacts = data;
			this.filteredDealerContacts = this.dealerContacts.slice(0);

			this.onDealerContactFilterChange(newId);
		});
	}

	initStateFilter() {
		this.filteredStates = this.states.slice(0);
	}

	onStateFilterChange() { }

	/** Filter states
		* @param Number item
		* @return
		**/

	filterStates() {
		if (!this.states) {
			return;
		}
		// get the search keyword
		let search = this.stateFilterCtrl.value;
		if (!search) {
			this.filteredStates = this.states.slice(0);
			return;
		} else {
			search = search.toLowerCase();
		}

		// filter the states
		this.filteredStates = this.states.filter(
			item => item.label.toLowerCase().indexOf(search) > -1
		);
		this.refreshData();
	}

	initYearFilter() {
		this.filteredYears = this.years.slice(0);
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
			search = search.toString().toLowerCase();
		}

		// filter the banks
		this.filteredYears = this.years.filter(
			item => item.name.toLowerCase().indexOf(search) > -1
		);
		this.refreshData();
		this.initMakeFilter();
	}

	initMakeFilter() {
		this.makes = [];
		this.models = [];
		this.filteredMakes = [];
		this.filteredModels = [];
		this.loadingMake = true;

		const yearItem = this.years.find(
			item =>
				item.name ===
				(this.yearFilterCtrl.value ? this.yearFilterCtrl.value.toString() : '')
		);
		if (yearItem) {
			this.brandService$
				.getAllByYear({
					year: this.yearFilterCtrl.value,
				})
				.subscribe(data => {
					this.makes = data.data || [];
					this.makes.sort((a, b) => {
						return a.name.localeCompare(b.name);
					});
					this.filteredMakes = this.makes.slice(0);
					this.initModelFilter();
					this.loadingMake = false;
					this.refreshData();
				});
		} else {
			this.loadingMake = false;
			this.refreshData();
		}
	}

	onMakeFilterChange(val) {
		this.initModelFilter();
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
		this.onMakeFilterChange(search);
		this.refreshData();
	}

	initModelFilter() {
		this.models = [];
		this.filteredModels = [];
		this.loadingModel = true;
		const makeItem = this.makes.find(
			item => item.name === this.makeFilterCtrl.value
		);

		if (makeItem) {
			this.modelService$
				.getAllByBrandYear({
					brand_id: makeItem.id,
					year: this.yearFilterCtrl.value,
				})
				.subscribe(data => {
					this.models = data.data || [];
					this.models.sort((a, b) => {
						return a.name.localeCompare(b.name);
					});
					this.filteredModels = this.models.slice(0);
					this.loadingModel = false;
					this.refreshData();
				});
		} else {
			this.loadingModel = false;
			this.refreshData();
		}
	}

	filterModels() {
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
		this.refreshData();
	}

	get customersWholeSale(): FormArray {
		return this.itemForm.get('customersWholeSale') as FormArray;
	}

	get newCarAllowance(): FormArray {
		return this.itemForm.get('newCarAllowance') as FormArray;
	}

	get expenseChargedClient(): FormArray {
		return this.itemForm.get('expenseChargedClient') as FormArray;
	}

	get expenseChargedDealer(): FormArray {
		return this.itemForm.get('expenseChargedDealer') as FormArray;
	}

	get expenseVendor(): FormArray {
		return this.itemForm.get('expenseVendor') as FormArray;
	}

	get purchaseOrderList(): FormArray {
		return this.itemForm.get('purchaseOrderList') as FormArray;
	}

	buildItemForm(item: WholesaleQuote) {
		const currentYear = new Date().getFullYear();
		let formFields = {};
		const defaultYear = this.request ? Number(this.request.year) : '',
			defaultMake = this.request ? this.request.brand : '',
			defaultModel = this.request ? this.request.model : '',
			defaultContactOwernId = this.request ? this.request.contact_owner_id : ''
		if (this.isEdit) {
			this.registerUserId = item.user_id
			this.getUserById();
			this.newCarAllowancePreviosValue = item.allowance_to_new;
			this.newCarAllowanceQuoteId = item.quote_id;
			formFields = {
				wholesale_stock_no: [item.wholesale_stock_no, Validators.required],
				wholesale_sale_id: [item.wholesale_sale_id || ''],
				newcar_sale_id: [item.newcar_sale_id || ''],
				dealer_id: [item.dealer_id || ''],
				dealer_contact_id: [item.dealer_contact_id || ''],
				quote_id: [item.quote_id || ''],
				address: [item.address],
				city: [item.city],
				state: [item.state],
				zip: [item.zip],
				sale_date: [item.sale_date],
				year: [item.year],
				make: [item.make],
				model: [item.model],
				vin: [item.vin],
				sold_to: [item.sold_to],
				client_name: [item.client_name],
				// auction_fee: [item.auction_fee],
				sale_amount: [item.sale_amount],
				payoff_amount: [item.payoff_amount],
				paid_by: [item.paid_by],
				title_payoff_date: [item.title_payoff_date],
				title_receive_date: [item.title_receive_date],
				allowance_to_new: [item.allowance_to_new],
				check_to_client: [item.check_to_client],
				check_to_client_at: [item.check_to_client_at],
				customersWholeSale: this.fb.array(
					this.getCustomerWholeSaleGroup(item.customersWholeSale),
					[]
				),
				// check_to_dealer: [item.check_to_dealer],
				gross_profit: [item.gross_profit],
				repairs: [item.repairs],
				net_amount: [item.net_amount],
				company_net: [item.company_net],
				wholesale_commission: [item.wholesale_commission],
				pack_fee: [item.pack_fee],
				newcar_commission: [item.newcar_commission],
				notes: [item.notes],
				expenseChargedClient: this.fb.array(
					this.getExpenseChargedClientGroup(item.expenseChargedClient),
					[]
				),
				expenseChargedDealer: this.fb.array(
					this.getExpenseChargedDealerGroup(item.expenseChargedDealer),
					[]
				),
				// allowance_chargedclient: [item.allowance_chargedclient],
				// remaining_payments_chargedclient: [
				// 	item.remaining_payments_chargedclient,
				// ],
				// payment_chargedclient: [item.payment_chargedclient],
				expenseVendor: this.fb.array(
					this.getExpenseVendorGroup(item.expenseVendor),
					[]
				),
				newCarAllowance: this.fb.array(
					this.getNewCarAllowance(item.newCarAllowance),
					[]
				)
			};
		}
		else {
			formFields = {
				wholesale_stock_no: ['', Validators.required],
				wholesale_sale_id: [defaultContactOwernId],
				newcar_sale_id: [defaultContactOwernId],
				dealer_id: [''],
				dealer_contact_id: [''],
				quote_id: [''],
				address: [''],
				city: [''],
				state: [''],
				zip: [''],
				sale_date: [''],
				year: [defaultYear],
				make: [defaultMake],
				model: [defaultModel],
				vin: [''],
				sold_to: [''],
				client_name: [''],
				// auction_fee: [''],
				sale_amount: [''],
				payoff_amount: [''],
				paid_by: [''],
				title_payoff_date: [''],
				title_receive_date: [''],
				allowance_to_new: [''],
				check_to_client: [''],
				check_to_client_at: [''],
				// check_to_dealer: [''],
				gross_profit: [''],
				repairs: [''],
				net_amount: [''],
				company_net: [''],
				wholesale_commission: [''],
				pack_fee: [''],
				newcar_commission: [''],
				notes: [''],
				customersWholeSale: this.fb.array(
					this.getCustomerWholeSaleGroup([{}]),
					[]
				),
				expenseChargedClient: this.fb.array(
					this.getExpenseChargedClientGroup([{}]),
					[]
				),
				expenseChargedDealer: this.fb.array(
					this.getExpenseChargedDealerGroup([{}]),
					[]
				),
				// allowance_chargedclient: [''],
				// remaining_payments_chargedclient: [''],
				// payment_chargedclient: [''],
				expenseVendor: this.fb.array(this.getExpenseVendorGroup([{}]), []),
				newCarAllowance: this.fb.array(this.getNewCarAllowance([{}]),[])
			};
		}
		this.itemForm = this.fb.group(formFields);

		this.itemForm.get('newCarAllowance').valueChanges.subscribe(values => {
			let allowance = []
			values.map(control => {
			  allowance.push(control.allowance_to_new);
			})
			let sum = allowance.reduce((a, b) => Number(a) + Number(b), 0)
			this.itemForm.patchValue({allowance_to_new : sum});
		});
		
		this.initStateFilter();
		this.initYearFilter();
		// this.wsInitYearFilter();

		if (this.isEdit) {
			if (item.make) {
				this.makeFilterCtrl.setValue(item.make);
			}

			if (item.model) {
				this.modelFilterCtrl.setValue(item.model);
			}

			if (item.year) {
				this.yearFilterCtrl.setValue(item.year);
				this.initMakeFilter();
			}

		}
		else {
			if (defaultYear) {
				this.yearFilterCtrl.setValue(defaultYear);
				this.initMakeFilter();
			}

			if (defaultMake) {
				this.makeFilterCtrl.setValue(defaultMake);
				this.initMakeFilter();
			}

			if (defaultModel) {
				this.modelFilterCtrl.setValue(defaultModel);
			}
		}

		this.filterDealers();
		this.filterwholesaleUsers();
		this.filternewcarUsers();
		this.filterQuotes();
	}

	// Extra Expenses Vendor Name
	createExpenseVendorGroup() {
		return this.fb.group({
			name: [''],
			po_number: [''],
			amount: [''],
			actual_cost_type: ['']
		});
	}

	getExpenseVendorGroup(data: any) {
		if (data) {
			return data.map(item => {
				return this.fb.group({
					name: [item['name'] || ''],
					po_number: [item['po_number'] || ''],
					amount: [Number(item['amount']).toFixed(2) || ''],
					actual_cost_type: [item['actual_cost_type'] || '']
				});
			});
		}
		return [
			this.fb.group({
				name: '',
				po_number: '',
				amount: '',
				actual_cost_type: ''
			}),
		];
	}

	addExpenseVendorGroup() {
		const fg = this.createExpenseVendorGroup();
		this.expenseVendor.push(fg);
	}
	deleteExpenseVendorGroup(idx: number) {
		this.expenseVendor.removeAt(idx);
		// this.onPurchaseOrderFilterChange(idx);

	}

	// Extra Expenses Charged Client
	createExpenseChargedClientGroup() {
		return this.fb.group({
			item: [''],
			charge: [''],
		});
	}

	// Extra Expenses Charged Dealer
	createExpenseChargedDealerGroup() {
		return this.fb.group({
			item: [''],
			charge: [''],
		});
	}

	getExpenseChargedClientGroup(data: Array<object>) {
		if (data.length) {
			return data.map(item => {
				return this.fb.group({
					item: [item['item'] || ''],
					charge: [item['charge'] || ''],
				});
			});
		}
		return [
			this.fb.group({
				item: '',
				charge: '',
			}),
		];
	}

	addExpenseChargedClientGroup() {
		const fg = this.createExpenseChargedClientGroup();
		this.expenseChargedClient.push(fg);
	}
	deleteExpenseChargedClientGroup(idx: number) {
		this.expenseChargedClient.removeAt(idx);
	}

	getExpenseChargedDealerGroup(data: Array<object>) {
		if (data.length) {
			return data.map(item => {
				return this.fb.group({
					item: [item['item'] || ''],
					charge: [item['charge'] || ''],
				});
			});
		}
		return [
			this.fb.group({
				item: '',
				charge: '',
			}),
		];
	}

	addExpenseChargedDealerGroup() {
		const fg = this.createExpenseChargedDealerGroup();
		this.expenseChargedDealer.push(fg);
	}
	deleteExpenseChargedDealerGroup(idx: number) {
		this.expenseChargedDealer.removeAt(idx);
	}

	// Whole Sale
	createCustomerWholeSaleGroup() {
		return this.fb.group({
			amount: [''],
			paid_to: [''],
			date: [''],
			payment_type: [''],
			check_number: [''],
			notes: [''],
		});
	}


	createNewCarAllowance() {
		return this.fb.group({
			quote_id: [''],
			allowance_to_new: ['', Validators.required]
		});
	}

	getCustomerWholeSaleGroup(data: Array<object>) {
		if (data && data.length) {
			return data.map(item => {
				return this.fb.group({
					amount: [item['amount'] || ''],
					paid_to: [item['paid_to'] || ''],
					date: [item['date'] || ''],
					payment_type: [item['payment_type'] || ''],
					check_number: [item['check_number'] || ''],
					notes: [item['notes'] || ''],
				});
			});
		}
		return [
			this.fb.group({
				amount: '',
				paid_to: '',
				date: '',
				payment_type: '',
				check_number: '',
				notes: '',
			}),
		];
	}

	addCustomerWholeSaleGroup() {
		const fg = this.createCustomerWholeSaleGroup();
		this.customersWholeSale.push(fg);
	}
	deleteCustomerWholeSaleGroup(idx: number) {
		this.customersWholeSale.removeAt(idx);
	}

	addNewCarAllowance() {
		const fg = this.createNewCarAllowance();
		this.newCarAllowance.push(fg);
	}

	deleteNewCarAllowance(idx: number) {
		this.newCarAllowance.removeAt(idx);
		this.newCarAllowanceQuoteIds = [];
		this.onQuoteFilterChange(idx);
	}

	addNewDealer() {
		const title = 'Add New Dealer';
		const dialogRef: MatDialogRef<any> = this.dialog.open(
			DealersModalComponent,
			{
				width: '768px',
				disableClose: true,
				data: {
					title: title,
					payload: {},
					type: 'add',
				},
			}
		);
		dialogRef.afterClosed().subscribe(res => {
			if (!res) {
				return;
			}
			this.filterDealers(res.id);
		});
	}

	addNewDealerContact() {
		const title = 'Add New Dealer Contact';
		const dialogRef: MatDialogRef<any> = this.dialog.open(
			DealerContactModalComponent,
			{
				width: '768px',
				disableClose: true,
				data: {
					title: title,
					payload: {
						dealerId: this.itemForm.value.dealer_id,
					},
					type: 'add',
				},
			}
		);
		dialogRef.afterClosed().subscribe(res => {
			if (!res) {
				return;
			}
			this.filterDealerContacts(res.id);
		});
	}

	submit(callback?: Function) {
		this.itemForm.controls.year.setValue(this.yearFilterCtrl.value);
		this.itemForm.controls.make.setValue(this.makeFilterCtrl.value);
		const quote: WholesaleQuote = {
			...this.itemForm.value,
			make: this.makeFilterCtrl.value,
			model: this.modelFilterCtrl.value,
			gross_profit: this.getGross(),
			net_amount: this.getNet(),
			wholesale_commission_amount: this.getWholesaleCommission(),
			newcar_commission_amount: this.getNewCarCommission(),
			company_net: this.getCompanyNet(),
			invoice_dealer_expensevendor: this.getInvoiceDealer(),
			invoice_client_expensevendor: this.getInvoiceClient(),
			check_to_dealer_expensevendor: this.getCheckToDealer(),
			check_to_client_expensevendor: this.getCheckToClient(),
		};
		// delete quote['purchaseOrderList'];
		if (this.isEdit) {
			const param: WholesaleQuote = { ...quote };
			this.updateQuote(param, callback);
		}
		else {
			const param: any = {
				// register_user_id: parseInt(this.registerUserId),
				data: { ...quote, user_id: parseInt(this.registerUserId) },
			};
			this.createQuote(param, callback);
		}
	}


	updateQuote(quote: WholesaleQuote, callback) {
		if (this.itemForm.valid) {
			this.saving = true;
			this.loader$.open();
			this.service$
				.update(this.wholesalequoteId, quote)
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
					if (res.success) {
						const temp: WholesaleQuote = {
							...this.allData,
							make: this.makeFilterCtrl.value,
							model: this.modelFilterCtrl.value,
							gross_profit: this.getGross(),
							net_amount: this.getNet(),
							wholesale_commission_amount: this.getWholesaleCommission(),
							newcar_commission_amount: this.getNewCarCommission(),
							company_net: this.getCompanyNet(),
							invoice_dealer_expensevendor: this.getInvoiceDealer(),
							invoice_client_expensevendor: this.getInvoiceClient(),
							check_to_dealer_expensevendor: this.getCheckToDealer(),
							check_to_client_expensevendor: this.getCheckToClient(),

						};
						this.saveHistoryLog(temp, quote);
						this.allData = this.itemForm.value;
						this.itemForm.markAsPristine();
						this.store$.dispatch(new actions.GetList());
						if (callback) {
							callback();
						}
						this.refreshData();
					}
				});
		} else {
			this.snack$.open('Fill all the details', 'OK', {
				duration: 4000,
			});
		}
	}

	createQuote(quote: NewWholesaleQuote, callback) {
		if (this.itemForm.valid) {
			this.saving = true;
			this.loader$.open();
			this.service$
				.create(quote)
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
					if (res.success) {
						let wholesalequoteid = res.data.id;
						this.createHistoryLogs(wholesalequoteid);
						this.itemForm.markAsPristine();
						this.store$.dispatch(new actions.GetList());
						if (callback) {
							callback();
						}
						setTimeout(() => {
							this.location$.back();
						}, 100);
					}
				});
		} else {
			this.snack$.open('Fill all the details', 'OK', {
				duration: 4000,
			});
		}
	}

	createHistoryLogs(wholesalequoteid: number) {
		const copyObj = {
		  target_id: wholesalequoteid,
		  target_type: 'App\\Model\\WholeSaleQuote',
		  content: 'created a wholesale quote',
		  action: 'created',
		  cms_user_id: this.userProfile.id,
		  cms_user_name: this.userProfile.full_name,
		  category: 'cms'
		};
		this.service$.createHistory(copyObj)
		.subscribe(res => {})
	}

	getTitle() {
		if (this.isEdit) {
			return `Wholesale Quote ${this.wholesalequoteId} Edit`;
		} else {
			return `Add Wholesale Quote`;
		}
	}

	getUserById() {
		this.userService$.getById(this.registerUserId).pipe(
			takeUntil(this.onDestroy$),
			map(result => result),
			catchError(err => {
				return of(err);
			})
		)
			.subscribe(result => {
				this.userData = result.data;
			});
	}
	redirectToUser() {
		this.router.navigate([`/users/${this.registerUserId}`]);
	}
	redirectToQuote(id: number) {
		this.router.navigate([`/quotes/${id}/edit`]);
	}
	// getTotalPaymentChargedClient() {
	// 	return (
	// 		this.itemForm.value.remaining_payments_chargedclient *
	// 		this.itemForm.value.payment_chargedclient
	// 	);
	// }

	getTotalChargedClient() {
		const data = this.itemForm.value.expenseChargedClient;
		if (!data) {
			return 0;
		}
		return data.reduce((total, item) => {
			return total + Number(item['charge']);
		}, 0);
	}

	getTotalChargedClientAll() {
		return (
			// Number(this.getTotalPaymentChargedClient()) +
			Number(this.getTotalChargedClient())
			// +
			// Number(this.itemForm.value.allowance_chargedclient)
		);
	}

	getTotalChargedDealer() {
		const data = this.itemForm.value.expenseChargedDealer;
		if (!data) {
			return 0;
		}
		return data.reduce((total, item) => {
			return total + Number(item['charge']);
		}, 0);
	}

	getTotalChargedDealerAll() {
		return Number(this.getTotalChargedDealer());
	}

	getTotalCustomerPayment(type) {
		const data = this.itemForm.value.customersWholeSale;
		if (!data) {
			return 0;
		}
		return data.reduce((total, item) => {
			let amount = 0;
			if (
				(type === 'dealer' && item['paid_to'] === '1') ||
				(type === 'carblip' && item['paid_to'] === '2') ||
				!type
			) {
				amount = Number(item['amount']);
			}
			return total + amount;
		}, 0);
	}

	getTotalActualCost() {
		let data = null;
		if (this.itemForm != undefined) {
			data = this.itemForm.value.expenseVendor;
		}
		if (!data) {
			return 0;
		}
		return data.reduce((total, item) => {
			const parsedNumber = Number(item['amount']);
			if (isNaN(parsedNumber)) return total;
			return total + parsedNumber;
		}, 0);
	}

	getTotalPurchaseOrderCost() {
		let data = null;
		if (this.itemForm != undefined) {
			data = this.itemForm.value.purchaseOrderList;
		}
		if (!data) {
			return 0;
		}
		return data.reduce((total, item) => {
			if (Object.keys(item['purchase_order']).length) {
				return total + Number(item['purchase_order']['amount']);
			}
			else {
				return total + Number(0);
			}
		}, 0);
	}
	displayFn(id?: WholesaleQuote): number | undefined {
		return id ? id.id : undefined;
	}
	getGross() {
		let paidByMinus = this.itemForm.value.paid_by == 1 ? this.itemForm.value.payoff_amount : 0;
		let allowanceFrom = (this.allowanceFrom && this.allowanceFrom.allowance_chargedclientUpdate) != undefined ? Number(this.allowanceFrom.allowance_chargedclientUpdate) : 0;
		let checkToClient = this.itemForm.value.paid_by == 1 ? 0 : this.itemForm.value.check_to_client;
		return (
			Number(this.itemForm.value.sale_amount)
			+
			Number(allowanceFrom)
			-
			Number(this.itemForm.value.allowance_to_new)
			-
			Number(checkToClient)
			+
			Number(this.getTotalChargedClientAll())
			+
			Number(this.getTotalChargedDealerAll())
			-
			Number(paidByMinus)
		)
	}

	getActualCostForSupplier() {
		const data = this.itemForm.value.expenseVendor;
		if (!data) {
			return 0;
		}
		return data.reduce((total, item) => {
			let amount = 0;
			if (
				(item['actual_cost_type'] === '1')) {
				amount = Number(item['amount']);
			}
			return total + amount;
		}, 0);
	}


	getActualCostForVendor() {
		const data = this.itemForm.value.expenseVendor;
		if (!data) {
			return 0;
		}
		return data.reduce((total, item) => {
			let amount = 0;
			if (
				(item['actual_cost_type'] === '2')) {
				amount = Number(item['amount']);
			}
			return total + amount;
		}, 0);
	}
	getNet() {
		/* gross Equation */
		let grossPaidByMinus = this.itemForm.value.paid_by == 1 ? this.itemForm.value.payoff_amount : 0;
		let grossAllowanceFrom = (this.allowanceFrom && this.allowanceFrom.allowance_chargedclientUpdate) != undefined ? Number(this.allowanceFrom.allowance_chargedclientUpdate) : 0;
		let grossCheckToClient = this.itemForm.value.paid_by == 1 ? 0 : this.itemForm.value.check_to_client;
		let grossFinalValue = (Number(this.itemForm.value.sale_amount)
			+
			Number(grossAllowanceFrom)
			-
			Number(this.itemForm.value.allowance_to_new)
			-
			Number(grossCheckToClient)
			+
			Number(this.getTotalChargedClientAll())
			+
			Number(this.getTotalChargedDealerAll())
			-
			Number(grossPaidByMinus));
		/* gross Equation */

		let netPaidByMinus = this.itemForm.value.paid_by == 3 || this.itemForm.value.paid_by == 4 || this.itemForm.value.paid_by == 5 ? this.itemForm.value.payoff_amount : 0
		return (
			Number(grossFinalValue) -
			Number(this.getActualCostForSupplier()) -
			Number(this.getActualCostForVendor()) -
			Number(netPaidByMinus)
		)
	}


	getComission() {

		/* gross Equation */
		let grossPaidByMinus = this.itemForm.value.paid_by == 1 ? this.itemForm.value.payoff_amount : 0;
		let grossAllowanceFrom = (this.allowanceFrom && this.allowanceFrom.allowance_chargedclientUpdate) != undefined ? Number(this.allowanceFrom.allowance_chargedclientUpdate) : 0;
		let grossCheckToClient = this.itemForm.value.paid_by == 1 ? 0 : this.itemForm.value.check_to_client;
		let grossFinalValue = (Number(this.itemForm.value.sale_amount)
			+
			Number(grossAllowanceFrom)
			-
			Number(this.itemForm.value.allowance_to_new)
			-
			Number(grossCheckToClient)
			+
			Number(this.getTotalChargedClientAll())
			+
			Number(this.getTotalChargedDealerAll())
			-
			Number(grossPaidByMinus));
		/* gross Equation */

		let netPaidByMinus = this.itemForm.value.paid_by == 3 || this.itemForm.value.paid_by == 4 || this.itemForm.value.paid_by == 5 ? this.itemForm.value.payoff_amount : 0
		let netFinalValue = (
			Number(grossFinalValue) -
			Number(this.getActualCostForSupplier()) -
			Number(this.getActualCostForVendor()) -
			Number(netPaidByMinus)
		)

		let value;
		const net = Number(netFinalValue),
			pack = Number(this.itemForm.value.pack_fee),
			percent = Number(this.itemForm.value.wholesale_commission),
			newPercent = Number(this.itemForm.value.newcar_commission);
		// let value = ((net - pack) * percent) / 100;
		value = net;
		if (percent > 0) {
			value = (value - (net * percent) / 100);
		}

		if (pack > 0) {
			value = value + pack;
			if (newPercent > 0) {
				value = (value - (value * newPercent) / 100);
			}
		}

		if (value < 0) {
			value = 0;
		}
		return value;
	}
	getWholesaleCommission() {
		/* gross Equation */
		let grossPaidByMinus = this.itemForm.value.paid_by == 1 ? this.itemForm.value.payoff_amount : 0;
		let grossAllowanceFrom = (this.allowanceFrom && this.allowanceFrom.allowance_chargedclientUpdate) != undefined ? Number(this.allowanceFrom.allowance_chargedclientUpdate) : 0;
		let grossCheckToClient = this.itemForm.value.paid_by == 1 ? 0 : this.itemForm.value.check_to_client;
		let grossFinalValue = (Number(this.itemForm.value.sale_amount)
			+
			Number(grossAllowanceFrom)
			-
			Number(this.itemForm.value.allowance_to_new)
			-
			Number(grossCheckToClient)
			+
			Number(this.getTotalChargedClientAll())
			+
			Number(this.getTotalChargedDealerAll())
			-
			Number(grossPaidByMinus));
		/* gross Equation */

		/* net equation */
		let netPaidByMinus = this.itemForm.value.paid_by == 3 || this.itemForm.value.paid_by == 4 || this.itemForm.value.paid_by == 5 ? this.itemForm.value.payoff_amount : 0
		let netFinalValue = (
			Number(grossFinalValue) -
			Number(this.getActualCostForSupplier()) -
			Number(this.getActualCostForVendor()) -
			Number(netPaidByMinus)
		)
		/* net equation */
		return (Number(netFinalValue) * Number(this.itemForm.value.wholesale_commission)) / 100;
	}

	getNewCarCommission() {

		/* gross Equation */
		let grossPaidByMinus = this.itemForm.value.paid_by == 1 ? this.itemForm.value.payoff_amount : 0;
		let grossAllowanceFrom = (this.allowanceFrom && this.allowanceFrom.allowance_chargedclientUpdate) != undefined ? Number(this.allowanceFrom.allowance_chargedclientUpdate) : 0;
		let grossCheckToClient = this.itemForm.value.paid_by == 1 ? 0 : this.itemForm.value.check_to_client;
		let grossFinalValue = (Number(this.itemForm.value.sale_amount)
			+
			Number(grossAllowanceFrom)
			-
			Number(this.itemForm.value.allowance_to_new)
			-
			Number(grossCheckToClient)
			+
			Number(this.getTotalChargedClientAll())
			+
			Number(this.getTotalChargedDealerAll())
			-
			Number(grossPaidByMinus));
		/* gross Equation */

		/* net equation */
		let netPaidByMinus = this.itemForm.value.paid_by == 3 || this.itemForm.value.paid_by == 4 || this.itemForm.value.paid_by == 5 ? this.itemForm.value.payoff_amount : 0
		let netFinalValue = (
			Number(grossFinalValue) -
			Number(this.getActualCostForSupplier()) -
			Number(this.getActualCostForVendor()) -
			Number(netPaidByMinus)
		)
		/* net equation */

		return ((Number(netFinalValue) - Number(this.itemForm.value.pack_fee)) * Number(this.itemForm.value.newcar_commission)) / 100;

	}

	getCompanyNet() {

		/* gross Equation */
		let grossPaidByMinus = this.itemForm.value.paid_by == 1 ? this.itemForm.value.payoff_amount : 0;
		let grossAllowanceFrom = (this.allowanceFrom && this.allowanceFrom.allowance_chargedclientUpdate) != undefined ? Number(this.allowanceFrom.allowance_chargedclientUpdate) : 0;
		let grossCheckToClient = this.itemForm.value.paid_by == 1 ? 0 : this.itemForm.value.check_to_client;
		let grossFinalValue = (Number(this.itemForm.value.sale_amount)
			+
			Number(grossAllowanceFrom)
			-
			Number(this.itemForm.value.allowance_to_new)
			-
			Number(grossCheckToClient)
			+
			Number(this.getTotalChargedClientAll())
			+
			Number(this.getTotalChargedDealerAll())
			-
			Number(grossPaidByMinus));
		/* gross Equation */

		/* net equation */
		let netPaidByMinus = this.itemForm.value.paid_by == 3 || this.itemForm.value.paid_by == 4 || this.itemForm.value.paid_by == 5 ? this.itemForm.value.payoff_amount : 0
		let netFinalValue = (
			Number(grossFinalValue) -
			Number(this.getActualCostForSupplier()) -
			Number(this.getActualCostForVendor()) -
			Number(netPaidByMinus)
		)
		/* net equation */

		/* wholesaleCommission */
		let wholesaleCommissionFinalValue = (Number(netFinalValue) * Number(this.itemForm.value.wholesale_commission)) / 100;
		/* wholesaleCommission */

		/* newCarCommission */
		let newCarCommission = ((Number(netFinalValue) - Number(this.itemForm.value.pack_fee)) * Number(this.itemForm.value.newcar_commission)) / 100;
		/* newCarCommission */

		return (Number(netFinalValue) - (Number(wholesaleCommissionFinalValue) + Number(newCarCommission)));
	}

	getInvoiceDealer() {

		let paidByMinus = this.itemForm.value.paid_by == 1 ? this.itemForm.value.payoff_amount : 0;
		let value = Number(this.itemForm.value.sale_amount) - Number(this.getActualCostForSupplier()) - Number(paidByMinus) + Number(this.getTotalChargedDealerAll())
		if (value < 0) {
			value = 0;
		}
		return value;
	}

	getInvoiceClient() {

		let paidByAdd = 0;
		let value = (-Number(this.getTotalCustomerPayment(''))) + Number(this.getTotalChargedClientAll()) + Number(paidByAdd) - Number(this.itemForm.value.check_to_client);
		if (value < 0) {
			value = 0
		}
		return value;
	}

	getCheckToDealer() {
		let paidByMinus = this.itemForm.value.paid_by != 4 && this.itemForm.value.paid_by != 5 ? this.itemForm.value.payoff_amount : 0;

		let value = (Number(this.itemForm.value.sale_amount) - Number(this.getActualCostForSupplier()) - Number(paidByMinus) + Number(this.getTotalChargedDealerAll()))
		if (value > 0) {
			value = 0;
		}
		return -(value);
	}

	getCheckToClient() {
		let paidByAdd = this.itemForm.value.paid_by == 3 ? this.itemForm.value.payoff_amount : 0;
		let value = (-Number(this.getTotalCustomerPayment(''))) + Number(this.getTotalChargedClientAll()) - Number(paidByAdd) - Number(this.itemForm.value.check_to_client);
		if (value > 0) { value = 0 }
		return -(value);
	}

	onBackClick() {
		this.location$.back();
	}

	refreshData() {
		this.changeDetectorRefs.detectChanges();
	}

	/* history code */

	transformKey(item) {
		item = item.replace(/_/g, ' ');
		return this.titleCasePipe.transform(item);
	}

	generateAddHistoryMsg(item) {
		if (item.kind == 'E') {
			if (item.path[0] == 'customersWholeSale') {
				if (item.rhs == "") {
					return `${this.transformKey(item.path[0])} removed`;
				}
				else if (item.path[2] == 'paid_to') {
					return `Customer payment ${this.transformKey(item.path[2])} added to ${item.rhs == '1' ? 'Paid To Dealer' : 'Paid To Carblip'}`;
				}
				else if (item.path[2] == 'payment_type') {
					return `Customer payment ${this.transformKey(item.path[2])} added to ${item.rhs == '1' ? 'Check' : item.rhs == '2' ? 'Credit Card' : item.rhs == '3' ? 'Cash' : 'Wire'}`;
				}
				else if (item.path[2] == 'date') {
					let convertedDate = this.datepipe.transform(`${item.rhs}`, 'yyyy-MM-dd');
					return `Customer payment ${this.transformKey(item.path[2])} added to ${convertedDate}`;
				}
				else {
					return `Customer payment ${this.transformKey(item.path[2])} added to ${item.rhs}`;
				}
			}
			else if (item.path[0] == 'expenseChargedClient' || item.path[0] == 'expenseChargedDealer') {
				if (item.rhs == "") {
					return `${this.transformKey(item.path[0])} removed`;
				}
				else if (item.path[2] == 'item') {
					return `Extra Expenses Charged Client Name added to ${item.rhs}`;
				}
				else if (item.path[2] == 'charge') {
					return `Extra Expenses Charged Client Charge added to ${item.rhs}`;
				}
			}
			else if (item.path[0] == 'expenseVendor') {
				if (item.rhs == "") {
					return `${this.transformKey(item.path[0])} removed`;
				}
				else if (item.path[2] == 'name') {
					return `Extra Expenses Charged Client Name added to ${item.rhs}`;
				}
				else if (item.path[2] == 'po_number') {
					return `Extra Expenses Charged Client PO Number added to ${item.rhs}`;
				}
				else {
					return `Extra Expenses Charged Client Amount added to ${item.rhs}`;
				}
			}
			else if (item.path[0] == 'purchase_order_ids' && (item.lhs != undefined || item.lhs != null)) {
				let ids = [];
				ids.push(item.rhs);
				let data = this.getPurchaseOrderFilterById(ids);
				return `Purchase order updated to ${item.rhs}, Description :${data[0].description}, Amount:${data[0].amount} `;
			}
			else if (item.path[0] == 'dealer_id') {
				let dealerName = this.filteredDealers.filter(i => i.id == item.rhs);
				if (dealerName.length > 0) {
					return `Suplier added to ${dealerName[0].name}`;
				}
			}
			else if (item.path[0] == 'dealer_contact_id') {
				let dealerContact = this.filteredDealerContacts.filter(i => i.id == item.rhs);
				if (dealerContact.length > 0) {
					return `Suplier Contact added to ${dealerContact[0].name}`;
				}
			}
			else {
				if (item.rhs == "") {
					return `${this.transformKey(item.path[0])} removed`;
				}
				else {
					if (typeof (item.rhs) == 'object') {
						let convertedDate = this.datepipe.transform(`${item.rhs}`, 'yyyy-MM-dd');
						return `${this.transformKey(item.path[0])} added to ${convertedDate}`;
					}
					else {
						return `${this.transformKey(item.path[0])} added to ${item.rhs}`;
					}
				}
			}
		}
	}

	getPurchaseOrderFilterById(value) {
		let filteredDataByPurchaseOrderId = this.purchaseOrder.filter((o) => value.includes(o.id));
		return filteredDataByPurchaseOrderId;
	}

	generateLogMsg(item) {
		if (item.kind == 'A') {
			if (item.item.kind == 'A') { }
			else if (item.item.kind == 'E') { }
			else if (item.item.kind == 'D') {
				if (item.path[0] == 'customersWholeSale') {
					let convertedDate = this.datepipe.transform(`${item.item.lhs.date}`, 'yyyy-MM-dd');
					return `Customer payment deleted  Amount:${item.item.lhs.amount}, Date Paid:${convertedDate}, Paid To:${item.item.lhs.paid_to == '1' ? 'Paid To Dealer' : 'Paid To Carblip'}, Pyment Type:${item.item.lhs.payment_type == '1' ? 'Check' : item.item.lhs.payment_type == '2' ? 'Credit Card' : item.item.lhs.payment_type == '3' ? 'Cash' : 'Wire'} `;
				}
				else if (item.path[0] == 'expenseChargedDealer' || item.path[0] == 'expenseChargedClient') {
					return `${this.transformKey(item.path[0])} deleted Charge:${item.item.lhs.charge}, Name:${item.item.lhs.item}`;
				}
				else if (item.path[0] == 'expenseVendor') {
					return `Extra Expenses Charged Client deleted Name:${item.item.lhs.name}, Amount:${item.item.lhs.amount}, PO Number:${item.item.lhs.po_number}`;
				}
				else if (item.path[0] == 'purchase_order_ids') {
					let ids = [];
					ids.push(item.item.lhs);
					let data = this.getPurchaseOrderFilterById(ids);
					return `Purchase order deleted to ${item.item.lhs}, Description :${data[0].description}, Amount:${data[0].amount} `;
				}
			}
			else {
				if (item.path[0] == 'customersWholeSale') {
					let convertedDate = this.datepipe.transform(`${item.item.rhs.date}`, 'yyyy-MM-dd');
					return `Customer payment added to Amount:${item.item.rhs.amount}, Date Paid:${convertedDate}, Paid To:${item.item.rhs.paid_to == '1' ? 'Paid To Dealer' : 'Paid To Carblip'}, Pyment Type:${item.item.rhs.payment_type == '1' ? 'Check' : item.item.rhs.payment_type == '2' ? 'Credit Card' : item.item.rhs.payment_type == '3' ? 'Cash' : 'Wire'} `;
				}
				else if (item.path[0] == 'expenseChargedDealer' || item.path[0] == 'expenseChargedClient') {
					return `${this.transformKey(item.path[0])} added to Charge:${item.item.rhs.charge}, Name:${item.item.rhs.item} `;
				}
				else if (item.path[0] == 'expenseVendor') {
					return `Extra Expenses Charged Client added to Name:${item.item.rhs.name}, Amount:${item.item.rhs.amount}, PO Number:${item.item.rhs.po_number}`;
				}
				else if (item.path[0] == 'purchase_order_ids' && (item.item.rhs != undefined || item.item.rhs != null)) {
					let ids = [];
					ids.push(item.item.rhs);
					let data = this.getPurchaseOrderFilterById(ids);
					return `Purchase order added to ${item.item.rhs}, Description :${data[0].description}, Amount:${data[0].amount} `;
				}
			}
		}
		else if (item.kind == 'E') {
			if (item.lhs == "" || item.lhs == null || item.lhs == undefined) {
				return this.generateAddHistoryMsg(item)
			}
			else if (item.path[0] == 'purchase_order_ids' && (item.lhs != undefined || item.lhs != null)) {
				let ids = [];
				ids.push(item.rhs);
				let data = this.getPurchaseOrderFilterById(ids);
				return `Purchase order updated to ${item.rhs}, Description :${data[0].description}, Amount:${data[0].amount} `;
			}
			else if (item.path[0] == 'customersWholeSale') {
				if (item.rhs == "") {
					return `${this.transformKey(item.path[0])} removed`;
				}
				else if (item.path[2] == 'paid_to') {
					return `Customer payment ${this.transformKey(item.path[2])} updated to ${item.rhs == '1' ? 'Paid To Dealer' : 'Paid To Carblip'}`;
				}
				else if (item.path[2] == 'payment_type') {
					return `Customer payment ${this.transformKey(item.path[2])} updated to ${item.rhs == '1' ? 'Check' : item.rhs == '2' ? 'Credit Card' : item.rhs == '3' ? 'Cash' : 'Wire'}`;
				}
				else if (item.path[2] == 'date') {
					let convertedDate = this.datepipe.transform(`${item.rhs}`, 'yyyy-MM-dd');
					return `Customer payment ${this.transformKey(item.path[2])} updated to ${convertedDate}`;
				}
				else {
					return `Customer payment ${this.transformKey(item.path[2])} updated to ${item.rhs}`;
				}
			}
			else if (item.path[0] == 'expenseChargedClient' || item.path[0] == 'expenseChargedDealer') {
				if (item.rhs == "") {
					return `${this.transformKey(item.path[0])} removed`;
				}
				else if (item.path[2] == 'item') {
					return `Extra Expenses Charged Client Name updated to ${item.rhs}`;
				}
				else if (item.path[2] == 'charge') {
					return `Extra Expenses Charged Client Charge updated to ${item.rhs}`;
				}
			}
			else if (item.path[0] == 'expenseVendor') {
				if (item.rhs == "") {
					return `${this.transformKey(item.path[0])} removed`;
				}
				else if (item.path[2] == 'name') {
					return `Extra Expenses Charged Client Name updated to ${item.rhs}`;
				}
				else if (item.path[2] == 'po_number') {
					return `Extra Expenses Charged Client PO Number updated to ${item.rhs}`;
				}
				else {
					return `Extra Expenses Charged Client Amount updated to ${item.rhs}`;
				}
			}
			else if (item.path[0] == 'dealer_id') {
				let dealerName = this.filteredDealers.filter(i => i.id == item.rhs);
				if (dealerName.length > 0) {
					return `Suplier updated to ${dealerName[0].name}`;
				}
			}
			else if (item.path[0] == 'dealer_contact_id') {
				let dealerContact = this.filteredDealerContacts.filter(i => i.id == item.rhs);
				if (dealerContact.length > 0) {
					return `Suplier Contact updated to ${dealerContact[0].name}`;
				}
			}
			else {
				if (item.rhs == "") {
					return `${this.transformKey(item.path[0])} removed`;
				}
				else {
					if (typeof (item.rhs) == 'object') {
						let convertedDate = this.datepipe.transform(`${item.rhs}`, 'yyyy-MM-dd');
						return `${this.transformKey(item.path[0])} updated to ${convertedDate}`;
					}
					else {
						if(item.path[0] == 'newCarAllowance') {
							return `New Car Allowance updated to ${item.rhs}`;
						}
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

	saveHistoryLog(temp, quote) {
		let editedData = diff(temp, quote);
		if (editedData !== undefined) {
			const copyObj = {
				target_id: null,
				target_type: 'App\\Model\\WholeSaleQuote',
				content: '',
				action: 'updated',
				cms_user_id: '',
				cms_user_name: '',
				category: 'cms'
			};
			copyObj.target_id = this.wholesalequote.id;
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
		this.service$
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
					res.created_at = (new Date()).toISOString();
					this.showHistory.unshift(res);
					this.logPagination.length += 1;
					this.refreshData();
					this.loader$.close();
				}
			});
		this.refreshData();
	}

	/* getTotalPaymentChargedClient() {
		return (
			this.itemForm.value.remaining_payments_chargedclient *
			this.itemForm.value.payment_chargedclient
		);
	} */
	/* history code */

	onPrint() {
		if (this.itemForm.dirty) {
			this.confirmService$
				.confirm({
					message: `You have updates, Do you want to save data before export?`,
				})
				.subscribe(res => {
					if (res) {
						this.submit(() => {
							this.downloadPrintFile();
						});
					}
				});
		} else {
			this.downloadPrintFile();
		}
	}

	downloadPrintFile() {
		const param = {
			type: 'wholesale-quote-print',
			id: this.wholesalequoteId,
		};
		this.loader$.open();
		this.exportService$
			.postWholeSaleQuotePrint(param)
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
	}

	getNewCarAllowance(data: any) {
		if (data) {
			return data.map(item => {
				return this.fb.group({
					quote_id: [item['quote_id'] || ''],
					allowance_to_new: [item['allowance_to_new'] || '',  Validators.required]
				});
			});
		}
		return [
			this.fb.group({
				quote_id: this.newCarAllowanceQuoteId,
				allowance_to_new: [this.newCarAllowancePreviosValue || '']
			}),
		];
	}
}
