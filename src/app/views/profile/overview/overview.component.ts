import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';
import * as _ from 'underscore';

import { egretAnimations } from 'app/shared/animations/egret-animations';

import { Profile } from 'app/shared/models/user.model';
import { AppState } from 'app/store/';
import * as actions from 'app/store/auth/authentication.action';
import {
  dataSelector,
  didFetchSelector,
  fetchingSelector,
} from 'app/store/auth/authentication.selector';

@Component({
  selector: 'app-profile-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  animations: egretAnimations,
})

/**
 * Profile Overview Component
 * Show User Profile
 */
export class ProfileOverviewComponent implements OnInit, OnDestroy {
  private onDestroy$ = new Subject<void>();

  public didFetch$: Observable<any>;
  public fetching$: Observable<any>;
  public userProfile: Profile;

  public search = '';

  constructor(
    private store$: Store<AppState>,
    private changeDetectorRefs: ChangeDetectorRef
  ) {
    this.didFetch$ = this.store$.select(didFetchSelector);
    this.fetching$ = this.store$.select(fetchingSelector);
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.store$
      .select(dataSelector)
      .pipe(
        debounceTime(10),
        takeUntil(this.onDestroy$),
        tap((profile: Profile) => {
          this.userProfile = profile;
          this.changeDetectorRefs.detectChanges();
        })
      )
      .subscribe();
  }

  /**
   * Get User Location
   * @param {}
   */

  getLocation() {
    let result = '';
    if (this.userProfile && this.userProfile.location) {
      result = this.userProfile.location.name;
    }
    return result;
  }

  /**
   * Get User Role
   * @param {}
   */

  getRole() {
    let role = '';
    if (this.userProfile && this.userProfile.roles) {
      role = this.userProfile.roles[0].name;
    }
    return role;
  }

  loadData() {
    this.store$.dispatch(new actions.GetUserInfo());
  }
}
