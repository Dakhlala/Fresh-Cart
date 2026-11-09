import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Footer } from './footer';

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render "Get the FreshCart App" and description', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Get the FreshCart App');
    expect(compiled.textContent).toContain('We will send you a link, open it on your phone to download the app');
    expect(compiled.textContent).toContain('Share App Link');
  });

  it('should render payment partners and store badges', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Payment Partners');
    expect(compiled.textContent).toContain('Amazon Pay');
    expect(compiled.textContent).toContain('American Express');
    expect(compiled.textContent).toContain('MasterCard');
    expect(compiled.textContent).toContain('PayPal');
    expect(compiled.textContent).toContain('App Store');
    expect(compiled.textContent).toContain('Google Play');
  });
});
