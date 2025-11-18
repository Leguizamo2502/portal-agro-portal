import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsMenuComponent } from './notifications-menu.component';

describe('NotificationsMenuComponent', () => {
  let component: NotificationsMenuComponent;
  let fixture: ComponentFixture<NotificationsMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
