import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface User {
  email: string;
  name: string;
  picture: string;
  loginTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.checkExistingLogin();
  }

  private checkExistingLogin() {
    if (isPlatformBrowser(this.platformId)) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          // Check if login is still valid (e.g., within 24 hours)
          const loginTime = new Date(user.loginTime);
          const now = new Date();
          const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            this.setLoggedIn(user);
          } else {
            this.logout();
          }
        } catch (error) {
          this.logout();
        }
      }
    }
  }

  setLoggedIn(user: User) {
    this.isLoggedInSubject.next(true);
    this.currentUserSubject.next(user);
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
    }
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
  }

  isValidSamatorEmail(email: string): boolean {
    return email.endsWith('@samator.com');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }
}
