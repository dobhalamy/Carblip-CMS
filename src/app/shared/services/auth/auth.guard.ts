import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

import { CmsUser } from 'app/shared/models/cmsuser.model';
import { AppState } from 'app/store';
import { GetUserInfo } from 'app/store/auth/authentication.action';
import { didFetchSelector as authDidFetchSelector } from 'app/store/auth/authentication.selector';
import { dataSelector as authDataSelector } from 'app/store/auth/authentication.selector';
import { GetList as cmsUserGetList } from 'app/store/cmsusers/cmsusers.actions';
import { didFetchSelector as cmsUserDidFetchSelector } from 'app/store/cmsusers/cmsusers.selectors';
import { initialState as cmsUserInitialState } from 'app/store/cmsusers/cmsusers.states';
import { GetList as locationGetList } from 'app/store/locations/locations.actions';
import { didFetchSelector as locationDidFetchSelector } from 'app/store/locations/locations.selectors';
import { initialState as locationInitialState } from 'app/store/locations/locations.states';
import { NgxPermissionsService, NgxRolesService } from 'ngx-permissions';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from './auth.service';

/**
 * Authentication Guard
 * AuthGuard ensures app to verify auth token and if it's valid, fetch basic auth info
 * @type {CanActiviate}
 */

@Injectable()
export class AuthGuard implements CanActivate {
  public authToken;

  constructor(
    private store$: Store<AppState>,
    private authService$: AuthService,
    private router$: Router,
    private permissionsService: NgxPermissionsService,
    private rolesService: NgxRolesService
  ) {}
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService$.getToken()) {
      return this.authService$.getUserInfo().pipe(
        // take(1),
        map(res => {
          if (!res) {
            this.router$.navigate(['/sessions/signin']);
            return false;
          } else {
            let permissions = [];
            if (res.data['permissions']) {
              permissions = res.data['permissions'].map(item => item.name);
            }

            let role = null;
            if (res.data['roles']) {
              role = res.data['roles'][0]['name'];
            }

            this.permissionsService.loadPermissions(permissions);
            this.rolesService.addRole(role, permissions);

            // get user info when token is set in localstorage
            this.store$
              .select(authDidFetchSelector)
              .pipe(debounceTime(10))
              .subscribe(didFetch => {
                const token = this.authService$.getToken();
                if (!didFetch && token) {
                  this.store$.dispatch(new GetUserInfo());
                }
              });

            // get location info when app first started
            this.store$
              .select(locationDidFetchSelector)
              .pipe(debounceTime(10))
              .subscribe(didFetch => {
                const token = this.authService$.getToken();
                if (!didFetch && token) {
                  this.store$.dispatch(
                    new locationGetList(locationInitialState.filter)
                  );
                }
              });

            // get cms info when app first started
            this.store$
              .select(cmsUserDidFetchSelector)
              .pipe(debounceTime(10))
              .subscribe(didFetch => {
                const token = this.authService$.getToken();
                if (!didFetch && token) {
                  this.store$.dispatch(
                    new cmsUserGetList(cmsUserInitialState.filter)
                  );
                }
              });

            return true;
          }
        })
      );
    } else {
      this.router$.navigate(['/sessions/signin']);
      return false;
    }
  }
}
