import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatIconModule } from '@angular/material';
import { SearchInputOverComponent } from './search-input-over/search-input-over.component';

@NgModule({
  declarations: [SearchInputOverComponent],
  exports: [SearchInputOverComponent],
  imports: [ReactiveFormsModule, MatIconModule, MatButtonModule, CommonModule],
})
export class SearchModule {}
