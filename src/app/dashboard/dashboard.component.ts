import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { AuthService, User } from '../services/auth.service';
import { Router } from '@angular/router';

interface ApiResponse {
  Result: {
    Errors: any[];
    ExecutionInfo: any[];
    Results: ApiOrderItem[];
  };
}

interface ApiOrderItem {
  OrderNum: number;
  CustomerID: string;
  Name: string;
  CreateDate: string | null;
  OrderDate: string;
  NeedByDate: string;
  Status: string;
  PONum: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="dashboard-container">
      <!-- Header with user info -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="header-left">
            <h1>Order Tracking Board</h1>
            <div class="live-indicator">
              <span class="live-dot"></span>
              LIVE {{ currentTime | date:'HH:mm:ss' }}
            </div>
          </div>
          <div class="header-right">
            <div class="filter-section">
              <label for="filter-select" class="filter-label">Filter by:</label>
              <select 
                id="filter-select"
                [(ngModel)]="selectedFilter" 
                class="filter-dropdown">
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="3months">3 Months</option>
                <option value="6months">6 Months</option>
                <option value="year">1 Year</option>
              </select>
            </div>
            
            <!-- Search filter -->
            <div class="search-section">
              <label for="search-input" class="filter-label">Search:</label>
              <input 
                id="search-input"
                type="text" 
                [(ngModel)]="searchFilter" 
                placeholder="Order Number, Customer ID, Name, PO Number"
                class="search-input">
            </div>
            
            <div class="section-filter">
              <label class="filter-label">Sections:</label>
              <div class="dropdown-container">
                <button 
                  class="dropdown-toggle" 
                  (click)="toggleDropdown()"
                  type="button">
                  Sections ({{ getVisibleSections().length }}/{{ availableSections.length }})
                  <span class="dropdown-arrow" [class.open]="isDropdownOpen">▼</span>
                </button>
                <div class="dropdown-menu" [class.show]="isDropdownOpen">
                  <label class="dropdown-item select-all-item">
                    <input 
                      type="checkbox" 
                      [checked]="isAllSelected()"
                      (change)="toggleSelectAll()">
                    <span class="select-all-text">{{ getSelectAllText() }}</span>
                  </label>
                  <div class="dropdown-divider"></div>
                  @for (section of availableSections; track section) {
                    <label class="dropdown-item">
                      <input 
                        type="checkbox" 
                        [checked]="getSectionChecked(section)"
                        (change)="toggleSectionFilter(section)">
                      <span>{{ section }}</span>
                    </label>
                  }
                </div>
              </div>
            </div>
            <button (click)="logout()" class="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <!-- Main content -->
      <div class="board-container" (click)="closeDropdown()">
        @if (error) {
          <div class="error-message">{{ error }}</div>
        } @else if (isLoading) {
          <div class="loading">Loading orders...</div>
        } @else {
          <div class="board" [style.height]="'calc(100vh - 80px)'" 
               [ngClass]="{
                 'three-sections': getVisibleSections().length === 3,
                 'four-sections': getVisibleSections().length === 4
               }">
            @for (section of getVisibleSections(); track section) {
              <div class="board-row" [style.height]="getSectionHeight()">
                <div class="row-header clickable" (click)="openStatusDetail(section)">
                  <div class="header-content">
                    <span class="section-title">
                      {{ section }}
                      <span class="order-counter">{{ getOrderCountText(section) }}</span>
                      <button 
                        class="info-button" 
                        (click)="showTooltip(section, $event)"
                        type="button"
                        [attr.aria-label]="'Information about ' + section">
                        ?
                      </button>
                    </span>
                  </div>
                  <span class="expand-icon">→</span>
                </div>
                <div class="row-content" [ngClass]="{'single-section': getVisibleSections().length === 1}">
                  @for (order of getLatestOrdersByStatus(section); track order.OrderNum) {
                    <div class="order-rectangle" 
                         [class]="getColorClass(order)" 
                         (click)="openOrderModal(order, $event)"
                         [title]="'Order: ' + order.OrderNum + '\\nCustomer: ' + order.CustomerID + '\\nName: ' + order.Name + '\\nTime remaining: ' + getTimeRemaining(order)">
                      <div class="order-content">
                        <div class="order-number">{{ order.OrderNum }}</div>
                        <div class="order-name">
                          @if (order.Name.length > 15) {
                            <div class="scrolling-text">{{ order.Name }}</div>
                          } @else {
                            <div class="static-text">{{ order.Name }}</div>
                          }
                        </div>
                        @if (getColorClass(order) === 'color-yellow' || getColorClass(order) === 'color-red') {
                          <div class="time-remaining">{{ getTimeRemaining(order) }}</div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Info Popup Modal -->
    @if (activeTooltip) {
      <div class="popup-overlay" (click)="hideTooltip()">
        <div class="popup-modal" (click)="$event.stopPropagation()">
          <div class="popup-header">
            <h3>{{ activeTooltip }} Information</h3>
            <button class="popup-close" (click)="hideTooltip()" type="button">×</button>
          </div>
          <div class="popup-content">
            {{ getSectionInfo(activeTooltip) }}
          </div>
        </div>
      </div>
    }

    <!-- Order Detail Modal -->
    @if (isOrderModalOpen && selectedOrder) {
      <div class="modal-overlay" (click)="closeOrderModal()">
        <div class="order-modal" (click)="$event.stopPropagation()">
          <button class="modal-close-simple" (click)="closeOrderModal()" type="button">×</button>
          <div class="modal-content">
            <div class="order-card-detail" [class]="getColorClass(selectedOrder)">
              <div class="card-header-detail">
                <div class="header-left-detail">
                  <span class="order-number-detail">Order #{{ selectedOrder.OrderNum }}</span>
                  <span class="color-indicator-detail" [class]="getColorClass(selectedOrder)"></span>
                </div>
              </div>
              <div class="card-body-detail">
                <div class="order-info-detail">
                  <div class="info-row-detail">
                    <label>Customer:</label>
                    <span>{{ selectedOrder.CustomerID }}</span>
                  </div>
                  <div class="info-row-detail">
                    <label>Name:</label>
                    <span>{{ selectedOrder.Name }}</span>
                  </div>
                  <div class="info-row-detail">
                    <label>PO Number:</label>
                    <span>{{ selectedOrder.PONum || 'N/A' }}</span>
                  </div>
                  <div class="info-row-detail">
                    <label>Created:</label>
                    <span>{{ selectedOrder.CreateDate | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <div class="info-row-detail">
                    <label>Order Date:</label>
                    <span>{{ selectedOrder.OrderDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="info-row-detail">
                    <label>Need By:</label>
                    <span>{{ selectedOrder.NeedByDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="info-row-detail time-row-detail">
                    <label>Time Remaining:</label>
                    <span class="time-value-detail" [class]="getColorClass(selectedOrder)">{{ getTimeRemainingForModal(selectedOrder) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dashboard-container {
      height: 100vh;
      background: #f5f5f5;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 0;
      margin: 0;
    }

    .dashboard-header {
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 0.25rem 0;
      flex: 0 0 auto;
    }

    .header-content {
      width: 100%;
      margin: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0.5rem;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .filter-dropdown {
      background: #f8f9fa;
      color: #333;
      border: 1px solid #dee2e6;
      padding: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      min-width: 120px;
    }

    .filter-dropdown:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .search-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .search-input {
      background: #f8f9fa;
      color: #333;
      border: 1px solid #dee2e6;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      min-width: 200px;
    }

    .search-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .search-input::placeholder {
      color: #6c757d;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .section-filter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      position: relative;
    }

    .dropdown-container {
      position: relative;
      display: inline-block;
    }

    .dropdown-toggle {
      background: #f8f9fa;
      color: #333;
      border: 1px solid #dee2e6;
      padding: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      min-width: 180px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dropdown-toggle:hover {
      background: #e2e6ea;
    }

    .dropdown-arrow {
      transition: transform 0.2s;
    }

    .dropdown-arrow.open {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-height: 200px;
      overflow-y: auto;
      display: none;
    }

    .dropdown-menu.show {
      display: block;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      border-bottom: 1px solid #f8f9fa;
    }

    .dropdown-item:hover {
      background: #f8f9fa;
    }

    .dropdown-item:last-child {
      border-bottom: none;
    }

    .dropdown-item input[type="checkbox"] {
      margin: 0;
    }

    .select-all-item {
      background: #f8f9fa;
      font-weight: 600;
    }

    .select-all-item:hover {
      background: #e9ecef;
    }

    .select-all-text {
      color: #495057;
      font-weight: 600;
    }

    .dropdown-divider {
      height: 1px;
      background: #dee2e6;
      margin: 0.25rem 0;
    }

    .dashboard-header h1 {
      color: #333;
      margin: 0;
      font-size: 1.25rem;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #28a745;
      font-weight: 600;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      background: #28a745;
      border-radius: 50%;
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.3; }
    }

    .logout-btn {
      background: #dc3545;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .logout-btn:hover {
      background: #c82333;
    }

    .board-container {
      flex: 1;
      width: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .board {
      display: flex;
      flex-direction: column;
      gap: 2px;
      height: 100%;
      overflow: hidden;
      padding: 2px;
      background: #e9ecef;
    }

    .board-row {
      background: white;
      padding: 0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      margin: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
      width: 100%;
    }

    .row-header {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      border-bottom: 1px solid #e9ecef;
      padding: 4px 8px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex: 0 0 auto;
      position: relative;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      pointer-events: none; /* Prevent this from intercepting clicks */
    }

    .section-title .info-button {
      pointer-events: auto; /* Re-enable clicks for the button */
    }

    .order-counter {
      font-size: 0.75rem;
      color: #6c757d;
      font-weight: 500;
      margin-left: 8px;
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 10px;
      border: 1px solid #dee2e6;
      white-space: nowrap;
    }

    .info-button {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1px solid #007bff;
      background: #007bff;
      color: white;
      font-size: 8px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      padding: 5px; /* Further reduced padding */
      line-height: 1;
      margin-left: 6px;
      position: relative;
      min-width: 22px; /* Further reduced minimum clickable area */
      min-height: 22px; /* Further reduced minimum clickable area */
      border-radius: 50%;
    }

    .info-button:hover {
      background: #0056b3;
      border-color: #0056b3;
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
    }

    .info-button:active {
      transform: scale(0.95);
    }

    .info-button:focus {
      outline: 2px solid rgba(0, 123, 255, 0.5);
      outline-offset: 2px;
    }

    /* Popup Modal Styles */
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    .popup-modal {
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    }

    .popup-header {
      background: #f8f9fa;
      padding: 16px 20px;
      border-bottom: 1px solid #dee2e6;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .popup-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }

    .popup-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6c757d;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .popup-close:hover {
      background: #e9ecef;
      color: #333;
    }

    .popup-content {
      padding: 20px;
      font-size: 0.95rem;
      line-height: 1.5;
      color: #333;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Order Detail Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      animation: fadeIn 0.2s ease-out;
    }

    .order-modal {
      background: transparent;
      border-radius: 12px;
      box-shadow: none;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
      position: relative;
    }

    .modal-close-simple {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.6);
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: white;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
      z-index: 10;
      font-weight: bold;
    }

    .modal-close-simple:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: scale(1.1);
    }

    .modal-content {
      padding: 0;
    }

    .order-card-detail {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      border-left: 4px solid #dee2e6;
    }

    .order-card-detail.color-green {
      border-left-color: #28a745;
      background: white !important;
    }

    .order-card-detail.color-yellow {
      border-left-color: #ffc107;
      background: white !important;
    }

    .order-card-detail.color-red {
      border-left-color: #dc3545;
      background: white !important;
    }

    .card-header-detail {
      background: #f8f9fa;
      padding: 1rem;
      border-bottom: 1px solid #e9ecef;
    }

    .header-left-detail {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .order-number-detail {
      font-weight: 700;
      font-size: 1.1rem;
      color: #333;
    }

    .color-indicator-detail {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    .color-indicator-detail.color-green {
      background: #28a745;
    }

    .color-indicator-detail.color-yellow {
      background: #ffc107;
    }

    .color-indicator-detail.color-red {
      background: #dc3545;
    }

    .card-body-detail {
      padding: 1rem;
      background: white !important;
    }

    .order-info-detail {
      background: white !important;
    }

    .info-row-detail {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      padding: 0.25rem 0;
      background: white !important;
    }

    .info-row-detail label {
      font-weight: 600;
      color: #333;
      min-width: 120px;
    }

    .info-row-detail span {
      color: #6c757d;
      text-align: right;
    }

    .order-card-detail .info-row-detail label {
      color: #333 !important;
    }

    .order-card-detail .info-row-detail span {
      color: #6c757d !important;
    }

    .time-row-detail {
      border-top: 1px solid #e9ecef;
      padding-top: 0.75rem;
      margin-top: 0.75rem;
    }

    .time-value-detail {
      font-weight: 700;
      font-size: 1rem;
      background: none !important;
      padding: 0 !important;
    }

    .time-value-detail.color-green {
      color: #28a745;
      background: none !important;
    }

    .time-value-detail.color-yellow {
      color: #856404;
      background: none !important;
    }

    .time-value-detail.color-red {
      color: #dc3545;
      background: none !important;
    }

    .row-content {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 3px;
      padding: 6px;
      overflow: hidden;
      min-height: 0;
      align-items: stretch;
      justify-content: stretch;
      width: calc(100% - 12px);
      max-width: 100%;
    }

    /* CSS untuk grid layout berdasarkan jumlah section */
    .row-content.single-section { grid-template-rows: repeat(9, 1fr); gap: 4px; padding: 8px; }
    .row-content:not(.single-section) { grid-template-rows: repeat(4, 1fr); }
    .three-sections .row-content { grid-template-rows: repeat(3, 1fr); }
    .four-sections .row-content { grid-template-rows: repeat(2, 1fr); }

    .board-row {
      background: white;
      margin: 0;
      padding: 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid #dee2e6;
    }

    .order-rectangle {
      width: 100%;
      height: 100%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-weight: 600;
      cursor: pointer;
      position: relative;
      text-align: center;
      padding: 2px;
      margin: 0;
    }

    .order-rectangle:hover {
      transform: scale(1.02);
    }

    .order-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 100%;
      padding: 1px;
      gap: 1px;
    }

    .order-number {
      font-size: 0.8rem;
      line-height: 1.2;
      margin: 0;
      font-weight: 800;
      padding: 1px;
      text-align: center;
    }

    .order-name {
      font-size: 0.75rem;
      line-height: 1.2;
      margin: 0;
      padding: 1px;
      font-weight: 600;
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-align: center;
      text-overflow: ellipsis;
    }

    .scrolling-text {
      display: inline-block;
      white-space: nowrap;
      animation: scrollTextCycle 12s linear infinite;
      padding-right: 5px;
    }

    @keyframes scrollTextCycle {
      0%, 15% {
        transform: translateX(0%);
      }
      40%, 55% {
        transform: translateX(-50%);
      }
      80%, 95% {
        transform: translateX(-100%);
      }
      96%, 100% {
        transform: translateX(0%);
      }
    }

    .static-text {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .time-remaining {
      font-size: 0.7rem;
      line-height: 1.2;
      margin: 0;
      padding: 1px;
      font-weight: 600;
      width: 100%;
      text-align: center;
    }

    /* Font sizing berdasarkan layout */
    .single-section .order-number { font-size: 0.75rem; }
    .single-section .order-name { font-size: 0.95rem; }
    .single-section .time-remaining { font-size: 0.65rem; }
    .row-content:not(.single-section) .order-number { font-size: 0.85rem; }
    .row-content:not(.single-section) .order-name { font-size: 0.95rem; }
    .row-content:not(.single-section) .time-remaining { font-size: 0.75rem; }
    .three-sections .row-content .order-number { font-size: 0.9rem; }
    .three-sections .row-content .order-name { font-size: 0.75rem; }
    .three-sections .row-content .time-remaining { font-size: 0.8rem; }
    .four-sections .row-content .order-number { font-size: 1rem; }
    .four-sections .row-content .order-name { font-size: 0.8rem; }
    .four-sections .row-content .time-remaining { font-size: 0.85rem; }

    /* Color classes */
    .status-placed { background: #28a745; }
    .status-credit { background: #ffc107; color: #333; }
    .status-planning { background: #17a2b8; }
    .status-dispatched { background: #6f42c1; }
    .color-green { background: #28a745; color: white; }
    .color-yellow { background: #ffc107; color: #333; }
    .color-red { background: #dc3545; color: white; }

    .loading, .error-message {
      text-align: center;
      padding: 2rem;
      font-size: 1.125rem;
    }

    .error-message {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
    }

    /* Tablet responsive */
    @media (max-width: 1024px) and (min-width: 769px) {
      .header-content { padding: 0 0.75rem; }
      .search-input { min-width: 150px; font-size: 0.8rem; }
      .filter-dropdown, .dropdown-toggle { min-width: 120px; font-size: 0.8rem; }
      .row-content { grid-template-columns: repeat(6, minmax(120px, 1fr)) !important; grid-template-rows: repeat(3, 1fr) !important; gap: 3px; }
      .order-number { font-size: 0.8rem !important; }
      .order-name { font-size: 0.7rem !important; }
      .time-remaining { font-size: 0.65rem !important; }
      .order-counter { font-size: 0.7rem; padding: 1px 5px; margin-left: 6px; }
      .order-modal { width: 80%; max-width: 450px; }
      .modal-close-simple { top: 10px; right: 10px; width: 30px; height: 30px; font-size: 20px; }
      .modal-content { padding: 0; }
      .card-header-detail { padding: 1rem; }
      .header-left-detail { gap: 6px; }
      .order-number-detail { font-size: 1.2rem; }
      .color-indicator-detail { width: 10px; height: 10px; }
      .card-body-detail { padding: 1rem; }
      .info-row-detail { margin-bottom: 1rem; }
      .info-row-detail label { min-width: 100px; font-size: 1rem; }
      .info-row-detail span { font-size: 1rem; }
      .time-value-detail { font-size: 1rem; }
    }

    /* Mobile landscape responsive */
    @media (max-width: 768px) and (orientation: landscape) {
      .dashboard-header { padding: 0.15rem 0; }
      .header-content { flex-direction: row; gap: 0.5rem; padding: 0 0.5rem; }
      .header-left h1 { font-size: 1rem; }
      .live-indicator { font-size: 0.75rem; }
      .search-input { min-width: 120px; font-size: 0.75rem; padding: 0.25rem; }
      .filter-dropdown, .dropdown-toggle { min-width: 100px; font-size: 0.75rem; padding: 0.25rem; }
      .row-content { grid-template-columns: repeat(8, minmax(80px, 1fr)) !important; grid-template-rows: repeat(2, 1fr) !important; gap: 2px; padding: 2px; }
      .order-rectangle { min-height: 45px; }
      .order-number { font-size: 0.7rem !important; }
      .order-name { font-size: 0.6rem !important; }
      .time-remaining { font-size: 0.55rem !important; }
      .logout-btn { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
      .order-counter { font-size: 0.65rem; padding: 1px 4px; margin-left: 5px; }
      .order-modal { width: 90%; max-width: 400px; }
      .modal-close-simple { top: 8px; right: 8px; width: 28px; height: 28px; font-size: 18px; }
      .modal-content { padding: 0; }
      .card-header-detail { padding: 0.75rem; }
      .header-left-detail { gap: 6px; }
      .order-number-detail { font-size: 1rem; }
      .color-indicator-detail { width: 10px; height: 10px; }
      .card-body-detail { padding: 0.75rem; }
      .info-row-detail { flex-direction: row; align-items: center; gap: 8px; margin-bottom: 0.75rem; }
      .info-row-detail label { min-width: 80px; font-size: 0.9rem; }
      .info-row-detail span { font-size: 0.9rem; }
      .time-value-detail { font-size: 0.9rem; }
    }

    /* Mobile portrait responsive */
    @media (max-width: 768px) and (orientation: portrait) {
      .dashboard-header { padding: 0.25rem 0; }
      .header-content { flex-direction: column; gap: 0.5rem; align-items: center; padding: 0 0.5rem; }
      .header-left { text-align: center; width: 100%; }
      .header-left h1 { font-size: 1.1rem; margin-bottom: 0.25rem; }
      .live-indicator { font-size: 0.75rem; justify-content: center; }
      .header-right { flex-direction: column; gap: 0.5rem; width: 100%; align-items: center; }
      .search-input { min-width: 180px; font-size: 0.8rem; }
      .filter-dropdown, .dropdown-toggle { min-width: 150px; font-size: 0.8rem; }
      .dropdown-menu { width: 200px; left: 50%; transform: translateX(-50%); }
      .board { padding: 1px; gap: 1px; }
      .row-header { font-size: 0.9rem; padding: 3px 6px; height: 32px; }
      .order-counter { font-size: 0.65rem; padding: 1px 4px; margin-left: 6px; }
      .row-content { grid-template-columns: repeat(3, 1fr) !important; grid-template-rows: repeat(4, 1fr) !important; gap: 2px; padding: 2px; }
      .order-rectangle { min-height: 60px; padding: 3px; }
      .order-number { font-size: 0.75rem !important; font-weight: 700; }
      .order-name { font-size: 0.65rem !important; line-height: 1.1; }
      .time-remaining { font-size: 0.6rem !important; }
      .logout-btn { padding: 0.4rem 0.8rem; font-size: 0.8rem; width: 100px; }
      .single-section { grid-template-columns: repeat(2, 1fr) !important; grid-template-rows: repeat(6, 1fr) !important; }
      .single-section .order-rectangle { min-height: 70px; }
      .single-section .order-number { font-size: 0.8rem !important; }
      .single-section .order-name { font-size: 0.7rem !important; }
      .single-section .time-remaining { font-size: 0.65rem !important; }
      .order-modal { width: 95%; max-width: 350px; }
      .modal-close-simple { top: 8px; right: 8px; width: 28px; height: 28px; font-size: 18px; }
      .modal-content { padding: 0; }
      .card-header-detail { padding: 0.75rem; }
      .header-left-detail { gap: 6px; }
      .order-number-detail { font-size: 1rem; }
      .color-indicator-detail { width: 10px; height: 10px; }
      .card-body-detail { padding: 0.75rem; }
      .info-row-detail { flex-direction: column; align-items: flex-start; gap: 4px; margin-bottom: 0.75rem; }
      .info-row-detail label { min-width: auto; font-size: 0.9rem; }
      .info-row-detail span { text-align: left; font-size: 0.9rem; }
      .time-value-detail { font-size: 0.9rem; }
    }

    /* Mobile kecil responsive */
    @media (max-width: 480px) {
      .header-left h1 { font-size: 1rem; }
      .search-input { min-width: 150px; font-size: 0.75rem; }
      .row-content { grid-template-columns: repeat(2, 1fr) !important; grid-template-rows: repeat(6, 1fr) !important; }
      .order-rectangle { min-height: 70px; }
      .order-number { font-size: 0.7rem !important; }
      .order-name { font-size: 0.6rem !important; }
      .time-remaining { font-size: 0.55rem !important; }
      .single-section { grid-template-columns: repeat(1, 1fr) !important; grid-template-rows: repeat(12, 1fr) !important; }
      .order-modal { width: 95%; max-width: 320px; }
      .modal-close-simple { top: 6px; right: 6px; width: 26px; height: 26px; font-size: 16px; }
      .modal-content { padding: 0; }
      .card-header-detail { padding: 0.5rem; }
      .header-left-detail { gap: 4px; }
      .order-number-detail { font-size: 0.9rem; }
      .color-indicator-detail { width: 8px; height: 8px; }
      .card-body-detail { padding: 0.5rem; }
      .info-row-detail { flex-direction: column; align-items: flex-start; gap: 2px; margin-bottom: 0.5rem; }
      .info-row-detail label { min-width: auto; font-size: 0.8rem; }
      .info-row-detail span { text-align: left; font-size: 0.8rem; }
      .time-value-detail { font-size: 0.8rem; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly MAX_DISPLAY_ITEMS = 20; // Konstanta untuk jumlah maksimum item per section
  orders: ApiOrderItem[] = [];
  isLoading = true;
  error = '';
  currentUser: User | null = null;
  private countdownInterval: any;
  private refreshInterval: any;
  currentTime = new Date();
  selectedFilter = 'today'; // Default filter - show today's data
  
  // Search filter property
  searchFilter = '';
  
  // Section filter properties
  isDropdownOpen = false;
  sectionFilters = {
    'Order Placed': true,
    'Credit Review': true,
    'Delivery Planning': true,
    'Dispatched for Delivery': true
  };
  
  availableSections = [
    'Order Placed',
    'Credit Review', 
    'Delivery Planning',
    'Dispatched for Delivery'
  ];

  // Section information tooltips
  sectionInfos = {
    'Order Placed': 'Order has been created but has not been declared as Ready To Process',
    'Credit Review': 'Order has been declared as Ready To Process but needs Credit Release',
    'Delivery Planning': 'Order has been declared as Ready To Process and does not need Credit Release but has not been processed (Not yet Print Packing Slip)',
    'Dispatched for Delivery': 'Packing Slip has been printed'
  };

  // Tooltip visibility state
  activeTooltip: string | null = null;

  // Order detail modal state
  selectedOrder: ApiOrderItem | null = null;
  isOrderModalOpen = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeComponent();
  }

  ngOnDestroy() {
    this.cleanupTimers();
  }

  private initializeComponent() {
    this.currentUser = this.authService.getCurrentUser();
    this.fetchOrders();
    this.startTimers();
  }

  private cleanupTimers() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private startTimers() {
    // Clear existing timers before starting new ones
    this.cleanupTimers();
    
    // Start countdown timer - updates every second
    this.startLiveCountdown();
    
    // Start auto refresh timer - refreshes every 5 minutes
    this.startAutoRefresh();
  }

  private startLiveCountdown() {
    this.countdownInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  private startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 300000); // 5 minutes
  }

  private refreshData() {
    // Set loading state
    this.isLoading = true;
    
    // Refresh user data and fetch new orders
    this.currentUser = this.authService.getCurrentUser();
    this.fetchOrders();
    
    // Note: No need to restart timers as they continue running
  }

  fetchOrders() {
    const url = 'https://epicprodapp.samator.com/Kinetic/api/v2/efx/SGI/FSMT069OrderDash/GetOrders';
    const username = 'epicorWebAPI';
    const password = 'epicorWebAPI';
    const basicAuth = 'Basic ' + btoa(`${username}:${password}`);
    
    const headers = new HttpHeaders({
      'x-api-key': 'W5hczOaOGdc68PcfchvZSvhUmWOf9AX3P6Zhfm0cghdPu',
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Authorization': basicAuth
    });

    this.http.post<ApiResponse>(url, {}, { headers }).subscribe({
      next: (response) => {
        if (response?.Result?.Results) {
          this.orders = response.Result.Results;
          
          // Tambahkan dummy data untuk testing
          // const dummyOrder: ApiOrderItem = {
          //   OrderNum: 123456,
          //   CustomerID: "123456",
          //   Name: "Ini Dummy",
          //   CreateDate: "2025-09-09T02:20:00.000",
          //   OrderDate: "2025-09-03T00:00:00",
          //   NeedByDate: "2025-09-03T00:00:00",
          //   Status: "Credit Review"
          // };
          
          // const dummyOrder2: ApiOrderItem = {
          //   OrderNum: 567890,
          //   CustomerID: "567890",
          //   Name: "Ini Cuma Dummy",
          //   CreateDate: "2025-09-07T02:20:00.000",
          //   OrderDate: "2025-09-03T00:00:00",
          //   NeedByDate: "2025-09-03T00:00:00",
          //   Status: "Dispatched for Delivery"
          // };

          // const dummyOrder3: ApiOrderItem = {
          //   OrderNum: 999999,
          //   CustomerID: "567890",
          //   Name: "Ini Cuma Dummy YA",
          //   CreateDate: "2025-09-09T09:55:00.000",
          //   OrderDate: "2025-09-03T00:00:00",
          //   NeedByDate: "2025-09-03T00:00:00",
          //   Status: "Dispatched for Delivery"
          // };
          
          // this.orders.push(dummyOrder);
          // this.orders.push(dummyOrder2);
          // this.orders.push(dummyOrder3);
          this.error = '';
        } else {
          this.error = 'No data received from API';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.error = 'Failed to load orders. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getLatestOrdersByStatus(status: string, limit?: number): ApiOrderItem[] {
    // Tampilkan semua data asli dengan filter tanggal dan custom sorting
    const filteredOrders = this.orders
      .filter(order => order.Status === status && this.isWithinDateFilter(order) && this.isWithinSearchFilter(order));
    
    // Custom sorting berdasarkan color class
    const sortedOrders = filteredOrders.sort((a, b) => {
      const colorA = this.getColorClass(a);
      const colorB = this.getColorClass(b);
      const timeRemainingA = this.getTimeRemainingMs(a);
      const timeRemainingB = this.getTimeRemainingMs(b);
      
      // Group by color first
      if (colorA !== colorB) {
        const colorOrder: { [key: string]: number } = { 'color-red': 0, 'color-yellow': 1, 'color-green': 2 };
        return colorOrder[colorA] - colorOrder[colorB];
      }
      
      // Within same color, sort by time
      if (colorA === 'color-green' || colorA === 'color-yellow') {
        // Hijau & Kuning: time left paling sedikit ke paling banyak
        return timeRemainingA - timeRemainingB;
      } else if (colorA === 'color-red') {
        // Merah: overdue tertinggi ke terendah (most negative to least negative)
        return timeRemainingA - timeRemainingB;
      }
      
      return 0;
    });
    
    // Limit data berdasarkan jumlah section yang dipilih
    const visibleSections = this.getVisibleSections();
    let maxItems = 90; // default untuk 1 section (10x9)
    
    if (visibleSections.length === 1) {
      maxItems = 90; // 10 kolom x 9 baris
    } else if (visibleSections.length === 2) {
      maxItems = 40; // 10 kolom x 4 baris
    } else if (visibleSections.length === 3) {
      maxItems = 30; // 10 kolom x 3 baris
    } else if (visibleSections.length === 4) {
      maxItems = 20; // 10 kolom x 2 baris
    }
    
    return sortedOrders.slice(0, maxItems);
  }

  getTimeRemainingMs(order: ApiOrderItem): number {
    if (!order.CreateDate) return 0;
    
    const createDate = new Date(order.CreateDate);
    const deadline = new Date(createDate.getTime() + (48 * 60 * 60 * 1000)); // +48 jam
    return deadline.getTime() - this.currentTime.getTime();
  }

  getTimeRemaining(order: ApiOrderItem): string {
    if (!order.CreateDate) return 'No Date';
    
    // CreateDate + 48 jam
    const createDate = new Date(order.CreateDate);
    const deadline = new Date(createDate.getTime() + (48 * 60 * 60 * 1000)); // +48 jam
    const diffMs = deadline.getTime() - this.currentTime.getTime();
    
    const absDiffMs = Math.abs(diffMs);
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDiffMs % (1000 * 60)) / 1000);
    
    const daysStr = days.toString().padStart(2, '0');
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    
    if (diffMs <= 0) {
      // Format overdue: hanya timer tanpa kata OVERDUE
      return `${daysStr}:${hoursStr}:${minutesStr}:${secondsStr}`;
    } else {
      // Format normal: timer (sedang)
      return `${daysStr}:${hoursStr}:${minutesStr}:${secondsStr}`;
    }
  }

  getColorClass(order: ApiOrderItem): string {
    if (!order.CreateDate) return 'color-red';
    
    // CreateDate + 48 jam
    const createDate = new Date(order.CreateDate);
    const deadline = new Date(createDate.getTime() + (48 * 60 * 60 * 1000)); // +48 jam
    const diffMs = deadline.getTime() - this.currentTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours > 12) {
      return 'color-green'; // >12 jam - hijau
    } else if (diffHours > 0) {
      return 'color-yellow'; // >0 <=12 jam - kuning
    } else {
      return 'color-red'; // <=0 jam - merah
    }
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
  }

  isWithinDateFilter(order: ApiOrderItem): boolean {
    // Jika filter adalah "all", tampilkan semua data
    if (this.selectedFilter === 'all') {
      return true;
    }
    
    if (!order.CreateDate) return false;
    
    const createDate = new Date(order.CreateDate);
    const now = new Date();
    
    switch (this.selectedFilter) {
      case 'today':
        return createDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        return createDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return createDate >= monthAgo;
      case '3months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return createDate >= threeMonthsAgo;
      case '6months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        return createDate >= sixMonthsAgo;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return createDate >= yearAgo;
      default:
        return true;
    }
  }

  isWithinSearchFilter(order: ApiOrderItem): boolean {
    // Jika tidak ada filter search, tampilkan semua
    if (!this.searchFilter || this.searchFilter.trim() === '') {
      return true;
    }
    
    const searchTerm = this.searchFilter.toLowerCase().trim();
    
    // Search berdasarkan Order Number
    const orderNumStr = order.OrderNum.toString();
    if (orderNumStr.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // Search berdasarkan Customer ID
    if (order.CustomerID && order.CustomerID.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // Search berdasarkan Name (Customer Name)
    if (order.Name && order.Name.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // Search berdasarkan PO Number
    if (order.PONum && order.PONum.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    return false;
  }

  // Section filter methods
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleSectionFilter(section: string) {
    this.sectionFilters[section as keyof typeof this.sectionFilters] = 
      !this.sectionFilters[section as keyof typeof this.sectionFilters];
  }

  getSectionChecked(section: string): boolean {
    return this.sectionFilters[section as keyof typeof this.sectionFilters];
  }

  // Select All / Unselect All functionality
  isAllSelected(): boolean {
    return Object.values(this.sectionFilters).every(value => value);
  }

  toggleSelectAll() {
    const allSelected = this.isAllSelected();
    
    // Jika semua sudah selected, unselect all
    // Jika tidak semua selected, select all
    Object.keys(this.sectionFilters).forEach(key => {
      this.sectionFilters[key as keyof typeof this.sectionFilters] = !allSelected;
    });
  }

  getSelectAllText(): string {
    return this.isAllSelected() ? 'Unselect All' : 'Select All';
  }

  getVisibleSections(): string[] {
    return this.availableSections.filter(section => 
      this.sectionFilters[section as keyof typeof this.sectionFilters]
    );
  }

  getSectionHeight(): string {
    const visibleSections = this.getVisibleSections();
    if (visibleSections.length === 0) return '0%';
    return `${100 / visibleSections.length}%`;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  // Tooltip methods
  showTooltip(section: string, event: Event) {
    event.stopPropagation(); // Prevent triggering the section click
    event.preventDefault(); // Prevent any default behavior
    this.activeTooltip = this.activeTooltip === section ? null : section;
  }

  hideTooltip() {
    this.activeTooltip = null;
  }

  getSectionInfo(section: string): string {
    return this.sectionInfos[section as keyof typeof this.sectionInfos] || '';
  }

  getTotalOrdersByStatus(status: string): number {
    return this.orders.filter(order => 
      order.Status === status && 
      this.isWithinDateFilter(order) && 
      this.isWithinSearchFilter(order)
    ).length;
  }

  getDisplayedOrdersByStatus(status: string): number {
    return this.getLatestOrdersByStatus(status).length;
  }

  getOrderCountText(status: string): string {
    const displayed = this.getDisplayedOrdersByStatus(status);
    const total = this.getTotalOrdersByStatus(status);
    return `${displayed}/${total}`;
  }

  // Order modal methods
  openOrderModal(order: ApiOrderItem, event: Event) {
    event.stopPropagation();
    this.selectedOrder = order;
    this.isOrderModalOpen = true;
  }

  closeOrderModal() {
    this.selectedOrder = null;
    this.isOrderModalOpen = false;
  }

  getTimeRemainingForModal(order: ApiOrderItem): string {
    if (!order.CreateDate) return 'No Date';
    
    const createDate = new Date(order.CreateDate);
    const deadline = new Date(createDate.getTime() + (48 * 60 * 60 * 1000));
    const diffMs = deadline.getTime() - this.currentTime.getTime();
    
    const absDiffMs = Math.abs(diffMs);
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDiffMs % (1000 * 60)) / 1000);
    
    const daysStr = days.toString().padStart(2, '0');
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    
    if (diffMs <= 0) {
      return `OVERDUE ${daysStr}:${hoursStr}:${minutesStr}:${secondsStr}`;
    } else {
      return `${daysStr}:${hoursStr}:${minutesStr}:${secondsStr}`;
    }
  }

  openStatusDetail(status: string) {
    // Buka halaman baru dengan query parameter untuk status
    const url = `/queuedashboard/dashboard/detail?status=${encodeURIComponent(status)}&filter=${this.selectedFilter}`;
    window.open(url, '_blank');
  }

  logout() {
    // Clean up timers before logout
    this.cleanupTimers();
    
    // Perform actual logout
    this.authService.logout();
    
    // Redirect to login page
    window.location.href = '/queuedashboard/login';
  }
}
