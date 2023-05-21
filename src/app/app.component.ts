import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { combineLatest, fromEvent, Observable, Subject } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';
import { AppState } from './store';

import { AppLoaderService } from './shared/services/app-loader/app-loader.service';
import { LayoutService } from './shared/services/layout.service';
import { RoutePartsService } from './shared/services/route-parts.service';
import { processingSelector as authUserProcessingSelector } from './store/auth/authentication.selector';
import { processingSelector as cmsuserProcessingSelector } from './store/cmsusers/cmsusers.selectors';
import { processingSelector as dealerProcessingSelector } from './store/dealers/dealers.selectors';
import { ClearDetail as errorClearDetail } from './store/error/error.actions';
import { errorSelector } from './store/error/error.selectors';
import { processingSelector as locationsProcessingSelector } from './store/locations/locations.selectors';
import { processingSelector as quotesProcessingSelector } from './store/quotes/quotes.selectors';
import { processingSelector as requestsProcessingSelector } from './store/requests/requests.selectors';
import { processingSelector as usersProcessingSelector } from './store/users/users.selectors';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  appTitle = 'Carblip Admin';
  pageTitle = '';

  private onDestroy$ = new Subject<void>();
  authUserProcessing$: Observable<any>;
  usersProcessing$: Observable<any>;
  locationsProcessing$: Observable<any>;
  cmsuserProcessingSelector$: Observable<any>;
  requestsProcessingSelector$: Observable<any>;
  quotesProcessingSelector$: Observable<any>;
  dealerProcessingSelector$: Observable<any>;

  constructor(
    public title: Title,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private routePartsService: RoutePartsService,
    private layout: LayoutService,
    private renderer: Renderer2,
    private loader$: AppLoaderService,
    private store$: Store<AppState>,
    private snack$: MatSnackBar
  ) {
    this.authUserProcessing$ = this.store$.select(authUserProcessingSelector);
    this.usersProcessing$ = this.store$.select(usersProcessingSelector);
    this.locationsProcessing$ = this.store$.select(locationsProcessingSelector);
    this.cmsuserProcessingSelector$ = this.store$.select(
      cmsuserProcessingSelector
    );
    this.requestsProcessingSelector$ = this.store$.select(
      requestsProcessingSelector
    );
    this.quotesProcessingSelector$ = this.store$.select(
      quotesProcessingSelector
    );
    this.dealerProcessingSelector$ = this.store$.select(
      dealerProcessingSelector
    );
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngAfterViewInit() {
    this.layout.applyMatTheme(this.renderer);
  }

  ngOnInit() {
    this.changePageTitle();

    combineLatest(
      this.authUserProcessing$,
      this.usersProcessing$,
      this.locationsProcessing$,
      this.cmsuserProcessingSelector$,
      this.requestsProcessingSelector$,
      this.quotesProcessingSelector$,
      this.dealerProcessingSelector$
    )
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(([p1, p2, p3, p4, p5, p6, p7]) => {
        if (p1 || p2 || p3 || p4 || p5 || p6 || p7) {
          this.loader$.open();
        } else {
          this.loader$.close();
        }
      });
    this.initErrorHandler();
  }

  initErrorHandler() {
    this.store$
      .select(errorSelector)
      .pipe(
        takeUntil(this.onDestroy$),
        tap(errors => {
          if (errors.length) {
            this.snack$.open(errors[0].message, 'OK', {
              duration: 4000,
            });
            this.store$.dispatch(new errorClearDetail());
          }
        })
      )
      .subscribe();
  }

  changePageTitle() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(routeChange => {
        const routeParts = this.routePartsService.generateRouteParts(
          this.activeRoute.snapshot
        );
        if (!routeParts.length) {
          return this.title.setTitle(this.appTitle);
        }
        // Extract title from parts;
        this.pageTitle = routeParts
          .reverse()
          .map(part => part.title)
          .reduce((partA, partI) => {
            return `${partA} > ${partI}`;
          });
        this.pageTitle += ` | ${this.appTitle}`;
        this.title.setTitle(this.pageTitle);
      });
  }
}
