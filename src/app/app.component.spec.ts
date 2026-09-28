import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('creates the app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the app title in the header', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-header__brand')?.textContent).toContain('Kitchen Orders Board');
  });

  it('toggles the language when the language button is clicked', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance['i18n'].lang()).toBe('ar');
  });
});
