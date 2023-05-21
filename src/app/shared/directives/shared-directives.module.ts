import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { DropdownAnchorDirective } from './dropdown-anchor.directive';
import { DropdownLinkDirective } from './dropdown-link.directive';
import { AppDropdownDirective } from './dropdown.directive';
import { EgretHighlightDirective } from './egret-highlight.directive';
import { EgretSideNavToggleDirective } from './egret-side-nav-toggle.directive';
import {
  EgretSidenavHelperDirective,
  EgretSidenavTogglerDirective,
} from './egret-sidenav-helper/egret-sidenav-helper.directive';
import { FontSizeDirective } from './font-size.directive';
import { NoSpaceDirective } from './no-space.directive';
import { NoSpecialCharDirective } from './no-special-char.directive';
import { NoWhiteSpaceDirective } from './no-white-space.directive';
import { PhoneNumberDirective } from './phone-number.directive';
import { ScrollToDirective } from './scroll-to.directive';

const directives = [
  FontSizeDirective,
  ScrollToDirective,
  AppDropdownDirective,
  DropdownAnchorDirective,
  DropdownLinkDirective,
  EgretSideNavToggleDirective,
  EgretSidenavHelperDirective,
  EgretSidenavTogglerDirective,
  EgretHighlightDirective,
  PhoneNumberDirective,
  NoWhiteSpaceDirective,
  NoSpaceDirective,
  NoSpecialCharDirective,
];

@NgModule({
  imports: [CommonModule],
  declarations: directives,
  exports: directives,
})
export class SharedDirectivesModule {}
