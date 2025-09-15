import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Order Tracking Board</h1>
          <p>Please sign in with your Samator account</p>
        </div>
        
        @if (error) {
          <div class="error-message">
            <p>{{ error }}</p>
          </div>
        }
        
        <div class="login-content">
          @if (!showFallback && googleSignInReady) {
            <div id="google-signin-button"></div>
          }
          
          @if (showFallback || !googleSignInReady) {
            <div class="fallback-login">
              <p class="fallback-message">{{ fallbackMessage }}</p>
              <button class="manual-login-btn" (click)="manualLogin()">
                Continue to Dashboard
              </button>
            </div>
          }
        </div>
        
        <div class="login-footer">
          <p class="restriction-note">
            Development Mode - Manual Login Available
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }

    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
      position: fixed;
      top: 0;
      left: 0;
    }

    .login-card {
      background: white;
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      width: 100%;
      max-width: 420px;
      text-align: center;
      border: none;
      outline: none;
    }

    .login-header h1 {
      color: #333;
      margin-bottom: 0.5rem;
      font-size: 2rem;
      font-weight: 600;
    }

    .login-header p {
      color: #666;
      margin-bottom: 2.5rem;
      font-size: 1rem;
    }

    .login-content {
      margin: 2.5rem 0;
      display: flex;
      justify-content: center;
    }

    .error-message {
      background: #fee;
      border: 1px solid #fcc;
      color: #c33;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }

    .restriction-note {
      font-size: 0.85rem;
      color: #888;
      margin-top: 2rem;
    }

    .fallback-login {
      margin-top: 1rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }

    .fallback-message {
      color: #6c757d;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .manual-login-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s;
      width: 100%;
      max-width: 300px;
    }

    .manual-login-btn:hover {
      background: #0056b3;
    }

    #google-signin-button {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50px;
    }
  `]
})
export class LoginComponent implements OnInit {
  clientId = ''; // Will be set from environment or config
  error = '';
  showFallback = false;
  googleSignInReady = false;
  fallbackMessage = 'Google Sign-In is not available';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Set fallback timer in case Google Sign-In fails to load
      setTimeout(() => {
        if (!this.googleSignInReady) {
          this.showFallback = true;
          this.fallbackMessage = 'Google Sign-In could not be loaded. Using manual login.';
        }
      }, 3000);
      
      this.loadGoogleScript();
    } else {
      this.showFallback = true;
      this.fallbackMessage = 'Server-side rendering detected. Please use manual login.';
    }
  }

  private loadGoogleScript() {
    // For now, skip Google Sign-In and use manual login
    this.showFallback = true;
    this.fallbackMessage = 'Using manual login for development';
    return;
    
    /* Commented out Google Sign-In code to prevent errors
    // Set your Google OAuth client ID here - REPLACE WITH ACTUAL CLIENT ID
    this.clientId = '1087146405276-c5bibhl798enob6bo4lqolfqh9m4kuig.apps.googleusercontent.com';
    
    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      this.initializeGoogleSignIn();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.initializeGoogleSignIn();
    };
    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
      this.error = 'Failed to load Google Sign-In. Please check your internet connection.';
      this.showFallback = true;
    };
    document.head.appendChild(script);
    */
  }

  private initializeGoogleSignIn() {
    // Commented out to prevent errors
    /*
    // Add a delay to ensure DOM is ready
    setTimeout(() => {
      // Make handleCredentialResponse available globally
      (window as any).handleCredentialResponse = (response: any) => {
        this.handleCredentialResponse(response);
      };

      if (typeof google !== 'undefined' && google.accounts) {
        try {
          google.accounts.id.initialize({
            client_id: this.clientId,
            callback: (response: any) => this.handleCredentialResponse(response),
            auto_select: false,
            cancel_on_tap_outside: true
          });
          
          const buttonElement = document.getElementById('google-signin-button');
          if (buttonElement) {
            google.accounts.id.renderButton(
              buttonElement,
              {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                shape: 'rectangular',
                text: 'signin_with',
                logo_alignment: 'left',
                width: 300
              }
            );
            this.googleSignInReady = true;
          }
        } catch (error) {
          console.error('Error initializing Google Sign-In:', error);
          this.error = 'Failed to initialize Google Sign-In. Please refresh the page.';
          this.showFallback = true;
        }
      } else {
        this.error = 'Google Sign-In is not available. Please refresh the page.';
        this.showFallback = true;
      }
    }, 100);
    */
  }

  manualLogin() {
    // For development/testing purposes
    const mockUser = {
      email: 'test@samator.com',
      name: 'Test User',
      picture: '',
      loginTime: new Date().toISOString()
    };
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user', JSON.stringify(mockUser));
    }
    
    window.location.href = '/dashboard';
  }

  handleCredentialResponse(response: any) {
    try {
      // Decode JWT token to get user info
      const token = response.credential;
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check if email domain is @samator.com
      const email = payload.email;
      if (!email.endsWith('@samator.com')) {
        this.error = 'Access denied. Only @samator.com email addresses are allowed.';
        return;
      }

      // If domain is correct, proceed with login
      this.error = '';
      this.loginSuccess(payload);
      
    } catch (error) {
      console.error('Error processing login:', error);
      this.error = 'Login failed. Please try again.';
    }
  }

  private loginSuccess(userInfo: any) {
    // Store user info in localStorage or state management
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user', JSON.stringify({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        loginTime: new Date().toISOString()
      }));
    }

    // Navigate to dashboard after successful login
    console.log('Login successful:', userInfo);
    
    // Redirect to dashboard
    window.location.href = '/queuedashboard/dashboard';
  }
}
