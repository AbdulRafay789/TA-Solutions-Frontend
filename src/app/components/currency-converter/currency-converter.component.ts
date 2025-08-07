import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyService, Currency, ConversionResponse } from '../../services/currency.service';
import { ConversionHistoryService } from '../../services/conversion-history.service';

@Component({
  selector: 'app-currency-converter',
  templateUrl: './currency-converter.component.html',
  styleUrls: ['./currency-converter.component.scss']
})
export class CurrencyConverterComponent implements OnInit {
  converterForm: FormGroup;
  currencies: Currency[] = [];
  conversionResult: ConversionResponse | null = null;
  isLoading = false;
  isLoadingCurrencies = false;

  constructor(
    private fb: FormBuilder,
    private currencyService: CurrencyService,
    private conversionHistoryService: ConversionHistoryService,
    private snackBar: MatSnackBar
  ) {
    this.converterForm = this.fb.group({
      fromCurrency: ['', Validators.required],
      toCurrency: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    this.isLoadingCurrencies = true;
    this.currencyService.getCurrencies().subscribe({
      next: (currencies) => {
        this.currencies = currencies;
        this.isLoadingCurrencies = false;
      },
      error: (error) => {
        console.error('Error loading currencies:', error);
        this.snackBar.open('Failed to load currencies', 'Close', {
          duration: 3000,
          panelClass: ['error-message']
        });
        this.isLoadingCurrencies = false;
      }
    });
  }

  convertCurrency(): void {
    if (this.converterForm.valid) {
      const { fromCurrency, toCurrency, amount } = this.converterForm.value;
      
      if (fromCurrency === toCurrency) {
        this.snackBar.open('Please select different currencies', 'Close', {
          duration: 3000,
          panelClass: ['error-message']
        });
        return;
      }

      this.isLoading = true;
      this.conversionResult = null;

      this.currencyService.convertCurrency(fromCurrency, toCurrency, amount).subscribe({
        next: (result) => {
          this.conversionResult = result;
          this.isLoading = false;
          
          // Save to history
          this.conversionHistoryService.saveConversion({
            from: result.from,
            to: result.to,
            amount: result.amount,
            result: result.result,
            rate: result.rate,
            timestamp: result.timestamp
          }).subscribe({
            next: () => {
              // Conversion saved successfully - the history component will be notified automatically
            },
            error: (error) => {
              console.error('Error saving conversion to history:', error);
              // Don't show error to user as the conversion was successful
            }
          });

          this.snackBar.open('Conversion completed successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-message']
          });
        },
        error: (error) => {
          console.error('Error converting currency:', error);
          this.snackBar.open('Failed to convert currency. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-message']
          });
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  swapCurrencies(): void {
    const { fromCurrency, toCurrency } = this.converterForm.value;
    if (fromCurrency && toCurrency) {
      this.converterForm.patchValue({
        fromCurrency: toCurrency,
        toCurrency: fromCurrency
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.converterForm.controls).forEach(key => {
      const control = this.converterForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.converterForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
    }
    if (control?.hasError('min')) {
      return 'Amount must be greater than 0';
    }
    return '';
  }
}
