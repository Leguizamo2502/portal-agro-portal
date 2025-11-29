import { TestBed } from '@angular/core/testing';

import { OrderChatService } from './order-chat.service';

describe('OrderChatService', () => {
  let service: OrderChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
