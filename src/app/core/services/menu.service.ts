import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuItem } from '../models/menu.model';

/**
 * Menu rarely changes during a shift, so the list is fetched once per app session
 * and shared to every subscriber via `shareReplay`.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly menu$ = this.http
    .get<MenuItem[]>(`${environment.apiUrl}/menu`)
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  getMenu(): Observable<MenuItem[]> {
    return this.menu$;
  }
}
