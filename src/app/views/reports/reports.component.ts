import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  
  scrWidth:any;
  view: any[] = [1200, 450];
  constructor() { }

  @HostListener('window:resize', ['$event'])
  getScreenSize() {
      this.scrWidth = window.innerWidth; 
      if( this.scrWidth >= 960) { this.view = [this.scrWidth-300, 450]; } 
      else { this.view = [this.scrWidth-50, 450]; }
  }

  ngOnInit() {
    this.getScreenSize();
  }

}
