# PGx Patient Management System

## Overview

A desktop application for managing Pharmacogenomics (PGx) patient records and test requests in Thai healthcare facilities. Built with Electron, Supabase, and vanilla JavaScript following MVC architecture.

## Key Features

- **Patient Management**: Add, edit, search, and track patient records
- **Test Request Workflow**: Complete lifecycle management from request to report generation
- **Multi-Role Support**: Separate interfaces for Pharmacists, Medical Technologists, and Administrators
- **Pharmacogenomic Analysis**: Support for 6 genes (CYP2D6, CYP2C9, CYP2C19, VKORC1, CYP3A5, TPMT)
- **PDF Report Generation**: Automated reports with Thai therapeutic recommendations
- **Audit Logging**: Complete tracking of all system actions
- **TAT Monitoring**: Real-time turnaround time tracking with visual indicators
- **Bilingual UI**: Support for Thai and English languages
- **Dark Mode**: Theme toggle for user preference

## Supported Pharmacogenomic Genes

| Gene | Alleles Tested | Rules | Description |
|------|---------------|-------|-------------|
| CYP2D6 | *4, *10, *41, CNV intron 2, CNV exon 9 | 33 | Copy Number Variation analysis |
| CYP2C9 | *2, *3 | 6 | Drug metabolism |
| CYP2C19 | *2, *3, *17 | 10 | Drug metabolism |
| VKORC1 | 1173C>T, -1639G>A | 3 | Warfarin sensitivity |
| CYP3A5 | *3 | 3 | Drug metabolism |
| TPMT | *3C | 3 | Thiopurine sensitivity |

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Electron (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: bcrypt password hashing
- **PDF Generation**: PDFKit with Thai font support
- **IPC**: Electron IPC for secure communication

## Architecture

The application follows the MVC (Model-View-Controller) pattern:

- **Models** (`src/models/`): Database operations and data access layer
- **Controllers** (`src/controllers/`): Business logic orchestration
- **Views** (`view/`): HTML pages with isolated JavaScript modules
- **Preload Bridge** (`preload.js`): Secure IPC communication bridge
- **Main Process** (`main.js`): Electron lifecycle and IPC handlers

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

### Setup Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd PGX-project-new
```

2. Install dependencies:
```bash
npm install
```

   **Core Dependencies:**
   - `electron` (v38.3.0) - Desktop application framework
   - `@supabase/supabase-js` (v2.75.0) - Supabase client for database operations
   - `bcrypt` (v6.0.0) - Password hashing library
   - `bcryptjs` (v3.0.2) - JavaScript implementation of bcrypt
   - `dotenv` (v17.2.3) - Environment variable management
   - `pdfkit` (v0.17.2) - PDF generation library
   - `pdf-lib` (v1.17.1) - PDF manipulation utilities
   - `xlsx` (v0.18.5) - Excel file processing for rulebase imports
   - `electron-store` (v11.0.2) - Persistent storage for Electron

   **Development Dependencies:**
   - `jest` (v29.7.0) - Testing framework

3. Create `.env` file in the root directory:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Initialize the database:
   - Run SQL scripts in `rulebase/` folder to create tables
   - Use `scripts/initializeSpecimens.js` to set up specimen types

5. Start the application:
```bash
npm start
```

## Database Schema

### Core Tables

- **patient**: Patient demographic information
- **system_users**: User accounts with role-based access
- **test_request**: Test requests with status tracking
- **report**: Generated PGx reports
- **Specimen**: Specimen types with SLA configuration
- **audit_log**: System action logging

### User Roles

- **pharmacist**: Manage test requests, fill alleles, generate reports
- **medtech**: Create test requests, input patient data
- **admin**: User management, system configuration, audit logs

## Management Scripts

### View Current Data
```bash
node scripts/showRulebaseInfo.js
```

### Backup Rulebase
```bash
node scripts/backupSupabaseToJson.js
```

### Import Rulebase
```bash
node scripts/importJsonToSupabase.js
```

### Test Predictions
```bash
node scripts/testRulebase.js
```

### Test PDF Generation
```bash
node scripts/testPdfGeneration.js
node scripts/testPdfGeneration.js --all
```

### Initialize Specimens
```bash
node scripts/initializeSpecimens.js
```

## User Workflows

### Medical Technologist Workflow
1. Login with medtech credentials
2. Navigate to Patient Management
3. Add or search for patient
4. Create test request with specimen and DNA type
5. View status in Case Management dashboard

### Pharmacist Workflow
1. Login with pharmacist credentials
2. View pending test requests
3. Click "Fill Alleles" to input genotype data
4. System predicts phenotype and recommendations
5. Confirm or modify recommendations
6. Generate PDF report
7. Second pharmacist reviews and confirms

### Administrator Workflow
1. Login with admin credentials
2. Manage user accounts
3. Configure specimen types and SLA
4. View audit logs
5. Monitor system statistics

## Features Detail

### Search Functionality
- Search patients by ID or name (partial matching)
- Case-insensitive search
- Real-time filtering

### TAT Monitoring
- Normal: Less than 80% of SLA time
- Warning: 80-100% of SLA time
- Overdue: Greater than 100% of SLA time
- Clickable stat cards to filter by TAT status

### Session Management
- Client-side session storage
- Automatic logout on session expiry
- Per-page authentication checks

### PDF Reports
- Thai language support with Sarabun font
- Patient information
- Genotype and phenotype results
- Therapeutic recommendations
- Pharmacist signatures
- Auto-save to reports directory

## Security

- Context isolation enabled
- Node integration disabled
- Password hashing with bcrypt (10 salt rounds)
- Service role key for database operations
- Secure IPC communication via preload bridge

## Development

### Code Style
- CommonJS modules (require/exports)
- Emoji prefixes for logs (success, error, config)
- Thai comments in original code accepted
- Error handling on all database operations

### Adding New Features

1. Create Model (if needed) in `src/models/`
2. Create Controller function in `src/controllers/`
3. Register IPC handler in `main.js`
4. Expose in `preload.js`
5. Call from renderer via `window.electronAPI`

## Documentation

- **[MVC Architecture](docs/MVC_ARCHITECTURE.md)** - Architecture details
- **[System Status](docs/SYSTEM_STATUS.md)** - Current configuration
- **[Rulebase Management](docs/RULEBASE_MANAGEMENT.md)** - Data management
- **[Quick Start](docs/QUICK_START.md)** - Getting started guide
- **[Test Request Manager](docs/TEST_REQUEST_MANAGER.md)** - Workflow details
- **[User Profile](docs/USER_PROFILE.md)** - Profile management

## Troubleshooting

### Application won't start
- Check `.env` file exists with valid Supabase credentials
- Verify Node.js version is 16 or higher
- Check console for error messages

### Search not working
- Ensure database connection is active
- Check browser console for errors
- Verify search term format

### PDF generation fails
- Check `reports/` directory exists
- Verify Thai font file exists in `fonts/`
- Check patient and test request data is complete

## License

Proprietary - All rights reserved

## Contact

For support or questions, contact the development team.

## Project Status

Active development - Features and improvements are regularly added based on user feedback and healthcare requirements.
