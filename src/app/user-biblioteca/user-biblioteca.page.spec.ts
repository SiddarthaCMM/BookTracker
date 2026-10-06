import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserBibliotecaPage } from './user-biblioteca.page';

describe('UserBibliotecaPage', () => {
  let component: UserBibliotecaPage;
  let fixture: ComponentFixture<UserBibliotecaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UserBibliotecaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
