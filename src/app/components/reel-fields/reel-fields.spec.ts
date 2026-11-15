import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReelFields } from './reel-fields';

describe('ReelFields', () => {
  let component: ReelFields;
  let fixture: ComponentFixture<ReelFields>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReelFields],
    }).compileComponents();

    fixture = TestBed.createComponent(ReelFields);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
