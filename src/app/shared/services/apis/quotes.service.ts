import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

import * as commonModels from 'app/shared/models/common.model';
import * as quotesModels from 'app/shared/models/quote.model';
import { NewQuote, Quote, History } from 'app/shared/models/quote.model';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class QuoteService {
  private API_PATH = environment.apiUrl;
  constructor(
    private http: HttpClient,
    private authenticationService$: AuthService
  ) { }

  getHttpHeaders() {
    return new HttpHeaders({
      Authorization: `${localStorage.getItem('authorization')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  getList(requestParams: commonModels.Filter): Observable<any> {
    let paramObj = {
      order_by: requestParams.order_by,
      order_dir: requestParams.order_dir,
      page: requestParams.page.toString(),
      per_page: requestParams.per_page.toString(),
    };
    if (requestParams.search.trim()) {
      paramObj = Object.assign(paramObj, { search: requestParams.search });
    }

    return this.http.get<any>(this.API_PATH + `/quotes`, {
      params: paramObj,
      headers: this.getHttpHeaders(),
    });
  }

  getHistory(id: string, requestParams: commonModels.Filter) {
    let paramObj = {
      order_by: requestParams.order_by,
      order_dir: requestParams.order_dir,
      page: requestParams.page.toString(),
      per_page: requestParams.per_page.toString(),
    };
    return this.http.get<any>(this.API_PATH + `/quote/${id}/logs`, {
      params: paramObj,
      headers: this.getHttpHeaders()
    })
  }
  getWholesaleQuoteById(id: string): Observable<any> {
    return this.http.get<any>(this.API_PATH + `/wholesalequotes/getquotebyid`, {
      params: { quote_id: id },
      headers: this.getHttpHeaders(),
    });
  }
  createHistory(requestParams: History): Observable<any> {
    const payload = {
      content: requestParams.content,
      action: requestParams.action,
      category: requestParams.category,
      target_id: requestParams.target_id,
      target_type: requestParams.target_type,
      cms_user_name: requestParams.cms_user_name,
      cms_user_id: requestParams.cms_user_id,
    };
    return this.http.post<any>(this.API_PATH + '/logs/create', payload, {
      headers: this.getHttpHeaders(),
    })
  }
  getById(id: string): Observable<any> {
    return this.http.get<any>(this.API_PATH + `/quote/${id}`, {
      headers: this.getHttpHeaders(),
    });
  }

  create(requestParams: NewQuote): Observable<any> {
    const payload = {
      request_id: requestParams.request_id,
      data: requestParams.data,
    };

    return this.http.post<any>(this.API_PATH + `/quote`, payload, {
      headers: this.getHttpHeaders(),
    });
  }

  update(id: string, requestParams: Quote): Observable<any> {
    return this.http.put<any>(this.API_PATH + `/quote/${id}`, requestParams, {
      headers: this.getHttpHeaders(),
    });
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(this.API_PATH + `/quote/${id}`, {
      headers: this.getHttpHeaders(),
    });
  }
}
