import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Trailers } from './trailers';

describe('Trailers', () => {
  let component: Trailers;
  let fixture: ComponentFixture<Trailers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trailers],
    }).compileComponents();

    fixture = TestBed.createComponent(Trailers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
