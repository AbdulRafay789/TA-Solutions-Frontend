import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Currency {
  code: string;
  name: string;
  symbol?: string;
}

export interface ConversionRequest {
  from: string;
  to: string;
  amount: number;
}

export interface ConversionResponse {
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
export class CurrencyService {
  private apiUrl = 'https://replit.com/@abdulrafaydevel/TA-Solutions-Backend/api';

  constructor(private http: HttpClient) { }

  getCurrencies(): Observable<Currency[]> {
    return this.http.get<Currency[]>(`${this.apiUrl}/currencies`);
  }

  convertCurrency(from: string, to: string, amount: number): Observable<ConversionResponse> {
    const params = { from, to, amount: amount.toString() };
    return this.http.get<ConversionResponse>(`${this.apiUrl}/convert`, { params });
  }
}
