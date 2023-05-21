import * as fromRouter from '@ngrx/router-store';
import { ActionReducerMap } from '@ngrx/store';

import { AuthenticationEffects } from './auth/authentication.effect';
import { CmsUserLogsEffects } from './cmsuserlogs/cmsuserlogs.effects';
import { CmsUserEffects } from './cmsusers/cmsusers.effects';
import { DealerEffects } from './dealers/dealers.effects';
import { InventoryEffects } from './inventories/inventories.effects';
import { LocationEffects } from './locations/locations.effects';
import { MDealerEffects } from './mdealers/mdealers.effects';
import { QuoteEffects } from './quotes/quotes.effects';
import { RequestLogsEffects } from './requestlogs/requestlogs.effects';
import { RequestEffects } from './requests/requests.effects';
import { RouterEffects } from './router/router.effect';
import { UserEffects } from './users/users.effects';
import { WholesaleQuoteEffects } from './wholesale-quote/wholesale-quote.effects';

import { AuthenticationState } from './auth/authentication.state';
import { CmsUserLogsState } from './cmsuserlogs/cmsuserlogs.states';
import { CmsUsersState } from './cmsusers/cmsusers.states';
import { DealersState } from './dealers/dealers.states';
import { ErrorState } from './error/error.states';
import { InventoriesState } from './inventories/inventories.states';
import { LocationsState } from './locations/locations.states';
import { MDealersState } from './mdealers/mdealers.states';
import { QuotesState } from './quotes/quotes.states';
import { RequestLogsState } from './requestlogs/requestlogs.states';
import { RequestsState } from './requests/requests.states';
import { YearsState } from './requests/years.states';
import { RouterStateUrl } from './router/router.state';
import { UsersState } from './users/users.states';

import { authenticationReducer } from './auth/authentication.reducer';
import { cmsUserLogsReducer } from './cmsuserlogs/cmsuserlogs.reducers';
import { cmsUsersReducer } from './cmsusers/cmsusers.reducers';
import { dealersReducer } from './dealers/dealers.reducers';
import { errorReducer } from './error/error.reducers';
import { inventoriesReducer } from './inventories/inventories.reducers';
import { locationsReducer } from './locations/locations.reducers';
import { mDealersReducer } from './mdealers/mdealers.reducers';
import { quotesReducer } from './quotes/quotes.reducers';
import { requestLogsReducer } from './requestlogs/requestlogs.reducers';
import { requestsReducer } from './requests/requests.reducers';
import { yearReducer } from './requests/requests.reducers';
import { usersReducer } from './users/users.reducers';

import { CmsUserService } from '../shared/services/apis/cmsusers.service';
import { DealerService } from '../shared/services/apis/dealer.service';
import { InventoryService } from '../shared/services/apis/inventories.service';
import { LocationService } from '../shared/services/apis/locations.service';
import { MDealerService } from '../shared/services/apis/mdealer.service';
import { QuoteService } from '../shared/services/apis/quotes.service';
import { RequestService } from '../shared/services/apis/requests.service';
import { UserService } from '../shared/services/apis/users.service';
import { QuoteLogState } from './quotelogs/quotelog.states';
import { QuoteLogEffects } from './quotelogs/quotelog.effects';
import { quotelogReducer } from './quotelogs/quotelog.reducers';
import { VendorsState } from './vendors/vendors.states';
import { VendorsEffects } from './vendors/vendors.effects';
import { VendorsService } from 'app/shared/services/apis/vendors.service';
import { vendorsReducer } from './vendors/vendors.reducers';
import { PurchaseOrderEffects } from './purchase-order/purchase-order.effects';
import { PurchaseOrderService } from 'app/shared/services/apis/purchase-order.service';
import { purchaseOrderReducer } from './purchase-order/purchase-order.reducers';
import { PurchaseOrderState } from './purchase-order/purchase-order.states';
import { WholesaleQuote } from 'app/shared/models/wholesale-quote.model';
import { WholesaleQuoteService } from 'app/shared/services/apis/wholesale-quote.service';
import { wholesaleQuoteReducer } from './wholesale-quote/wholesale-quote.reducers';
import { WholesaleQuoteState } from './wholesale-quote/wholesale-quote.states';
import { WholesaleQuoteLogState } from './wholesale-quotelogs/wholesale-quotelog.states';
import { WholesaleQuoteLogEffects } from './wholesale-quotelogs/wholesale-quotelog.effects';
import { wholesaleQuotelogReducer } from './wholesale-quotelogs/wholesale-quotelog.reducers';
import { CarsDirectState } from './cars-direct/cars-direct.states';
import { CarsDirectEffects } from './cars-direct/cars-direct.effects';
import { CarsDirectService } from 'app/shared/services/apis/cars-direct.service';
import { BlockListService } from 'app/shared/services/apis/block-list.service';
import { carsDirectReducer } from './cars-direct/cars-direct.reducers';
import { BlockListEffects } from './block-list/block-list.effects';
import { BlockListState } from './block-list/block-list.states';
import { blockListReducer } from './block-list/block-list.reducers';
import { UserLogsEffects } from './userlogs/userlogs.effects';
import { userLogsReducer } from './userlogs/userlogs.reducers';
import { UserLogsState } from './userlogs/userlogs.states';

export interface AppState {
  router: fromRouter.RouterReducerState<RouterStateUrl>;
  authentication: AuthenticationState;
  users: UsersState;
  cmsusers: CmsUsersState;
  cmsuserlogs: CmsUserLogsState;
  locations: LocationsState;
  requests: RequestsState;
  years: YearsState;
  requestlogs: RequestLogsState;
  userlogs: UserLogsState;
  inventories: InventoriesState;
  mdealers: MDealersState;
  dealers: DealersState;
  quotes: QuotesState;
  wholesaleQuote: WholesaleQuoteState;
  quotelog: QuoteLogState;
  wholesaleQuotelog: WholesaleQuoteLogState;
  vendors: VendorsState;
  purchaseOrder: PurchaseOrderState;
  carsDirect: CarsDirectState,
  blockList: BlockListState,
  errors: ErrorState;
}

export const rootEffects: any[] = [RouterEffects, AuthenticationEffects];

export const effects: any[] = [
  RouterEffects,
  AuthenticationEffects,
  UserEffects,
  LocationEffects,
  CmsUserEffects,
  CmsUserLogsEffects,
  RequestEffects,
  RequestLogsEffects,
  UserLogsEffects,
  InventoryEffects,
  MDealerEffects,
  DealerEffects,
  QuoteEffects,
  WholesaleQuoteEffects,
  QuoteLogEffects,
  WholesaleQuoteLogEffects,
  VendorsEffects,
  PurchaseOrderEffects,
  CarsDirectEffects,
  BlockListEffects
];

export const services: any[] = [
  UserService,
  LocationService,
  CmsUserService,
  RequestService,
  InventoryService,
  MDealerService,
  DealerService,
  QuoteService,
  WholesaleQuoteService,
  VendorsService,
  PurchaseOrderService,
  CarsDirectService,
  BlockListService
];

export const reducers: ActionReducerMap<AppState> = {
  router: fromRouter.routerReducer,
  authentication: authenticationReducer,
  users: usersReducer,
  cmsusers: cmsUsersReducer,
  cmsuserlogs: cmsUserLogsReducer,
  locations: locationsReducer,
  requests: requestsReducer,
  years: yearReducer,
  requestlogs: requestLogsReducer,
  userlogs: userLogsReducer,
  inventories: inventoriesReducer,
  mdealers: mDealersReducer,
  dealers: dealersReducer,
  quotes: quotesReducer,
  wholesaleQuote: wholesaleQuoteReducer,
  wholesaleQuotelog: wholesaleQuotelogReducer,
  quotelog: quotelogReducer,
  vendors: vendorsReducer,
  purchaseOrder: purchaseOrderReducer,
  carsDirect: carsDirectReducer,
  blockList: blockListReducer,
  errors: errorReducer,
};
