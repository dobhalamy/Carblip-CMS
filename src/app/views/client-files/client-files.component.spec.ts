import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientFilesComponent } from './client-files.component';

describe('ClientFilesComponent', () => {
  let component: ClientFilesComponent;
  let fixture: ComponentFixture<ClientFilesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientFilesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
