import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

import * as commonModels from 'app/shared/models/common.model';

@Injectable()
export class WorkflowService {
  private API_PATH = environment.apiUrl;

  constructor(
    private http: HttpClient,
  ) { }

  getHttpHeaders() {
    return new HttpHeaders({
      Authorization: `${localStorage.getItem('authorization')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  gettype(): Observable<any> {
    return this.http.get<any>(this.API_PATH + `/hubspot/type`, {
      headers: this.getHttpHeaders(),
    });
  }

  getproperty(id: number): Observable<any> {
    return this.http.get<any>(this.API_PATH + `/hubspot/property/rule/${id}`, {
      headers: this.getHttpHeaders(),
    });
  }

  getemailTemplate(): Observable<any> {
    return this.http.get<any>(this.API_PATH + `/hubspot/email/templates`, {
      headers: this.getHttpHeaders(),
    });
  }

  storeWorkflow(payload:any):Observable<any> {
    return this.http.post<any>(this.API_PATH + `/hubspot/workflow/store`, payload , {
      headers: this.getHttpHeaders(),
    });
  }

  getWorkflowList(requestParams: commonModels.Filter): Observable<any> {
    let paramObj = {
      order_by: requestParams.order_by,
      order_dir: requestParams.order_dir,
      page: requestParams.page.toString(),
      per_page: requestParams.per_page.toString(),
    };
    return this.http.get<any>(this.API_PATH + `/hubspot/workflow`, {
      params: paramObj,
      headers: this.getHttpHeaders(),
    });
  }

  getworkflow(id: number): Observable<any> {
    return this.http.get<any>(this.API_PATH + `/hubspot/workflow/${id}`, {
      headers: this.getHttpHeaders(),
    });
  }


}

