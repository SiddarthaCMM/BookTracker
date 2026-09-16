import { Injectable } from '@angular/core';
import axios from 'axios';

export interface UserCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user_id?: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'http://127.0.0.1/api/login.php';

  constructor() {}

  async login(credentials: UserCredentials): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(this.apiUrl, credentials);
    return response.data;
  }
}