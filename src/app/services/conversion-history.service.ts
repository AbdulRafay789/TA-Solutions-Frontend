import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface ConversionHistory {
  id: string;
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConversionHistoryService {
  private apiUrl = 'https://replit.com/@abdulrafaydevel/TA-Solutions-Backend/api';
  private conversionsSubject = new BehaviorSubject<ConversionHistory[]>([]);
  public conversions$ = this.conversionsSubject.asObservable();

  constructor(private http: HttpClient) { }

  getConversions(limit: number = 50): Observable<ConversionHistory[]> {
    return this.http.get<ConversionHistory[]>(`${this.apiUrl}/conversions`, {
      params: { limit: limit.toString() }
    }).pipe(
      tap(conversions => this.conversionsSubject.next(conversions))
    );
  }

  saveConversion(conversion: Omit<ConversionHistory, 'id'>): Observable<ConversionHistory> {
    return this.http.post<ConversionHistory>(`${this.apiUrl}/conversions`, conversion).pipe(
      tap(newConversion => {
        const currentConversions = this.conversionsSubject.value;
        this.conversionsSubject.next([newConversion, ...currentConversions]);
      })
    );
  }

  clearHistory(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/conversions`).pipe(
      tap(() => this.conversionsSubject.next([]))
    );
  }

  refreshConversions(): void {
    this.getConversions().subscribe();
  }
}
