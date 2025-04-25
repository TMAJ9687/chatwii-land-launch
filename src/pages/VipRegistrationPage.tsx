
import React, { useState } from 'react';
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
import { VipNicknameInput } from "@/components/vip/VipNicknameInput";

const VipRegistrationPage = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  
  const {
    form,
    handleSubmit,
    isSubmitting,
    submitError
  } = useHookForm(
    registerSchema,
    {
      email: '',
      password: '',
      confirmPassword: ''
    },
    async (data) => {
      if (!isNicknameValid) {
        toast.error("Please provide a valid nickname");
        return;
      }

      // Check nickname availability on server-side
      const { data: isAvailable, error: checkError } = await supabase.rpc('is_nickname_available', { 
        check_nickname: nickname 
      });

      if (checkError) throw checkError;

      if (!isAvailable) {
        throw new Error("This nickname is already taken. Please choose another one.");
      }

      // Sign up user
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nickname: nickname
          }
        }
      });
      
      if (error) throw error;
      
      // Save details and navigate to payment
      localStorage.setItem('vip_registration_email', data.email);
      localStorage.setItem('vip_registration_nickname', nickname);
      
      toast.success("Registration successful!", {
        description: "Please complete payment to continue."
      });
      
      navigate('/vip-plans');
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
              <VipNicknameInput 
                value={nickname} 
                onChange={setNickname} 
                onValidityChange={setIsNicknameValid}
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
                disabled={isSubmitting || !isNicknameValid}
              >
                {isSubmitting ? "Registering..." : "Continue to Payment Plans"}
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
