import { TestBed } from '@angular/core/testing';

import { NotificationHubService } from './notification-hub.service';

describe('NotificationHubService', () => {
  let service: NotificationHubService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationHubService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
