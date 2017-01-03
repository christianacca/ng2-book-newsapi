import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import { Observable, BehaviorSubject } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import { Article } from './article';
import { environment } from '../environments/environment';

/*
 * [].sort(compare(a, b))
 * return value
 *   0 == they are equal in sort
 *   1 == a comes before b
 *   -1 == b comes before a
 */
interface ArticleSortFn {
  (a: Article, b: Article): number;
}

interface ArticleSortOrderFn {
  (direction: number): ArticleSortFn;
}

const sortByTime: ArticleSortOrderFn =
  (direction: number) => (a: Article, b: Article) => {
    return direction *
      (b.publishedAt.getTime() -
        a.publishedAt.getTime());
  };

const sortByVotes: ArticleSortOrderFn =
  (direction: number) => (a: Article, b: Article) => {
    return direction * (b.votes - a.votes);
  };

const sortFns = {
  'Time': sortByTime,
  'Votes': sortByVotes
};


@Injectable()
export class ArticleService {
  private _articles: BehaviorSubject<Article[]> =
  new BehaviorSubject<Article[]>([]);
  private _sources: BehaviorSubject<any> =
  new BehaviorSubject<any>([]);

  private _refreshSubject: BehaviorSubject<string> = new
    BehaviorSubject<string>('reddit-r-all');
  private _sortSubject = new BehaviorSubject({
    fn: sortByTime,
    direction: 1
  });
  private _filterbySubject: BehaviorSubject<string> = new
    BehaviorSubject<string>('');

  public sources: Observable<any> = this._sources.asObservable();
  public articles: Observable<Article[]> = this._articles.asObservable();
  public orderedArticles: Observable<Article[]>;

  constructor(
    private http: Http
  ) {
    this._refreshSubject
      .subscribe(this.getArticles.bind(this));

    const sorter$ = this._sortSubject
      .scan((prev, curr) => Object.assign({}, prev || {}, curr))
      .map(({ fn, direction}) => fn(direction));

    const filter$ = this._filterbySubject.map(s => {
      const re = new RegExp(s, 'gi');
      return (a: Article) => re.exec(a.title);
    });

    this.orderedArticles =
      Observable.combineLatest(
        this._articles, sorter$, filter$
      )
        .map(([
          articles, sorter, predicate
        ]) => articles
          .filter(predicate)
          .sort(sorter)
        );
  }

  public sortBy(
    filter: string,
    direction: number
  ): void {
    this._sortSubject.next({ fn: sortFns[filter], direction });
  }

  public filterBy(filter: string) {
    this._filterbySubject.next(filter);
  }

  public updateArticles(sourceKey): void {
    this._refreshSubject.next(sourceKey);
  }

  public getArticles(sourceKey = 'reddit-r-all'): void {
    // make the http request -> Observable
    // convert response into article class
    // update our subject
    this._makeHttpRequest('/v1/articles', sourceKey)
      .map(json => json.articles)
      .subscribe(articlesJSON => {
        const articles = articlesJSON
          .map(articlejson => Article.fromJSON(articlejson));
        this._articles.next(articles);
      });
  }

  public getSources(): void {
    this._makeHttpRequest('/v1/sources')
      .map(json => json.sources)
      .filter(list => list.length > 0)
      .subscribe(this._sources);
  }

  private _makeHttpRequest(
    path: string,
    sourceKey?: string
  ): Observable<any> {
    let params = new URLSearchParams();
    params.set('apiKey', environment.newsApiKey);
    if (sourceKey && sourceKey !== '') {
      params.set('source', sourceKey);
    }

    return this.http
      .get(`${environment.baseUrl}${path}`, {
        search: params
      }).map(resp => resp.json());
  }

}
