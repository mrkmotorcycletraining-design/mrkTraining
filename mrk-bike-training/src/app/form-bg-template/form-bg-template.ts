import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-bg-template',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="outer-container">
      <div class="inner-blue-box">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .outer-container {
      width: 100%;
      display: flex;
      color: white;
      justify-content: center;
    }
    .inner-blue-box {
      width: 75%;
      padding: 40px;
      /* Updated to match the menu bar color from image_69f143.png */
      background-color: #0499fcff; 
      opacity: 0.8;
      backdrop-filter: blur(10px);
      border-radius: 12px;
      color: white important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(25, 118, 210, 0.2);
    }
  `]
})
export class FormBgTemplateComponent {}