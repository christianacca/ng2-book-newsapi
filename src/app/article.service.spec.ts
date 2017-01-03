/* tslint:disable:no-unused-variable */
/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

import { TestBed, async, inject } from '@angular/core/testing';
import { ArticleService } from './article.service';

describe('Service: Article', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ArticleService]
    });
  });

  it('should ...', inject([ArticleService], (service: ArticleService) => {
    expect(service).toBeTruthy();
  }));
});
