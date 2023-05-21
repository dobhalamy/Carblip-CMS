import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as deepEqual from 'deep-equal';
import { Observable, Subject } from 'rxjs';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';

import { egretAnimations } from 'app/shared/animations/egret-animations';
import { formatPhoneNumber } from 'app/shared/helpers/utils';
import * as commonModels from 'app/shared/models/common.model';
import { BlockList } from 'app/shared/models/block-list.model';
import { AppState } from 'app/store/';
import * as actions from 'app/store/block-list/block-list.actions';
import { dataSelector, didFetchSelector, metaSelector } from 'app/store/block-list/block-list.selectors';
import { initialState } from 'app/store/block-list/block-list.states';
import { NgxRolesService } from 'ngx-permissions'
import { AppConfirmService } from 'app/shared/services/app-confirm/app-confirm.service';

@Component({
    selector: 'app-block-list-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.style.scss'],
    animations: egretAnimations,
})
export class BlocklistTableComponent implements OnInit {

    columnHeaders: string[] = [
        'srNo',
        'phone',
        'count',
        'created_at',
        'updated_at',
        'actions'
    ];

    private onDestroy$ = new Subject<void>();

    public requests$: Observable<any>;
    public meta$: Observable<any>;
    public didFetch$: Observable<any>;

    public requests: Array<BlockList> = [];
    public meta: commonModels.Meta;
    public offset: number;

    public sortKey:string;
    public sortDirection:string;

    constructor(
        private store$: Store<AppState>,
        private confirmService$: AppConfirmService,
        private changeDetectorRefs: ChangeDetectorRef) {
        this.requests$ = this.store$.select(dataSelector);
        this.meta$ = this.store$.select(metaSelector);
        this.didFetch$ = this.store$.select(didFetchSelector);
        this.offset = 1;
        this.sortKey = localStorage.getItem("block_list_module_order_by");
        this.sortDirection=localStorage.getItem("block_list_module_order_dir");
    }

    ngOnDestroy() {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    ngOnInit() {
        this.requests$
            .pipe(
                debounceTime(10),
                takeUntil(this.onDestroy$),
                tap(requests => {
                    if (!deepEqual(this.requests, requests)) {
                        this.requests = requests;
                        this.refreshTable();
                    }
                })
            )
            .subscribe();

        this.meta$
            .pipe(
                debounceTime(10),
                takeUntil(this.onDestroy$),
                tap(meta => {
                    this.meta = meta;
                    /*  this.offset = meta.from; */
                    this.refreshTable();
                })
            )
            .subscribe();

        this.didFetch$
            .pipe(
                debounceTime(10),
                takeUntil(this.onDestroy$),
                tap(didFetch => !didFetch && this.loadData())
            )
            .subscribe();
    }

    loadData() {
        this.store$.dispatch(new actions.GetList());
    }

    sortData(event) {
        //set arrow direction in localstorage
        localStorage.setItem("block_list_module_order_by", event.active);
        localStorage.setItem("block_list_module_order_dir", event.direction);
        
        const updated_filter = {
            order_by: event.active ? event.active : initialState.filter.order_by,
            order_dir: event.direction
                ? event.direction
                : initialState.filter.order_dir,
        };
        this.store$.dispatch(new actions.UpdateFilter(updated_filter));
    }


    onDelete(item: BlockList) {
        this.confirmService$
            .confirm({
                message: `Are you sure you wish to delete this user '${item.phone
                    }'? This is permanent and cannot be undone.`,
            })
            .subscribe(res => {
                if (res) {
                    const payload = {
                        id: [item.id],
                    };
                    this.store$.dispatch(new actions.Delete(payload));
                }
            });
    }

    refreshTable() {
        this.changeDetectorRefs.detectChanges();
    }
}
