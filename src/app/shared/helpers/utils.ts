import { formatCurrency } from '@angular/common';
import {
  BUYING_METHOD,
  BUYING_TIME,
  CREDIT_SCORE,
  CREDIT_SCORE_VALUE,
  SOURCE_UTM_LIST,
} from 'app/core/constants';
import { CmsUser } from 'app/shared/models/cmsuser.model';
import { Filter } from 'app/shared/models/common.model';
import { Request } from 'app/shared/models/request.model';
import { User } from 'app/shared/models/user.model';
import {
  ParseError,
  parsePhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/min';
import * as moment from 'moment-timezone';

export function getIndexBy(array: Array<{}>, { name, value }): number {
  for (let i = 0; i < array.length; i++) {
    if (array[i][name] === value) {
      return i;
    }
  }
  return -1;
}

export function sortByFilter(filter: Filter, data: Array<any>) {
  if (filter.order_dir === 'asc') {
    return data.sort((a, b) => {
      if (!a[filter.order_by]) {
        return -1;
      }
      if (!b[filter.order_by]) {
        return 1;
      }
      return a[filter.order_by] > b[filter.order_by] ? 1 : -1;
    });
  } else {
    return data.sort((a, b) => {
      if (!a[filter.order_by]) {
        return 1;
      }
      if (!b[filter.order_by]) {
        return -1;
      }
      return a[filter.order_by] < b[filter.order_by] ? 1 : -1;
    });
  }
}

export function filterBySearch(
  searchKey: string,
  filterableFields: Array<string>,
  data: Array<any>
) {
  return data.filter((item: any) => {
    return filterableFields.reduce((memo, filter_item) => {
      let result = false;
      if (typeof item[filter_item] === 'string') {
        result =
          memo ||
          item[filter_item].toLowerCase().indexOf(searchKey.toLowerCase()) !==
            -1;
      } else if (typeof item[filter_item] === 'number') {
        result =
          memo ||
          item[filter_item]
            .toString()
            .toLowerCase()
            .indexOf(searchKey.toLowerCase()) !== -1;
      } else {
        result = memo;
      }
      return result;
    }, false);
  });
}

export function liveFormatPhoneNumber(val: string): string {
  // normalize string and remove all unnecessary characters
  let phone = val.replace(/\D/g, '');
  const match = phone.match(/^(\d{1,3})(\d{0,3})(\d{0,4})$/);
  if (match) {
    phone = `${match[1]}${match[2] ? '-' : ''}${match[2]}${
      match[3] ? '-' : ''
    }${match[3]}`;
  }
  return phone;
}

export function formatPhoneNumber(val: string): string {
  let phoneNumber;
  try {
    phoneNumber = parsePhoneNumber(val, 'US');
  } catch (error) {
    phoneNumber = '';
  }
  return phoneNumber;
}

export function formatPhoneNumberToNational(val: string): string {
  let phoneNumber;
  try {
    const ob = parsePhoneNumberFromString(phoneNumber['number']);
    phoneNumber = ob.formatNational();
  } catch (error) {
    phoneNumber = '';
  }
  return phoneNumber;
}

export function numberWithCommas(x: number) {
  if (typeof x !== 'undefined' && x !== null) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } else {
    return '';
  }
}

export function formatMiles(x: number) {
  if (x >= 1000) {
    return parseFloat((x / 1000).toFixed(2)) + 'k';
  } else {
    return x ? x.toString() : '';
  }
}

export function getUserFullName(user: User | CmsUser): string {
  if (user) {
    return user.full_name;
  }
  return '';
}

export function getBoolColor(value: any) {
  if (value) {
    return 'accent';
  } else if (!value) {
    return 'warn';
  }
  return '';
}

export function getYearArray(offset) {
  const start = new Date().getFullYear() + 1,
    stop = start + offset,
    step = -1;
  const arr = Array.from(
    { length: (stop - start) / step + 1 },
    (_, i) => start + i * step
  );
  return arr.map(x => ({
    id: x,
    name: x.toString(),
  }));
}

export function getYearArrayFrom(from) {
  const start = new Date().getFullYear() + 1,
    stop = from,
    step = -1;
  const arr = Array.from(
    { length: (stop - start) / step + 1 },
    (_, i) => start + i * step
  );
  return arr.map(x => ({
    id: x,
    name: x.toString(),
  }));
}

export function setCookie(cname, cvalue, exhrs) {
  const d = new Date();
  d.setTime(d.getTime() + exhrs * 60 * 60 * 1000);
  const expires = 'expires=' + d.toUTCString();
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}

export function getCookie(cname) {
  const name = cname + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}
