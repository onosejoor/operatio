"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  resendVerification,
  signIn,
  signOut,
  signUp,
  verifyEmail,
} from "../api/auth";
import { authKeys } from "./auth-queries";

export function useSignInMutation() {
  return useMutation({ mutationFn: signIn });
}

export function useSignUpMutation() {
  return useMutation({ mutationFn: signUp });
}

export function useVerifyEmailMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.user }),
  });
}

export function useResendVerificationMutation() {
  return useMutation({ mutationFn: resendVerification });
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => queryClient.clear(),
  });
}
