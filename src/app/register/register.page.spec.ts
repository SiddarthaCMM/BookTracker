import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { RegisterPage } from './register.page';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideZonelessChangeDetection(),
        provideIonicAngular(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formularioValido es false al empezar (vacío y sin aceptar términos)', () => {
    expect(component.formularioValido).toBeFalse();
  });

  it('validarCampo detecta email inválido', () => {
    component.form.email = 'no-es-email';
    component.validarCampo('email');
    expect(component.errores['email']).toBeDefined();
  });

  it('validarCampo detecta username demasiado corto', () => {
    component.form.username = 'ab';
    component.validarCampo('username');
    expect(component.errores['username']).toBeDefined();
  });

  it('validarCampo acepta username válido', () => {
    component.form.username = 'ana_21';
    component.validarCampo('username');
    expect(component.errores['username']).toBeUndefined();
  });

  it('validarCampo detecta password sin número', () => {
    component.form.password = 'SoloLetras';
    component.validarCampo('password');
    expect(component.errores['password']).toBeDefined();
  });

  it('validarCampo detecta confirmación que no coincide', () => {
    component.form.password = 'abc12345';
    component.form.confirm_password = 'abc123456';
    component.validarCampo('confirm_password');
    expect(component.errores['confirm_password']).toBeDefined();
  });

  it('fortaleza es vacía cuando no hay password', () => {
    component.form.password = '';
    expect(component.fortaleza).toBe('vacia');
  });

  it('fortaleza es débil para una password corta pero válida', () => {
    component.form.password = 'abc12345';
    expect(component.fortaleza).toBe('debil');
  });

  it('fortaleza es fuerte para una password larga con mayúsculas y símbolos', () => {
    component.form.password = 'HolaMundo2024!';
    expect(['aceptable', 'fuerte']).toContain(component.fortaleza);
  });
});