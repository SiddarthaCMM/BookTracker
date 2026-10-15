import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet], // <--- ESTO FALTABA
})
export class AppComponent implements OnInit {
  constructor() {}

  async ngOnInit() {
    // Al arrancar la app, leemos la IP guardada y la asignamos a Axios
    const { value: ipGuardada } = await Preferences.get({ key: 'api_ip' });
    axios.defaults.baseURL = ipGuardada ? `http://${ipGuardada}/api/` : environment.apiUrl;
  }
}