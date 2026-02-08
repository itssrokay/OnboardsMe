import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { EnrollmentService } from '../../../core/services/enrollment.service';

interface FieldConfig {
  key: string;
  label: string;
  type: string;
  placeholder: string;
  options?: { value: string; label: string }[];
  validations: Array<{
    type: string;
    message: string;
    value?: number;
  }>;
}

interface FormConfig {
  fields: FieldConfig[];
}

@Component({
  selector: 'app-enrollment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './enrollment-form.component.html',
  styleUrl: './enrollment-form.component.scss'
})
export class EnrollmentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private enrollmentService = inject(EnrollmentService);

  formConfig = signal<FormConfig | null>(null);
  enrollmentForm!: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadFormConfig();
  }

  loadFormConfig(): void {
    this.error.set(null);
    this.formConfig.set(null);
    this.http.get<FormConfig>('/assets/config/enrollment-form.config.json').subscribe({
      next: (config) => {
        this.formConfig.set(config);
        this.initializeForm();
        this.error.set(null);
      },
      error: (err) => {
        console.error('Failed to load form config:', err);
        const errorMsg = err.error?.message || err.message || 'Unknown error';
        this.error.set(`Failed to load form configuration: ${errorMsg}. Please check the browser console and ensure the dev server is running.`);
      }
    });
  }

  private initializeForm(): void {
    const config = this.formConfig();
    if (!config) return;

    const formControls: Record<string, any> = {};

    config.fields.forEach(field => {
      const validators = this.buildValidators(field);
      formControls[field.key] = ['', validators];
    });

    this.enrollmentForm = this.fb.group(formControls);
  }

  private buildValidators(field: FieldConfig): any[] {
    const validators: any[] = [];

    field.validations.forEach(validation => {
      switch (validation.type) {
        case 'required':
          validators.push(Validators.required);
          break;
        case 'email':
          validators.push(Validators.email);
          break;
        case 'minLength':
          if (validation.value !== undefined) {
            validators.push(Validators.minLength(validation.value));
          }
          break;
        case 'min':
          if (validation.value !== undefined) {
            validators.push(Validators.min(validation.value));
          }
          break;
        case 'max':
          if (validation.value !== undefined) {
            validators.push(Validators.max(validation.value));
          }
          break;
      }
    });

    return validators;
  }

  getFieldError(fieldKey: string): string | null {
    const field = this.enrollmentForm.get(fieldKey);
    if (!field || !field.errors || !field.touched) return null;

    const config = this.formConfig();
    if (!config) return null;

    const fieldConfig = config.fields.find(f => f.key === fieldKey);
    if (!fieldConfig) return null;

    for (const errorKey in field.errors) {
      const validation = fieldConfig.validations.find(v => {
        if (errorKey === 'required') return v.type === 'required';
        if (errorKey === 'email') return v.type === 'email';
        if (errorKey === 'minlength') return v.type === 'minLength';
        if (errorKey === 'min') return v.type === 'min';
        if (errorKey === 'max') return v.type === 'max';
        return false;
      });
      if (validation) return validation.message;
    }

    return null;
  }

  onSubmit(): void {
    if (this.enrollmentForm.valid) {
      this.loading.set(true);
      const formValue = this.enrollmentForm.value;
      
      this.enrollmentService.enroll({
        name: formValue.name,
        age: Number(formValue.age),
        email: formValue.email,
        role: formValue.role,
        yearsOfExperience: Number(formValue.yearsOfExperience)
      });

      this.router.navigate(['/enroll/select-courses']);
    } else {
      this.enrollmentForm.markAllAsTouched();
    }
  }

  getFieldConfig(key: string): FieldConfig | undefined {
    return this.formConfig()?.fields.find(f => f.key === key);
  }
}
