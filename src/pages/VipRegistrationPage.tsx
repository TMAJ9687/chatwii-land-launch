
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useHookForm } from '@/hooks/useHookForm';
import { registerSchema } from '@/utils/validationSchemas';
import { Form } from '@/components/ui/form';
import { FormField } from '@/components/form/FormField';
import { Alert, AlertDescription } from '@/components/ui/alert';

const VipRegistrationPage = () => {
  const navigate = useNavigate();
  
  const {
    form,
    handleSubmit,
    isSubmitting,
    submitError
  } = useHookForm(
    registerSchema,
    {
      nickname: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    async (data) => {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nickname: data.nickname
          }
        }
      });
      
      if (error) throw error;
      
      toast.success("Registration successful!", {
        description: "Please set up your profile to continue."
      });
      
      navigate('/vip/profile-setup');
    }
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link to="/" className="text-gray-600 dark:text-gray-300 flex items-center hover:underline">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Register as <span className="text-chatwii-peach">VIP</span>
          </h1>
          
          {submitError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                form={form}
                name="nickname"
                label="Nickname"
                placeholder="Enter your nickname"
              />
              
              <FormField
                form={form}
                name="email"
                label="Email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
              />
              
              <FormField
                form={form}
                name="password"
                label="Password"
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
              />
              
              <FormField
                form={form}
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              
              <Button 
                type="submit" 
                className="w-full bg-chatwii-peach hover:bg-chatwii-orange"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Register"}
              </Button>
              
              <p className="text-sm text-center mt-4">
                Already have an account?{" "}
                <Link to="/vip/login" className="text-chatwii-orange hover:underline">
                  Login
                </Link>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default VipRegistrationPage;
