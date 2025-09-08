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
          <div id="g_id_onload"
               [attr.data-client_id]="clientId"
               data-context="signin"
               data-ux_mode="popup"
               data-callback="handleCredentialResponse"
               data-auto_prompt="false">
          </div>
          
          <div class="g_id_signin"
               data-type="standard"
               data-shape="rectangular"
               data-theme="outline"
               data-text="signin_with"
               data-size="large"
               data-logo_alignment="left">
          </div>
        </div>
        
        <div class="login-footer">
          <p class="restriction-note">
            Only &#64;samator.com email addresses are allowed
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
      text-align: center;
    }

    .login-header h1 {
      color: #333;
      margin-bottom: 0.5rem;
      font-size: 1.8rem;
    }

    .login-header p {
      color: #666;
      margin-bottom: 2rem;
    }

    .login-content {
      margin: 2rem 0;
      display: flex;
      justify-content: center;
    }

    .error-message {
      background: #fee;
      border: 1px solid #fcc;
      color: #c33;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }

    .restriction-note {
      font-size: 0.85rem;
      color: #888;
      margin-top: 1.5rem;
    }

    .g_id_signin {
      display: flex !important;
      justify-content: center !important;
    }
  `]
})
export class LoginComponent implements OnInit {
  clientId = ''; // Will be set from environment or config
  error = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadGoogleScript();
    }
  }

  private loadGoogleScript() {
    // Set your Google OAuth client ID here - REPLACE WITH ACTUAL CLIENT ID
    this.clientId = '1087146405276-c5bibhl798enob6bo4lqolfqh9m4kuig.apps.googleusercontent.com';
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.initializeGoogleSignIn();
    };
    document.head.appendChild(script);
  }

  private initializeGoogleSignIn() {
    // Make handleCredentialResponse available globally
    (window as any).handleCredentialResponse = (response: any) => {
      this.handleCredentialResponse(response);
    };

    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => this.handleCredentialResponse(response),
        auto_select: false,
        cancel_on_tap_outside: true
      });
      
      google.accounts.id.renderButton(
        document.querySelector('.g_id_signin'),
        {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left'
        }
      );
    }
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
    window.location.href = '/dashboard';
  }
}
