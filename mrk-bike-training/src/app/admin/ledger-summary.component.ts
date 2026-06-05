import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrainingApiService } from '../core/services/training-api.service';
import { LedgerSummaryApi } from '../core/models/api.models';

@Component({
  selector: 'app-ledger-summary',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2>Financial ledger</h2>
    <div class="filters">
      <label>Branch <input [(ngModel)]="branchId" name="b" placeholder="optional" /></label>
      <label>From <input type="date" [(ngModel)]="from" name="f" /></label>
      <label>To <input type="date" [(ngModel)]="to" name="t" /></label>
      <button type="button" (click)="load()">Load</button>
    </div>
    @if (summary(); as s) {
      <p>Income: {{ s.totalIncome }} | Expense: {{ s.totalExpense }}</p>
      <ul>
        @for (entry of branchEntries(s); track entry[0]) {
          <li>{{ entry[0] }} — income {{ entry[1].income }}, expense {{ entry[1].expense }}</li>
        }
      </ul>
    }
    <h3>Add expense</h3>
    <form (ngSubmit)="addExpense()" class="form">
      <label>Branch <input [(ngModel)]="expBranch" name="eb" required /></label>
      <label>Type
        <select [(ngModel)]="expType" name="et">
          <option value="EXPENSE_MISC">Misc</option>
          <option value="EXPENSE_ASSET_MAINTENANCE">Asset maintenance</option>
          <option value="EXPENSE_TRAINER_SALARY">Trainer salary</option>
        </select>
      </label>
      <label>Amount <input type="number" [(ngModel)]="expAmount" name="ea" required /></label>
      <label>Date <input type="date" [(ngModel)]="expDate" name="ed" required /></label>
      <button type="submit">Add</button>
    </form>
  `,
  styles: `
    .filters, .form { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
  `
})
export class LedgerSummaryComponent implements OnInit {
  private readonly api = inject(TrainingApiService);
  summary = signal<LedgerSummaryApi | null>(null);
  branchId = '';
  from = new Date().toISOString().slice(0, 10);
  to = new Date().toISOString().slice(0, 10);
  expBranch = '';
  expType = 'EXPENSE_MISC';
  expAmount = 0;
  expDate = new Date().toISOString().slice(0, 10);

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.ledgerSummary(this.branchId || null, this.from, this.to).subscribe((s) => this.summary.set(s));
  }

  branchEntries(s: LedgerSummaryApi) {
    return Object.entries(s.byBranch ?? {});
  }

  addExpense() {
    this.api
      .addExpense({
        branchId: this.expBranch,
        type: this.expType,
        amount: this.expAmount,
        transactionDate: this.expDate
      })
      .subscribe(() => this.load());
  }
}
