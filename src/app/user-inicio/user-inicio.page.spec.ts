import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserInicioPage } from './user-inicio.page';

describe('UserInicioPage', () => {
  let component: UserInicioPage;
  let fixture: ComponentFixture<UserInicioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UserInicioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
