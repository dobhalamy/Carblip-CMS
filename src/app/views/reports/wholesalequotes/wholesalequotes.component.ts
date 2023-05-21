import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ReportsService } from 'app/shared/services/apis/reports.service';
import { ChartViewGenerateService } from 'app/shared/services/chart-view-generate.service';
import * as moment from 'moment-timezone';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { environment } from 'environments/environment';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-wholesalequotes',
  templateUrl: './wholesalequotes.component.html',
  styleUrls: ['./wholesalequotes.component.scss', '../reports.component.scss']
})
export class WholesalequotesComponent implements OnInit {
  @Input() view:any = [];
  public daterrange = {
    begin: null,
    end: null,
  };
  viewType = 'D';
  total: number;
  public selectedSource: any = [6];
  public sources = [
    { id: 6, value : 'All'}, { id: 1, value : 'Web'}, { id: 2, value : 'Mobile'}, { id: 3, value : 'Direct'}, { id: 4, value : 'CB2'}, { id: 5, value : 'CB3'},
  ]
  wholesaleQuoteReport: any = [];
  contactOwnersList: any = [];
  public selectedOwner: any = [0];

  public barChartOptions: ChartOptions = {
    responsive: true,
    legend: {
      display: false
    },
    scales: {
      xAxes: [{
        ticks: { fontColor: 'black' },
        gridLines: { color: 'rgba(255,255,255,0.1)' }
      }],
      yAxes: [{
        ticks: {
           callback: function(value, index, values) {
            let dollarUSLocale = Intl.NumberFormat('en-US');
            return dollarUSLocale.format(Number(value)); 
         }
       }
     }]
    },
    tooltips: {
      enabled: true,
      titleFontSize: 15,
      bodyFontSize: 18,
      callbacks: {
       label: function (tooltipItem, data) {
        let label = data.datasets[tooltipItem.datasetIndex].label
        let count = data
                    .datasets[tooltipItem.datasetIndex]
                    .data[tooltipItem.index];
        let dollarUSLocale = Intl.NumberFormat('en-US');
        return label + ": " + dollarUSLocale.format(Number(count)); 
       },
      },
     }
  };
  public barChartLabels: Label[] = [];
  public barChartType: ChartType = 'bar';
  public barChartPlugins = [];
  public barChartData: ChartDataSets[] = [];

  public single = [];
  showCalendar: boolean = false;
  requestFilter: { start_date: string; end_date: string; source: any; contact_owner: any; };

  constructor(
    private reportService: ReportsService,
    private chartViewGenerateService: ChartViewGenerateService,
    private _cdr: ChangeDetectorRef,
    private loader$: AppLoaderService,
    private snack$: MatSnackBar
  ) { }

  ngOnInit() { }

  getWholesaleQuoteReport() {
    this.requestFilter = {
      start_date: moment(this.daterrange.begin).format('yyyy/MM/DD'),
      end_date: moment(this.daterrange.end).add(1, 'days').format('yyyy/MM/DD'),
      source: this.selectedSource.toString(),
      contact_owner: this.selectedOwner.toString()
    };
    this.reportService.getWholesaleQuotesReport(this.requestFilter).subscribe( res => {
      if(res.statusCode == 200 && res.data.length > 0){
        this.wholesaleQuoteReport = res.data[0].chartdata;
        this.contactOwnersList = res.data[0].contactowner;
        this.wholesaleQuoteReport = this.chartViewGenerateService.createChartData(this.wholesaleQuoteReport, this.requestFilter.start_date, this.requestFilter.end_date);
        this.total = this.chartViewGenerateService.sum(this.wholesaleQuoteReport);
        this.changeViewType(this.viewType);
        this._cdr.detectChanges();
       } else {
         this.wholesaleQuoteReport = [];
         this.contactOwnersList = [];
         this.total = 0;
       }
    }, error => {
      console.log("There are some errors. Please Check!",error);
    })
  }

  getSelectedDates(event) {
    this.daterrange = event;
    this.getWholesaleQuoteReport();
  }

  onSourceChange(){
    this.getWholesaleQuoteReport();
  }

  onContactOwnerChange() {
    this.getWholesaleQuoteReport();
  }

  changeViewType(event) {
    if(this.wholesaleQuoteReport.length > 0){
      if(event === 'D') {
        this.single = this.chartViewGenerateService.generateDayView(this.wholesaleQuoteReport);
      } else if(event === 'W') {
        this.single = this.chartViewGenerateService.generateWeekView(this.wholesaleQuoteReport);
      } else {
        this.single = this.chartViewGenerateService.generateMonthView(this.wholesaleQuoteReport);
      } 
      this.createSingleChartData(this.single); 
    }
    this.viewType = event;
  }

  createSingleChartData(data: any) {
    let fetchLabels = [];
    let set1 = [];
    data.map(item=> {
      fetchLabels.push(item.name);
      set1.push(item.series[0].value.toFixed(2))

    })
    this.barChartLabels = fetchLabels;
    const array = [
      {data: set1, label: 'Value'},
    ]
    this.barChartData = array;
  }

  onExport(){
    let payload = {
      type: 'export-wholesaleQuotes',
      order_by: 'created_at',
      order_dir: 'desc',
      filter: JSON.stringify(this.requestFilter),
    };

    this.loader$.open();
    this.reportService.exportReportCharts(payload).subscribe( res => {
      this.loader$.close();
      if (res.data) {
        window.open(
          environment.apiUrl + '/export/download?token=' + res.data.token
        );
      } else {
        this.snack$.open('Something went wrong, Try again.', 'OK', {
          duration: 4000,
        });
      }

    }, error => {
      console.log("There are some errors. Please Check!",error);
    });

  }

}
