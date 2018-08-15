import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

import { BehaviorSubject, Observable, forkJoin, Subject } from 'rxjs';
import {
  map,
  first,
  throttleTime,
  exhaustMap,
  catchError,
  take,
  shareReplay,
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AppStatService {
  private apiURL = environment.operationServer + '/api/appstat';
  private appStatMap$: Observable<Map<string, AppStat>>;

  constructor(private http: HttpClient) {
    this.initStatMap();
  }
  initStatMap() {
    this.appStatMap$ = this.http.get<Result>(this.apiURL).pipe(
      map(result => {
        const stat = new Map<string, AppStat>();
        result.downloadCount.forEach(d => {
          const s = new AppStat();
          s.downloads = d.count;
          stat.set(d.appName, s);
        });
        result.rate.forEach(r => {
          if (stat.has(r.appName)) {
            const s = stat.get(r.appName);
            s.rate = r.rate;
            s.votes = r.count;
          } else {
            const s = new AppStat();
            s.rate = r.rate;
            s.votes = r.count;
            stat.set(r.appName, s);
          }
        });
        return stat;
      }),
      shareReplay(),
    );
  }

  getAppStat(): Observable<Map<string, AppStat>> {
    return this.appStatMap$;
  }
}

export class AppStat {
  downloads: number;
  rate: number;
  votes: number;
  constructor() {
    return { downloads: 0, rate: 0, votes: 0 };
  }
}

interface Result {
  downloadCount: DownloadCount[];
  rate: Rate[];
}

interface Rate {
  appName: string;
  rate: number;
  count: number;
}

interface DownloadCount {
  appName: string;
  count: number;
}