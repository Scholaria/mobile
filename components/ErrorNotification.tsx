import React from 'react';
import { Alert } from 'react-native';

interface ClerkError {
  code?: string;
  message?: string;
  longMessage?: string;
}

interface ErrorNotificationProps {
  error: any;
  title?: string;
}

export const showErrorNotification = (error: any, title: string = "Error") => {
  let message = "An unexpected error occurred. Please try again.";
  
  // Handle Clerk errors
  if (error?.clerkError && error?.errors?.length > 0) {
    const clerkError: ClerkError = error.errors[0];
    
    switch (clerkError.code) {
      case 'form_identifier_not_found':
        message = "We couldn't find an account with that email address. Please check your email or create a new account.";
        break;
      case 'form_password_incorrect':
        message = "The password you entered is incorrect. Please try again.";
        break;
      case 'form_identifier_exists':
        message = "An account with this email already exists. Please sign in instead.";
        break;
      case 'form_code_incorrect':
        message = "The verification code you entered is incorrect. Please check your email and try again.";
        break;
      case 'form_param_format_invalid':
        message = "Please check your input and try again.";
        break;
      case 'form_param_nil':
        message = "Please fill in all required fields.";
        break;
      case 'form_password_pwned':
        message = "This password has been compromised. Please choose a different password.";
        break;
      case 'form_password_too_short':
        message = "Password is too short. Please use at least 8 characters.";
        break;
      case 'form_password_too_long':
        message = "Password is too long. Please use fewer than 128 characters.";
        break;
      case 'form_password_no_uppercase':
        message = "Password must contain at least one uppercase letter.";
        break;
      case 'form_password_no_lowercase':
        message = "Password must contain at least one lowercase letter.";
        break;
      case 'form_password_no_numbers':
        message = "Password must contain at least one number.";
        break;
      case 'form_password_no_symbols':
        message = "Password must contain at least one special character.";
        break;
      case 'form_identifier_already_exists':
        message = "An account with this email already exists. Please sign in instead.";
        break;
      case 'form_identifier_already_verified':
        message = "This email has already been verified.";
        break;
      case 'form_identifier_not_verified':
        message = "Please verify your email address before signing in.";
        break;
      case 'form_identifier_required':
        message = "Please enter your email address.";
        break;
      case 'form_password_required':
        message = "Please enter your password.";
        break;
      case 'form_code_required':
        message = "Please enter the verification code.";
        break;
      case 'form_code_expired':
        message = "The verification code has expired. Please request a new one.";
        break;
      case 'form_code_invalid':
        message = "The verification code is invalid. Please check your email and try again.";
        break;
      case 'form_code_already_used':
        message = "This verification code has already been used. Please request a new one.";
        break;
      case 'form_code_not_found':
        message = "No verification code found. Please request a new one.";
        break;
      case 'form_code_too_many_attempts':
        message = "Too many attempts. Please wait a moment before trying again.";
        break;
      case 'form_code_too_many_requests':
        message = "Too many requests. Please wait a moment before trying again.";
        break;
      case 'form_code_rate_limit_exceeded':
        message = "Rate limit exceeded. Please wait a moment before trying again.";
        break;
      case 'form_code_network_error':
        message = "Network error. Please check your connection and try again.";
        break;
      case 'form_code_server_error':
        message = "Server error. Please try again later.";
        break;
      case 'form_code_unknown_error':
        message = "An unknown error occurred. Please try again.";
        break;
      default:
        message = clerkError.longMessage || clerkError.message || message;
    }
  } else if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
    message = "Network error. Please check your connection and try again.";
  } else if (error?.status === 404) {
    message = "The requested resource was not found.";
  } else if (error?.status === 500) {
    message = "Server error. Please try again later.";
  } else if (error?.status === 401) {
    message = "Authentication failed. Please sign in again.";
  } else if (error?.status === 403) {
    message = "You don't have permission to perform this action.";
  } else if (error?.status === 422) {
    // Check if it's a Clerk error with specific error codes
    if (error?.clerkError && error?.errors?.length > 0) {
      const clerkError = error.errors[0];
      switch (clerkError.code) {
        case 'form_password_incorrect':
          message = "The password you entered is incorrect. Please try again.";
          break;
        case 'form_identifier_not_found':
          message = "We couldn't find an account with that email address. Please check your email or create a new account.";
          break;
        default:
          message = clerkError.longMessage || clerkError.message || "Invalid data provided. Please check your input and try again.";
      }
    } else {
      message = "Invalid data provided. Please check your input and try again.";
    }
  }
  
  Alert.alert(title, message, [{ text: "OK" }]);
};

const ErrorNotification: React.FC<ErrorNotificationProps> = ({ error, title = "Error" }) => {
  React.useEffect(() => {
    if (error) {
      showErrorNotification(error, title);
    }
  }, [error, title]);
  
  return null; // This component doesn't render anything
};

export default ErrorNotification; 