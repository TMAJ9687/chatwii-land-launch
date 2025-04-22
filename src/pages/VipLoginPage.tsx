
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

const VipLoginPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  
  const [errors, setErrors] = useState({
    email: "",
    password: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (value: string): string => {
    if (!value) return "Email is required";
    return "";
  };

  const validatePassword = (value: string): string => {
    if (!value) return "Password is required";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate as user types
    let errorMsg = "";
    switch (name) {
      case "email":
        errorMsg = validateEmail(value);
        break;
      case "password":
        errorMsg = validatePassword(value);
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const isFormValid = () => {
    // Check if all fields have values and no errors
    return (
      formData.email &&
      formData.password &&
      !errors.email &&
      !errors.password
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) throw error;
      
      // Successful login
      toast({
        title: "Login successful!",
        description: "Welcome back to ChatWii VIP.",
      });
      
      // Navigate to chat interface
      navigate('/chat');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
      console.error("Login error:", error);
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
            Login as <span className="text-chatwii-peach">VIP</span>
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Enter your password"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-chatwii-peach hover:bg-chatwii-orange"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
            
            <p className="text-sm text-center mt-4">
              Don't have an account?{" "}
              <Link to="/vip/register" className="text-chatwii-orange hover:underline">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VipLoginPage;
