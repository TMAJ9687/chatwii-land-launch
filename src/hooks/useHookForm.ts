
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Generic type for form schema
export function useHookForm<T extends z.ZodType<any, any>>(
  schema: T,
  defaultValues: z.infer<T>,
  onSubmit: (data: z.infer<T>) => Promise<void>
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: z.infer<T>) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (error: any) {
      console.error('Form submission error:', error);
      setSubmitError(error?.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    submitError,
    handleSubmit: form.handleSubmit(handleSubmit),
    reset: form.reset,
  };
}
