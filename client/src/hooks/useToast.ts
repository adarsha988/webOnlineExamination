import * as React from "react";
import { toast } from "../components/ui/use-toast";

export const useToast = () => {
  return {
    toast: (props: {
      title: string;
      description?: string;
      variant?: "default" | "destructive";
      className?: string;
    }) => {
      return toast({
        ...props,
        duration: 3000,
      });
    },
  };
};

export default useToast;
