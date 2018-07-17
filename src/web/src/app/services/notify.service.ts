import { Injectable, NgZone } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

import { ReplaySubject } from 'rxjs';

import { DstoreObject } from '../dstore-client.module/utils/dstore-objects';
import { Notify, NotifyType, NotifyStatus } from './notify.model';
import { BaseService } from '../dstore/services/base.service';
import { StoreService } from '../dstore-client.module/services/store.service';

@Injectable({
  providedIn: 'root',
})
export class NotifyService {
  private notify$ = new ReplaySubject<Notify>(1);
  constructor(
    private sanitized: DomSanitizer,
    private http: HttpClient,
    private zone: NgZone,
    private storeService: StoreService,
  ) {
    this.getBulletin();
    if (BaseService.isNative) {
      DstoreObject.clearArchives().subscribe(() => {
        this.zone.run(() => {
          this.success(NotifyType.Clear);
          this.storeService.appDownloadSize('gedit').subscribe();
        });
      });
    }
  }

  private getBulletin() {
    this.http
      .get(BaseService.serverHosts.operationServer + '/api/bulletin', { responseType: 'text' })
      .subscribe(body => {
        const { bulletin }: { bulletin: Bulletin } = JSON.parse(
          body,
          (k: string, v) => (k.includes('Time') ? new Date(v) : v),
        );
        const t = new Date();
        if (bulletin.startTime <= t && bulletin.endTime > t) {
          let content: string;
          if (navigator.language === 'zh-CN') {
            content = bulletin.contentZh;
            if (bulletin.contentZh.length === 0) {
              content = bulletin.contentEn;
            }
          } else {
            content = bulletin.contentEn;
            if (bulletin.contentEn.length === 0) {
              content = bulletin.contentZh;
            }
          }
          this.notify({
            type: NotifyType.Bulletin,
            status: NotifyStatus.Success,
            content: content,
          });
        }
      });
  }

  notify(n: Notify) {
    console.log('notify', n);
    this.notify$.next(n);
  }
  success(t: NotifyType) {
    return this.notify({ status: NotifyStatus.Success, type: t, delay: 2000 });
  }
  error(t: NotifyType) {
    return this.notify({ status: NotifyStatus.Error, type: t, delay: 3000 });
  }

  obs() {
    return this.notify$.asObservable();
  }
}
interface Bulletin {
  topicZh: string;
  topicEn: string;
  contentZh: string;
  contentEn: string;
  startTime: Date;
  endTime: Date;
}