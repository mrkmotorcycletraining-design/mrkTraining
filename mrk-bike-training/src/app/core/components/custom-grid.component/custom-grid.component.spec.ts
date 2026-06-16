import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomGridComponent } from './custom-grid.component';

describe('CustomGridComponent', () => {
  let component: CustomGridComponent;
  let fixture: ComponentFixture<CustomGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomGridComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
