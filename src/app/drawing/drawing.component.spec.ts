import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawingComponent } from './drawing.component';

describe('DrawingComponent', () => {
  let component: DrawingComponent;
  let fixture: ComponentFixture<DrawingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DrawingComponent]
    });
    fixture = TestBed.createComponent(DrawingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
