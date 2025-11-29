import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderChatComponent } from './order-chat.component';

describe('OrderChatComponent', () => {
  let component: OrderChatComponent;
  let fixture: ComponentFixture<OrderChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderChatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
