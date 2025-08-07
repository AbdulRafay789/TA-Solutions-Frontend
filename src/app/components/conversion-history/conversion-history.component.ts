import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConversionHistoryService, ConversionHistory } from '../../services/conversion-history.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-conversion-history',
  templateUrl: './conversion-history.component.html',
  styleUrls: ['./conversion-history.component.scss']
})
export class ConversionHistoryComponent implements OnInit, OnDestroy {
  conversions: ConversionHistory[] = [];
  isLoading = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private conversionHistoryService: ConversionHistoryService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadConversions();
    
    // Subscribe to real-time updates
    this.subscription.add(
      this.conversionHistoryService.conversions$.subscribe(conversions => {
        this.conversions = conversions;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadConversions(): void {
    this.isLoading = true;
    this.subscription.add(
      this.conversionHistoryService.getConversions().subscribe({
        next: (conversions) => {
          this.conversions = conversions;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading conversion history:', error);
          this.snackBar.open('Failed to load conversion history', 'Close', {
            duration: 3000,
            panelClass: ['error-message']
          });
          this.isLoading = false;
        }
      })
    );
  }

  clearHistory(): void {
    if (confirm('Are you sure you want to clear all conversion history?')) {
      this.subscription.add(
        this.conversionHistoryService.clearHistory().subscribe({
          next: () => {
            this.conversions = [];
            this.snackBar.open('Conversion history cleared successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-message']
            });
          },
          error: (error) => {
            console.error('Error clearing conversion history:', error);
            this.snackBar.open('Failed to clear conversion history', 'Close', {
              duration: 3000,
              panelClass: ['error-message']
            });
          }
        })
      );
    }
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    // If it's today, show time only
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    // If it's yesterday, show "Yesterday at time"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    // If it's within the last 7 days, show day name and time
    if (diffInHours < 168) {
      return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    // Otherwise, show full date and time
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  }

  getLatestConversionDate(): string {
    if (this.conversions.length === 0) {
      return 'No conversions';
    }
    const latest = this.conversions[0]; // Assuming conversions are sorted by date (newest first)
    return this.formatDate(latest.timestamp);
  }

  trackByConversion(index: number, conversion: ConversionHistory): string {
    return conversion.id || index.toString();
  }
}
