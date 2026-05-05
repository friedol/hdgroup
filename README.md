# 🛡️ HD Group ERP - Enterprise Management System

[![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-2.0-9553E9?style=for-the-badge&logo=inertia)](https://inertiajs.com)

**HD Group ERP** is a comprehensive, state-of-the-art Enterprise Resource Planning system designed for modern businesses. It provides a unified platform for managing inventory, production, sales, logistics, finance, and customer intelligence with built-in multi-tenancy and advanced analytics.

---

## 🚀 Key Modules & Features

### 📦 Inventory & Warehouse Management
*   **Multi-Store Support**: Manage stock across multiple locations and branches.
*   **Smart Reordering**: AI-driven reorder suggestions and material depletion predictions.
*   **Stock Adjustments**: Formal approval workflow for inventory corrections.
*   **Transfer System**: Secure movement of goods between branches/stores.
*   **Unit Conversion**: Manage products in multiple units (kg, pcs, rolls, etc.).

### 🏭 Manufacturing & Production
*   **Bill of Materials (BOM)**: Comprehensive recipes for finished goods.
*   **Roll-Based Production**: Specialized engine for calculating waste, yield, and efficiency for roll-based manufacturing.
*   **Efficiency Analytics**: Real-time monitoring of production metrics and labor costs.
*   **Material Tracking**: Historical usage tracking for raw materials.

### 💰 POS & Finance
*   **Enterprise POS**: Fast, responsive terminal with offline-first capabilities.
*   **Loan Management**: Track customer credit, payments, and outstanding balances.
*   **Expense Tracking**: Comprehensive ledger for business expenses with voucher generation.
*   **Financial Reporting**: Balance sheets, profit/loss statements, and cash flow ledgers.
*   **Payroll**: Integrated HR module for staff payouts and salary management.

### 🚚 Logistics & Supply Chain
*   **Container Tracking**: Manage incoming shipments and container logistics.
*   **Delivery Management**: Driver assignment, real-time tracking, and delivery status updates.
*   **Gatekeeper Module**: Digital logging of vehicle entry and exit.
*   **Supplier Portal**: Centralized management of vendors and procurement.

### 🧠 Intelligence & CRM
*   **Business Intelligence**: Advanced dashboards for sales forecasting and branch ranking.
*   **Customer 360**: Segmented customer data, lifetime value (CLV) analysis, and retention risk detection.
*   **Predictive Follow-ups**: Automated reminders for customer engagement based on buying patterns.
*   **Marketing Engine**: Per-branch hero slides, popup ads, and promo code management.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | PHP 8.3+, Laravel 13, Fortify, Tinker |
| **Frontend** | React 19, Inertia.js 2.0, Tailwind CSS 4.0 |
| **UI Components** | Radix UI, Lucide Icons, Recharts, Embla Carousel |
| **Database** | MySQL / PostgreSQL |
| **Services** | Redis (Caching), SMS Gateway Integration |
| **Tooling** | Vite, ESLint, Prettier, Pest (Testing) |

---

## 🏗️ Architecture

The project follows a modern **Modular Service-Oriented Architecture**:

-   **Service Layer**: Heavy business logic (Inventory, Production, Analytics) is encapsulated in dedicated Service classes located in `app/Services`.
-   **Multi-Tenancy**: Built-in branch scoping using the `HasBranch` trait, ensuring data isolation across different business locations.
-   **RBAC**: Granular Role-Based Access Control with 20+ permission categories.
-   **Frontend Architecture**: Single Page Application (SPA) experience powered by Inertia.js with React components.

> [!NOTE]
> For a deep dive into the system design, please refer to the [ARCHITECTURE.md](file:///Users/gotlaptopparts.com/Desktop/LaravelProject/Hd-Group/ARCHITECTURE.md).

---

## 📥 Installation

### Prerequisites
- PHP 8.3+
- Node.js 20+
- Composer
- MySQL/PostgreSQL

### Setup Steps
1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd Hd-Group
    ```

2.  **Install PHP dependencies**:
    ```bash
    composer install
    ```

3.  **Install JavaScript dependencies**:
    ```bash
    npm install
    ```

4.  **Environment Configuration**:
    ```bash
    cp .env.example .env
    # Update your database and other credentials in .env
    php artisan key:generate
    ```

5.  **Database Migration & Seeding**:
    ```bash
    php artisan migrate --seed
    ```

6.  **Build Assets**:
    ```bash
    npm run build
    ```

7.  **Start Development Server**:
    ```bash
    composer dev
    # This runs artisan serve, vite, and queue listeners concurrently
    ```

---

## 📜 Documentation & References

-   **Architectural Overview**: [ARCHITECTURE.md](file:///Users/gotlaptopparts.com/Desktop/LaravelProject/Hd-Group/ARCHITECTURE.md)
-   **System Routes**: See `routes/web.php` for a full list of endpoints.
-   **API Documentation**: (In Progress)

---

## ⚖️ License

This project is proprietary and confidential. Unauthorized copying, modification, or distribution is strictly prohibited.

&copy; 2026 HD Group. All rights reserved.
