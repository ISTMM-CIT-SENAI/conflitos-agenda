import { createContext, useContext } from 'react';

export interface Feedback {
  sucesso(texto: string): void;
  erro(texto: string): void;
  aviso(texto: string): void;
  info(texto: string): void;
}

export const FeedbackContext = createContext<Feedback | null>(null);

export function useFeedback(): Feedback {
  const feedback = useContext(FeedbackContext);
  if (!feedback) throw new Error('useFeedback deve ser usado dentro de <FeedbackProvider>.');
  return feedback;
}
