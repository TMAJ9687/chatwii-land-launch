
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

const profanityList = ['fuck', 'shit', 'ass', 'bitch', 'dick', 'penis', 'vagina', 'sex'];

const VipRegistrationPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [errors, setErrors] = useState({
    nickname: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateNickname = (value: string): string => {
    if (!value) return "Nickname is required";
    if (value.length > 16) return "Nickname must be max 16 characters";
    
    const numberCount = (value.match(/\d/g) || []).length;
    if (numberCount > 2) return "Nickname can contain maximum 2 numbers";
    
    if (/(.)\1\1\1/.test(value)) return "Nickname cannot contain more than 3 consecutive same letters";
    
    if (!/^[a-zA-Z0-9\s]*$/.test(value)) return "Nickname can only contain letters, numbers, and spaces";
    
    const lowerCaseValue = value.toLowerCase();
    for (const word of profanityList) {
      if (lowerCaseValue.includes(word)) return "Nickname contains inappropriate language";
    }
    
    return "";
  };

  const validateEmail = (value: string): string => {
    if (!value) return "Email is required";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    
    return "";
  };

  const validatePassword = (value: string): string => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const validateConfirmPassword = (value: string, password: string): string => {
    if (!value) return "Please confirm your password";
    if (value !== password) return "Passwords don't match";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    let errorMsg = "";
    switch (name) {
      case "nickname":
        errorMsg = validateNickname(value);
        break;
      case "email":
        errorMsg = validateEmail(value);
        break;
      case "password":
        errorMsg = validatePassword(value);
        if (formData.confirmPassword) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: validateConfirmPassword(formData.confirmPassword, value)
          }));
        }
        break;
      case "confirmPassword":
        errorMsg = validateConfirmPassword(value, formData.password);
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const isFormValid = () => {
    return (
      formData.nickname &&
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      !errors.nickname &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        toast({
          title: "Registration successful!",
          description: "Please set up your profile to continue."
        });
        
        navigate('/vip/profile-setup');
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="Enter your nickname"
                className={errors.nickname ? "border-red-500" : ""}
              />
              {errors.nickname && <p className="text-sm text-red-500">{errors.nickname}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-chatwii-peach hover:bg-chatwii-orange"
              disabled={!isFormValid() || isSubmitting}
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
        </div>
      </div>
    </div>
  );
};

export default VipRegistrationPage;
