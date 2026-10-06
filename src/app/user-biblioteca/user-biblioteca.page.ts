import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-user-biblioteca',
  templateUrl: './user-biblioteca.page.html',
  styleUrls: ['./user-biblioteca.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class UserBibliotecaPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
