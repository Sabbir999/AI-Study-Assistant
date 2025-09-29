import { loadStripe } from '@stripe/stripe-js';

// Load Stripe outside of any component
const stripePromise = loadStripe('pk_test_51R8wDoQm4BNg9QaOyslr10UAtpvx4K3PtGeda9m8dDeAwViRGllHAQiOFpt7wrAlNveMRKMB9XJOAi2fFG1zmt4700yPQqTOa7', {
  stripeAccount: undefined,
  // Remove apiVersion as it's causing issues
});

// Replace with your actual Price ID (starts with price_)
export const PRICE_ID = 'price_1R8wKoQm4BNg9QaOrFthVuFf';
export default stripePromise;
