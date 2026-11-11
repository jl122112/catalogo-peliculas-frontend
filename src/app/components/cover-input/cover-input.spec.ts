import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoverInput } from './cover-input';

describe('CoverInput', () => {
  let component: CoverInput;
  let fixture: ComponentFixture<CoverInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoverInput],
    }).compileComponents();

    fixture = TestBed.createComponent(CoverInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
