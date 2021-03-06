import { Observable } from 'rxjs';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

import { UserComment, CommentsService } from '../../services/comments.service';
import { Software, SoftwareService } from 'app/services/software.service';
import { CommentError } from 'app/modules/details/components/comment/app-comment.component';

@Component({
  selector: 'dstore-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class EditComponent implements OnInit {
  @ViewChild('dialog', { static: true })
  dialogRef: ElementRef<HTMLDialogElement>;
  deleteConfirm: boolean;
  content: string;
  rate: number;
  version: string;
  CommentError = CommentError;
  error: CommentError;
  _comment: UserComment;
  @Output()
  close = new EventEmitter<boolean>();
  @Input()
  set comment(c: UserComment) {
    if (!this.dialogRef.nativeElement.open) {
      this.dialogRef.nativeElement.showModal();
    }
    this._comment = c;
    this.content = c.content;
    this.rate = c.rate / 2;
    this.version = c.version;
  }
  get comment() {
    return this._comment;
  }
  constructor(private commentService: CommentsService, private softwareService: SoftwareService) {}

  ngOnInit() {
    this.dialogRef.nativeElement.addEventListener('close', () => {
      this.closed();
    });
  }
  closed(changed: boolean = false) {
    this.close.emit(changed);
  }
  submit() {
    if (!this.content.trim()) {
      this.error = CommentError.CommentInvalid;
      return;
    }

    this.commentService
      .update(this._comment.id, {
        appName: this._comment.appName,
        content: this.content,
        rate: this.rate * 2,
        version: this._comment.version,
      })
      .toPromise()
      .then(() => {
        this.closed();
      })
      .catch(() => {
        this.error = CommentError.Failed;
      });
  }
  delete() {
    this.commentService.delete(this._comment.id).subscribe(() => {
      this.closed();
    });
  }
}
