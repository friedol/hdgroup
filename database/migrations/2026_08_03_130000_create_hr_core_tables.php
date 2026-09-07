<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Employee Contracts
        Schema::create('employee_contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('contract_title');
            $table->string('contract_type')->default('Permanent'); // Permanent, Fixed-Term, Probation, Internship, Casual
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('basic_salary', 15, 2)->default(0);
            $table->string('status')->default('active'); // active, expired, terminated, renewed
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 2. Employee Documents
        Schema::create('employee_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('document_type'); // National ID, Passport, CV, Academic Certificate, Contract, Driving License
            $table->string('document_name');
            $table->string('file_path');
            $table->date('expiry_date')->nullable();
            $table->string('status')->default('valid'); // valid, expired, pending_review
            $table->timestamps();
        });

        // 3. Employee Qualifications & Education
        Schema::create('employee_qualifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('institution_name');
            $table->string('qualification_title'); // Degree, Diploma, Master, Certificate
            $table->string('field_of_study')->nullable();
            $table->string('year_completed')->nullable();
            $table->timestamps();
        });

        // 4. Attendances & Shift Schedules
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('date');
            $table->time('clock_in')->nullable();
            $table->time('clock_out')->nullable();
            $table->string('clock_in_location')->nullable();
            $table->string('clock_out_location')->nullable();
            $table->decimal('work_hours', 5, 2)->default(0);
            $table->decimal('overtime_hours', 5, 2)->default(0);
            $table->string('status')->default('present'); // present, late, absent, half_day, leave
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('shift_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('shift_name'); // Day Shift, Night Shift, Morning Shift
            $table->time('start_time');
            $table->time('end_time');
            $table->date('schedule_date');
            $table->timestamps();
        });

        // 5. Leave Types & Applications
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Annual Leave, Sick Leave, Maternity Leave, Paternity Leave, Compassionate
            $table->integer('days_per_year')->default(28);
            $table->boolean('is_paid')->default(true);
            $table->boolean('allow_carry_forward')->default(false);
            $table->timestamps();
        });

        Schema::create('leave_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('leave_type_id')->constrained('leave_types')->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('total_days');
            $table->text('reason')->nullable();
            $table->string('status')->default('pending'); // pending, approved, rejected, cancelled
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('admin_remarks')->nullable();
            $table->timestamps();
        });

        // 6. Recruitment & ATS (Job Positions & Candidates)
        Schema::create('job_positions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('job_type')->default('Full-Time'); // Full-Time, Part-Time, Contract
            $table->integer('vacancies')->default(1);
            $table->decimal('min_salary', 15, 2)->nullable();
            $table->decimal('max_salary', 15, 2)->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('open'); // open, closed, draft
            $table->timestamps();
        });

        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_position_id')->constrained('job_positions')->onDelete('cascade');
            $table->string('full_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('resume_path')->nullable();
            $table->string('stage')->default('Applied'); // Applied, Screening, Interview, Offered, Hired, Rejected
            $table->decimal('score', 4, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 7. Payroll Periods & Payslips
        Schema::create('payroll_periods', function (Blueprint $table) {
            $table->id();
            $table->string('period_name'); // e.g. "August 2026"
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status')->default('draft'); // draft, processing, approved, locked
            $table->decimal('total_gross', 15, 2)->default(0);
            $table->decimal('total_net', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_period_id')->constrained('payroll_periods')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->decimal('basic_salary', 15, 2)->default(0);
            $table->decimal('allowances', 15, 2)->default(0);
            $table->decimal('overtime_pay', 15, 2)->default(0);
            $table->decimal('gross_salary', 15, 2)->default(0);
            $table->decimal('paye_tax', 15, 2)->default(0);
            $table->decimal('nssf_deduction', 15, 2)->default(0);
            $table->decimal('loan_deduction', 15, 2)->default(0);
            $table->decimal('other_deductions', 15, 2)->default(0);
            $table->decimal('net_salary', 15, 2)->default(0);
            $table->string('status')->default('generated'); // generated, paid
            $table->timestamps();
        });

        // 8. Company Assets & Exit Clearances
        Schema::create('company_assets', function (Blueprint $table) {
            $table->id();
            $table->string('asset_name');
            $table->string('asset_code')->unique();
            $table->string('category')->default('IT Equipment'); // IT Equipment, Vehicle, Phone, Furniture
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->date('assigned_date')->nullable();
            $table->string('condition')->default('Good'); // Good, Fair, Damaged
            $table->string('status')->default('available'); // available, assigned, maintenance, retired
            $table->timestamps();
        });

        Schema::create('exit_clearances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('resignation_date');
            $table->date('last_working_day');
            $table->string('reason')->nullable();
            $table->string('status')->default('pending'); // pending, in_progress, cleared, rejected
            $table->boolean('assets_returned')->default(false);
            $table->boolean('payroll_cleared')->default(false);
            $table->text('exit_interview_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exit_clearances');
        Schema::dropIfExists('company_assets');
        Schema::dropIfExists('payslips');
        Schema::dropIfExists('payroll_periods');
        Schema::dropIfExists('candidates');
        Schema::dropIfExists('job_positions');
        Schema::dropIfExists('leave_applications');
        Schema::dropIfExists('leave_types');
        Schema::dropIfExists('shift_schedules');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('employee_qualifications');
        Schema::dropIfExists('employee_documents');
        Schema::dropIfExists('employee_contracts');
    }
};
